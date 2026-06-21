from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("gallery.id", ondelete="CASCADE"))
    search_id = Column(Integer, nullable=True)
    similarity = Column(Float, default=0.0, nullable=True)
    thumbnail_path = Column(String(500), nullable=True)
    source = Column(String(100), default="system", nullable=True)
    reviewed = Column(Boolean, default=False)
    alert_timestamp = Column(DateTime, default=func.now())
    title = Column(String(255), nullable=True)
    message = Column(Text, nullable=True)
    priority = Column(String(50), default="medium")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_public = Column(Boolean, default=False)           # <- e rëndësishme
    image_path = Column(String, nullable=True)   
    person_id = Column(Integer, ForeignKey("gallery.id"), nullable=True) 

    # Relationship
    person = relationship("Gallery", foreign_keys=[person_id])