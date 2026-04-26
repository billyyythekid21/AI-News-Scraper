from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime, timezone
from database import Base

class Subscriber(Base):
    __tablename__ = "subscribers"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, nullable=False)
    topics = Column(String, default="AI, Technology and Science")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SendLog(Base):
    __tablename__ = "send_logs"

    id = Column(Integer, primary_key=True, index=True)
    subscriber_id = Column(Integer, nullable=False)
    status = Column(String)        # "success" | "failed"
    message_preview = Column(String)
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))