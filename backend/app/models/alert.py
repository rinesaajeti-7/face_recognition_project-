from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.sql import func
from app.db.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("gallery.id"), nullable=False)
    search_id = Column(Integer, ForeignKey("searches.id"), nullable=False)
    similarity = Column(Float)
    thumbnail_path = Column(String, nullable=True)
    source = Column(String, nullable=True)  # camera_name or file
    reviewed = Column(Boolean, default=False)
    alert_timestamp = Column(DateTime(timezone=True), server_default=func.now())