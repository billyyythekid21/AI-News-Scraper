# csoc (working name)

A social app for uni students (mostly for CS/IT students, but all are welcome) to find friends, match with peers, and organise campus events.

> In early development. Not open source (yet).

---

## What it is



csoc helps students connect beyond lectures and group chats — match with people who share your course or interests, then actually meet through campus events.

---

## What you can do

- Sign up and build a profile (bio, course, interests, social links, GitHub)
- Get match suggestions and like/pass until you find mutual matches
- Unlock socials and icebreakers when it’s mutual between matches
- Post events and RSVP to them
- Search people and events
- Upload a timetable (`.ics`) so you can find mutual free time to spend with others
- Get notified (web push)



---

## How it works

1. Create an account and fill out a profile.
2. Browse ranked suggestions based on your profile (and GitHub profiles, if linked).
3. Like or pass; mutual matches unlock contact and icebreakers.
4. Use events and search to meet people offline.



---

## Stack


| Layer    | Tech                                                    |
| -------- | ------------------------------------------------------- |
| Frontend | React, TypeScript, Vite, Tailwind                       |
| Backend  | FastAPI, SQLAlchemy, PostgreSQL + pgvector              |
| Matching | Embeddings + ranking                                    |
| AI       | Google Gemini (icebreakers, may switch to Claude later) |


---

## Status

Early development. Features, APIs, and UX/UI experience are all subject to change.