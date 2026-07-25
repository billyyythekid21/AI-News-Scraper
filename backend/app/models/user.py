import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    bio = Column(Text, default="")
    location = Column(String, nullable=True)
    course = Column(String, nullable=True)
    contact = Column(String, nullable=True)
    interests = Column(String, nullable=True)
    github_username = Column(String, nullable=True)
    github_embedding = Column(Vector(384), nullable=True)
    instagram = Column(String, nullable=True)
    facebook = Column(String, nullable=True)
    website = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    discord = Column(String, nullable=True)
    embedding = Column(Vector(384), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
