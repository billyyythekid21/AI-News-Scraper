"""Seed random test users for local development.

Usage (from backend/, with the venv active):
    ../.venv/bin/python seed_test_users.py [count]

Creates users with a shared test password, realistic-ish random profile
data, and precomputed embeddings so they show up immediately in /matches.
"""
import random
import sys

from app.auth import hash_password
from app.db.session import Base, SessionLocal, engine
from app.ml.embeddings import embed_profile
from app.models.user import User

TEST_PASSWORD = "TestPass123!"

FIRST_NAMES = [
    "Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Jamie",
    "Avery", "Quinn", "Drew", "Skyler", "Reese", "Rowan", "Kai", "Elliot",
    "Harper", "Finley", "Sage", "Emerson",
]

COURSES = [
    "Computer Science", "Software Engineering", "Data Science",
    "Information Technology", "Cybersecurity", "Artificial Intelligence",
    "Business Analytics", "Mechatronics Engineering", "Mathematics",
    "Digital Media Design",
]

LOCATIONS = [
    "Clayton", "Caulfield", "Melbourne CBD", "Southbank", "St Kilda",
    "Brunswick", "Richmond", "Fitzroy", "Carlton", "Docklands",
]

INTERESTS_POOL = [
    "hiking", "chess", "machine learning", "gaming", "anime", "basketball",
    "music production", "photography", "cooking", "sci-fi novels",
    "rock climbing", "board games", "cycling", "volleyball",
    "open source", "competitive programming", "film", "3D printing",
    "badminton", "coffee",
]

BIO_TEMPLATES = [
    "Just here to meet fellow {course} students and talk about {i1}.",
    "{course} student who spends too much time on {i1} and {i2}.",
    "Always down for a good {i1} session or debating tabs vs spaces.",
    "Trying to survive {course} one assignment at a time. Into {i1}.",
    "Looking for study buddies and maybe a {i1} partner.",
]

# Well-known GitHub accounts so the GitHub UI has something
# to point at without needing to hit the GitHub API for every seed user.
GITHUB_USERNAMES = [
    "torvalds", "gaearon", "sindresorhus", "yyx990803", "tj",
    "addyosmani", "kentcdodds", "ry", "antirez", "mitchellh",
]


def random_user(existing_usernames: set[str], existing_emails: set[str]) -> User:
    first = random.choice(FIRST_NAMES)
    for _ in range(50):
        suffix = random.randint(1, 9999)
        username = f"{first}{suffix}"
        email = f"{username.lower()}@student.example.edu"
        if username not in existing_usernames and email not in existing_emails:
            break
    else:
        raise RuntimeError("Could not generate a unique username, try again")

    existing_usernames.add(username)
    existing_emails.add(email)

    course = random.choice(COURSES)
    location = random.choice(LOCATIONS)
    interests = random.sample(INTERESTS_POOL, k=random.randint(2, 4))
    bio = random.choice(BIO_TEMPLATES).format(
        course=course, i1=interests[0], i2=interests[-1]
    )
    contact = f"{username.lower()}#{random.randint(1000, 9999)}"

    return User(
        username=username,
        email=email,
        hashed_password=hash_password(TEST_PASSWORD),
        bio=bio,
        location=location,
        course=course,
        contact=contact,
        interests=", ".join(interests),
        embedding=embed_profile(bio=bio, course=course, interests=", ".join(interests)),
        github_username=random.choice(GITHUB_USERNAMES),
        instagram=f"https://instagram.com/{username.lower()}",
        facebook=f"https://facebook.com/{username.lower()}",
        website=f"https://{username.lower()}.dev",
        contact_email=email,
        discord=username.lower(),
    )


def main(count: int) -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing_usernames = {u for (u,) in db.query(User.username).all()}
        existing_emails = {e for (e,) in db.query(User.email).all()}

        created = []
        for _ in range(count):
            user = random_user(existing_usernames, existing_emails)
            db.add(user)
            created.append(user)
        db.commit()

        print(f"Created {len(created)} test users (password: {TEST_PASSWORD}):")
        for u in created:
            print(f"  - {u.username} <{u.email}> | {u.course} | {u.location}")
    finally:
        db.close()


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    main(n)
