import json
import os
import uuid
from datetime import datetime

import anthropic
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pywebpush import webpush, WebPushException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import Base, engine, get_db
from app.models.user import User
from app.models.match import MatchRecord
from app.models.event import Event
from app.models.push_subscription import PushSubscription
from app.models.rsvp import RSVP
from app.models.availability import Availability
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.ml.embeddings import embed_profile, embed_text, blend_embeddings
from app.ml.ranking import get_trained_model, rank_candidates
from app.services.github import fetch_github_repos
from app.services.timetable import parse_ical, find_availability, find_available_blocks

Base.metadata.create_all(bind=engine)

app = FastAPI(title="csoc_api")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY")
VAPID_CLAIMS = {"sub": "mailto:your@email.com"}

# ===== Schemas: Users =====


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserProfileUpdate(BaseModel):
    bio: str | None = None
    location: str | None = None
    course: str | None = None
    contact: str | None = None
    interests: str | None = None
    github_username: str | None = None
    instagram: str | None = None
    facebook: str | None = None
    website: str | None = None
    contact_email: str | None = None
    discord: str | None = None

class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    location: str | None = None
    starts_at: datetime | None = None
    tags: str | None = None


# ===== Schemas: Matches =====


class MatchAction(BaseModel):
    to_user_id: str
    action: str  # "like" or "pass"


# ===== Schemas: Events =====


class EventCreate(BaseModel):
    title: str
    description: str
    location: str
    starts_at: datetime
    tags: str


# ===== Health =====


@app.get("/")
async def health_check():
    return {"status": "ok"}


# ===== Users & Auth =====
@app.get("/users")
def list_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": str(u.id), "username": u.username} for u in users]

@app.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if len(user.password) > 72:
        raise HTTPException(status_code=400, detail="Password too long")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already in use")
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {
        "id": str(db_user.id),
        "username": db_user.username,
        "email": db_user.email,
    }


@app.post("/login")
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(
        credentials.password, user.hashed_password
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user.id))
    return {"token": token}


@app.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email,
        "bio": current_user.bio,
        "location": current_user.location,
        "course": current_user.course,
        "contact": current_user.contact,
        "interests": current_user.interests,
        "github_username": current_user.github_username,
        "instagram": current_user.instagram,
        "facebook": current_user.facebook,
        "website": current_user.website,
        "contact_email": current_user.contact_email,
        "discord": current_user.discord,
    }


@app.patch("/me")
def update_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # save fields to current user
    if payload.bio:
        current_user.bio = payload.bio
    if payload.location:
        current_user.location = payload.location
    if payload.course:
        current_user.course = payload.course
    if payload.contact:
        current_user.contact = payload.contact
    if payload.interests:
        current_user.interests = payload.interests
    if payload.github_username:
        current_user.github_username = payload.github_username
    if payload.instagram:
        current_user.instagram = payload.instagram
    if payload.facebook:
        current_user.facebook = payload.facebook
    if payload.website:
        current_user.website = payload.website
    if payload.contact_email:
        current_user.contact_email = payload.contact_email
    if payload.discord:
        current_user.discord = payload.discord

    # embed profile from current user fields
    profile_embedding = embed_profile(
        bio=current_user.bio or "",
        course=current_user.course or "",
        interests=current_user.interests or "",
    )

    # handle github embedding
    if current_user.github_username:
        github_text = fetch_github_repos(current_user.github_username)
        if github_text:
            github_embedding = embed_text(github_text)
            current_user.embedding = blend_embeddings(profile_embedding, github_embedding)
            current_user.github_embedding = github_embedding
        else:
            # github failed, use profile embedding
            current_user.embedding = profile_embedding
            current_user.github_embedding = None
    else:
        # no github, just use profile embedding
        current_user.embedding = profile_embedding

    db.commit()
    db.refresh(current_user)
    return {"username": current_user.username, "email": current_user.email}

@app.delete("/me")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # delete all related data before the user is deleted
    db.query(MatchRecord).filter(
        (MatchRecord.from_user_id == str(current_user.id)) |
        (MatchRecord.to_user_id == str(current_user.id))
    ).delete(synchronize_session=False)

    db.query(RSVP).filter(RSVP.user_id == str(current_user.id)).delete()

    db.query(PushSubscription).filter(
        PushSubscription.user_id == str(current_user.id)
    ).delete()

    db.delete(current_user)
    db.commit()
    return {"status": "ok"}

# ===== Matches =====


@app.get("/matches")
def get_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    course: str | None = None,
):
    if current_user.embedding is None:
        raise HTTPException(
            status_code=400, detail="Complete your profile first"
        )

    actioned_ids = (
        db.query(MatchRecord.to_user_id)
        .filter(MatchRecord.from_user_id == str(current_user.id))
        .all()
    )
    actioned_ids = [uuid.UUID(r[0]) for r in actioned_ids]

    def build_query(exclude_actioned: bool):
        q = (
            db.query(User)
            .filter(User.id != current_user.id)
            .filter(User.embedding.isnot(None))
        )
        if exclude_actioned:
            q = q.filter(User.id.notin_(actioned_ids))
        if course:
            q = q.filter(User.course.ilike(f"%{course}%"))
        return q

    # pull a larger pool of 100 candidates so the ranking has more to work with
    candidates = (
        build_query(exclude_actioned=True)
        .order_by(User.embedding.cosine_distance(current_user.embedding))
        .limit(100)
        .all()
    )

    # if every available person has already been actioned, clear this user's
    # "pass" history so the deck fills back up. likes are kept so mutual
    # matches are preserved and already-liked people don't reappear.
    if not candidates and build_query(exclude_actioned=False).count() > 0:
        db.query(MatchRecord).filter(
            MatchRecord.from_user_id == str(current_user.id),
            MatchRecord.action == "pass",
        ).delete()
        db.commit()

        actioned_ids = (
            db.query(MatchRecord.to_user_id)
            .filter(MatchRecord.from_user_id == str(current_user.id))
            .all()
        )
        actioned_ids = [uuid.UUID(r[0]) for r in actioned_ids]

        candidates = (
            build_query(exclude_actioned=True)
            .order_by(
                User.embedding.cosine_distance(current_user.embedding)
            )
            .limit(100)
            .all()
        )

    # train model on like/pass history and re-rank
    model = get_trained_model(db, current_user)
    ranked = rank_candidates(current_user, candidates, model)

    return [
        {
            "id": str(candidate.id),
            "username": candidate.username,
            "email": candidate.email,
            "bio": candidate.bio,
            "location": candidate.location,
            "course": candidate.course,
            "contact": candidate.contact,
            "interests": candidate.interests,
            "github_username": candidate.github_username,
            "instagram": candidate.instagram,
            "facebook": candidate.facebook,
            "website": candidate.website,
            "contact_email": candidate.contact_email,
            "discord": candidate.discord,
        }
        for candidate, score in ranked[:20]
    ]


@app.post("/matches/action")
def match_action(
    payload: MatchAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.action not in ["like", "pass"]:
        raise HTTPException(
            status_code=400, detail="Action must be like or pass"
        )

    def other_side_likes_me() -> bool:
        return (
            db.query(MatchRecord)
            .filter(
                MatchRecord.from_user_id == payload.to_user_id,
                MatchRecord.to_user_id == str(current_user.id),
                MatchRecord.action == "like",
            )
            .first()
            is not None
        )

    existing_record = (
        db.query(MatchRecord)
        .filter(
            MatchRecord.from_user_id == str(current_user.id),
            MatchRecord.to_user_id == payload.to_user_id,
        )
        .first()
    )

    # same action already recorded: no-op, so repeatedly liking an existing
    # mutual match can't be used to re-trigger notifications or pile up rows
    if existing_record and existing_record.action == payload.action:
        is_mutual = other_side_likes_me() if payload.action == "like" else False
        return {"is_mutual": is_mutual}

    was_mutual_before = (
        existing_record is not None
        and existing_record.action == "like"
        and other_side_likes_me()
    )
    is_mutual = other_side_likes_me() if payload.action == "like" else False

    # only notify on the actual transition into a mutual match, not every
    # like/pass toggle after that
    if is_mutual and not was_mutual_before:
        send_push_notification(
            db,
            payload.to_user_id,
            "You have a new match!",
            f"You and {current_user.username} liked each other!",
        )

    if existing_record:
        existing_record.action = payload.action
    else:
        db.add(
            MatchRecord(
                from_user_id=str(current_user.id),
                to_user_id=payload.to_user_id,
                action=payload.action,
            )
        )
    db.commit()

    return {"is_mutual": is_mutual}


@app.get("/matches/mutual")
def get_mutual_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # get everyone current user liked
    liked = (
        db.query(MatchRecord.to_user_id)
        .filter(
            MatchRecord.from_user_id == str(current_user.id),
            MatchRecord.action == "like",
        )
        .all()
    )
    liked_ids = [r[0] for r in liked]

    # get everyone who liked current user back
    mutual_ids = (
        db.query(MatchRecord.from_user_id)
        .filter(
            MatchRecord.from_user_id.in_(liked_ids),
            MatchRecord.to_user_id == str(current_user.id),
            MatchRecord.action == "like",
        )
        .all()
    )
    mutual_ids = [r[0] for r in mutual_ids]

    users = db.query(User).filter(User.id.in_(mutual_ids)).all()

    return [
        {
            "id": str(u.id),
            "username": u.username,
            "bio": u.bio,
            "course": u.course,
            "interests": u.interests,
            "location": u.location,
            "contact": u.contact,
            "github_username": u.github_username,
            "instagram": u.instagram,
            "facebook": u.facebook,
            "website": u.website,
            "contact_email": u.contact_email,
            "discord": u.discord,
        }
        for u in users
    ]


@app.get("/matches/liked")
def get_liked_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    People the current user has liked but who haven't liked back. 
    Already-mutual matches are excluded since those show up on /matches/mutual instead.
    """
    liked = (
        db.query(MatchRecord.to_user_id)
        .filter(
            MatchRecord.from_user_id == str(current_user.id),
            MatchRecord.action == "like",
        )
        .all()
    )
    liked_ids = [r[0] for r in liked]

    mutual_ids = (
        db.query(MatchRecord.from_user_id)
        .filter(
            MatchRecord.from_user_id.in_(liked_ids),
            MatchRecord.to_user_id == str(current_user.id),
            MatchRecord.action == "like",
        )
        .all()
    )
    mutual_ids = {r[0] for r in mutual_ids}

    pending_ids = [i for i in liked_ids if i not in mutual_ids]
    users = db.query(User).filter(User.id.in_(pending_ids)).all()

    return [
        {
            "id": str(u.id),
            "username": u.username,
            "bio": u.bio,
            "course": u.course,
            "interests": u.interests,
            "location": u.location,
        }
        for u in users
    ]

@app.delete("/matches/action/{user_id}")
def unlike_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = db.query(MatchRecord).filter(
        MatchRecord.from_user_id == str(current_user.id),
        MatchRecord.to_user_id == user_id,
        MatchRecord.action == "like",
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Like not found")

    db.delete(record)
    db.commit()
    return {"status": "ok"}

# ===== Events =====


@app.post("/events")
def create_event(
    payload: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = Event(
        organizer_id=str(current_user.id),
        organizer_username=current_user.username,
        title=payload.title,
        description=payload.description,
        location=payload.location,
        starts_at=payload.starts_at,
        tags=payload.tags,
        embedding=embed_text(payload.title + " " + payload.description + " " + payload.location + " " + payload.tags),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return {"id": str(event.id), "title": event.title}


@app.get("/events")
def get_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.embedding is None:
        events = (
            db.query(Event)
            .filter(Event.is_deleted == False)
            .order_by(Event.starts_at.asc())
            .all()
        )
    else:
        events = (
            db.query(Event)
            .filter(Event.is_deleted == False)
            .order_by(Event.embedding.cosine_distance(current_user.embedding))
            .all()
        )

    return [
        {
            "id": str(e.id),
            "title": e.title,
            "description": e.description,
            "location": e.location,
            "starts_at": e.starts_at.isoformat(),
            "tags": e.tags,
            "organizer": e.organizer_username,
        }
        for e in events
    ]


# ===== RSVPs =====


@app.post("/events/{event_id}/rsvp")
def rsvp_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(RSVP)
        .filter(RSVP.event_id == event_id, RSVP.user_id == str(current_user.id))
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already RSVP'd")

    rsvp = RSVP(
        event_id=event_id,
        user_id=str(current_user.id),
        username=current_user.username,
    )
    db.add(rsvp)
    db.commit()
    return {"status": "ok"}


@app.delete("/events/{event_id}/rsvp")
def delete_rsvp(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rsvp = (
        db.query(RSVP)
        .filter(RSVP.event_id == event_id, RSVP.user_id == str(current_user.id))
        .first()
    )
    if not rsvp:
        raise HTTPException(status_code=404, detail="ERROR: RSVP Not found")
    db.delete(rsvp)
    db.commit()
    return {"status": "ok"}


@app.get("/events/{event_id}/rsvps")
def get_rsvps(event_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rsvps = db.query(RSVP).filter(RSVP.event_id == event_id).all()
    return [{"username": r.username} for r in rsvps]


# ===== Search =====


@app.get("/search")
def search(q: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    users = (
        db.query(User)
        .filter(
            User.username.ilike(f"%{q}%")
            | User.course.ilike(f"%{q}%")
            | User.interests.ilike(f"%{q}%")
            | User.location.ilike(f"%{q}%")
        )
        .limit(20)
        .all()
    )  # First 20 results

    events = (
        db.query(Event)
        .filter(
            Event.title.ilike(f"%{q}%")
            | Event.description.ilike(f"%{q}%")
            | Event.tags.ilike(f"%{q}%")
            | Event.location.ilike(f"%{q}%")
        )
        .filter(Event.is_deleted == False)
        .limit(20)
        .all()
    )  # First 20 results

    return {
        "users": [
            {
                "id": str(u.id),
                "username": u.username,
                "course": u.course,
                "interests": u.interests,
                "location": u.location,
            }
            for u in users
        ],
        "events": [
            {
                "id": str(e.id),
                "title": e.title,
                "location": e.location,
                "starts_at": e.starts_at.isoformat(),
                "organizer": e.organizer_username,
            }
            for e in events
        ],
    }


# ===== Icebreakers =====


@app.get("/matches/mutual/{user_id}/icebreaker")
def get_icebreaker(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    other_user = db.query(User).filter(User.id == user_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")

    i_liked_them = db.query(MatchRecord).filter(
        MatchRecord.from_user_id == str(current_user.id),
        MatchRecord.to_user_id == user_id,
        MatchRecord.action == "like"
    ).first()

    they_liked_me = db.query(MatchRecord).filter(
        MatchRecord.from_user_id == user_id,
        MatchRecord.to_user_id == str(current_user.id),
        MatchRecord.action == "like"
    ).first()

    if not i_liked_them or not they_liked_me:
        raise HTTPException(status_code=403, detail="Not a mutual match")

    client = anthropic.Anthropic(
        api_key=os.getenv("ANTHROPIC_API_KEY")
    )

    prompt = f"""
		Two CS students just matched on a social app called CSOC.
		
	Person A: {current_user.username}
	Course: {current_user.course or "unknown"}
	Interests: {current_user.interests or "unknown"}
	Bio: {current_user.bio or "none"}
	
	Person B: {other_user.username}
	Course: {other_user.course or "unknown"}
	Interests: {other_user.interests or "unknown"}
	Bio: {other_user.bio or "none"}
	
	Write one short, natural conversation starter that Person A could send to Person B. 
	Reference something specific they have in common. Keep it casual, friendly, and under 2 sentences. 
	Return only the message, nothing else.
	"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}],
    )

    return {"icebreaker": message.content[0].text}


# ===== Notifications =====
@app.get("/push/vapid-public-key")
def get_vapid_public_key():
    return {"public_key": VAPID_PUBLIC_KEY}

@app.post("/push/subscribe")
def subscribe(
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    endpoint = payload.get("endpoint", "")
    keys = payload.get("keys", {})
    existing = db.query(PushSubscription).filter(
        PushSubscription.user_id == str(current_user.id),
        PushSubscription.endpoint == endpoint
    ).first()
    if existing:
        return {"status": "already subscribed"}

    subscription = PushSubscription(
        user_id=str(current_user.id),
        endpoint=endpoint,
        p256dh=keys["p256dh"],
        auth=keys["auth"],
    )
    db.add(subscription)
    db.commit()
    return {"status": "ok"}

def send_push_notification(db: Session, user_id: str, title: str, body: str):
    subs = db.query(PushSubscription).filter(
        PushSubscription.user_id == user_id
    ).all()

    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh,
                        "auth": sub.auth,
                    },
                },
                data=json.dumps({"title": title, "body": body}),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS,
            )
        except WebPushException:
            # subscription expired, clean it up
            db.delete(sub)
            db.commit()

# ===== Timetable Availability =====
@app.post("/me/timetable")
async def get_availability(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file = await file.read()
    calendar = parse_ical(file)
    occupied = find_availability(calendar)
    free_blocks = find_available_blocks(occupied)

    # delete user's existing availability and insert new free blocks
    db.query(Availability).filter(
        Availability.user_id == str(current_user.id)
    ).delete()

    for day, block in free_blocks:
        db.add(Availability(
            user_id=str(current_user.id),
            day=day,
            block=block,
        ))
    db.commit()
    return {"slots_saved": len(free_blocks)}

# ===== Event Management =====
@app.delete("/events/{event_id}")
def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="ERROR: Event not found")

    if event.organizer_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="ERROR: You are not the organiser of this event")

    event.is_deleted = True
    db.commit()
    return {"status": "ok"}

@app.patch("/events/{event_id}")
def update_event(
    payload: EventUpdate,
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="ERROR: Event not found")

    if event.organizer_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="ERROR: You are not the organiser of this event")

    if payload.title:
        event.title = payload.title
    if payload.description:
        event.description = payload.description
    if payload.location:
        event.location = payload.location
    if payload.starts_at:
        event.starts_at = payload.starts_at
    if payload.tags:
        event.tags = payload.tags

    if payload.title or payload.description or payload.tags:
        event.embedding = embed_text(
        f"{event.title} {event.description} {event.location} {event.tags}"
        )

    db.commit()
    return {"status": "ok"}

# ===== Event List =====
@app.get("/events")
def get_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 10,
):
    total = db.query(Event).filter(Event.is_deleted == False).filter(Event.starts_at >= datetime.utcnow()).count()

    return {"events": [...], "total": total}
