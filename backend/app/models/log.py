from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())