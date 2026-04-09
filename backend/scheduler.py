from apscheduler.schedulers.background import BackgroundScheduler
from database import SessionLocal
from models import Subscriber, SendLog
from news import send_to_subscriber

scheduler = BackgroundScheduler()

def send_to_all():
    db = SessionLocal()
    try:
        subscribers = db.query(Subscriber).filter(Subscriber.active == True).all()
        for sub in subscribers:
            result = send_to_subscriber(sub.phone, sub.topics)
            log = SendLog(
                subscriber_id=sub.id,
                status=result["status"],
                message_preview=result["preview"],
            )
            db.add(log)
        db.commit()
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(send_to_all, "cron", hour=7, minute=30)  # Sends messages daily at 7:30am as a default setting
    scheduler.start()