from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from database import engine, get_db, Base
from models import Subscriber, SendLog
from scheduler import start_scheduler, send_to_all
from news import send_to_subscriber

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Schemas ---
class SubscriberCreate(BaseModel):
    phone:  str
    topics: str = "AI, Technology and Science"

class SubscriberUpdate(BaseModel):
    topics: str
    active: bool


# --- Routes ---
@app.on_event("startup")
def on_startup():
    start_scheduler()


@app.post("/subscribe")
def subscribe(payload: SubscriberCreate, db: Session = Depends(get_db)):
    existing = db.query(Subscriber).filter(Subscriber.phone == payload.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already subscribed")
    sub = Subscriber(phone=payload.phone, topics=payload.topics)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@app.get("/subscribers")
def get_subscribers(db: Session = Depends(get_db)):
    return db.query(Subscriber).all()


@app.patch("/subscriber/{id}")
def update_subscriber(id: int, payload: SubscriberUpdate, db: Session = Depends(get_db)):
    sub = db.query(Subscriber).filter(Subscriber.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    sub.topics = payload.topics
    sub.active = payload.active
    db.commit()
    db.refresh(sub)
    return sub


@app.delete("/subscriber/{id}")
def delete_subscriber(id: int, db: Session = Depends(get_db)):
    sub = db.query(Subscriber).filter(Subscriber.id == id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    db.delete(sub)
    db.commit()
    return {"detail": "Deleted"}


@app.post("/send-now")
def send_now(db: Session = Depends(get_db)):
    send_to_all()
    return {"detail": "News sent to all active subscribers"}


@app.get("/logs")
def get_logs(db: Session = Depends(get_db)):
    return db.query(SendLog).order_by(SendLog.sent_at.desc()).all()


@app.get("/")
def root():
    return {"status": "AI News Scraper API running"}