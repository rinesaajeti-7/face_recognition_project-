from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Citizen(Base):
    __tablename__ = "citizens"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50))
    points = Column(Integer, default=0)
    badge_level = Column(String(50), default="Bronze")  # Bronze, Silver, Gold
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), nullable=True)
    last_active = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    reports = relationship("CitizenReport", back_populates="citizen", cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="citizen", cascade="all, delete-orphan")
    chat_history = relationship("CitizenChatHistory", back_populates="citizen", cascade="all, delete-orphan")


class CitizenReport(Base):
    __tablename__ = "citizen_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    citizen_id = Column(Integer, ForeignKey("citizens.id", ondelete="CASCADE"))
    gallery_id = Column(Integer, ForeignKey("gallery.id", ondelete="SET NULL"), nullable=True)
    image_path = Column(String(500))
    description = Column(Text)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    location_name = Column(String(500), nullable=True)
    status = Column(String(50), default="pending")  # pending, verified, rejected, resolved
    police_notes = Column(Text, nullable=True)
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reported_at = Column(DateTime, default=func.now())
    verified_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Relationships
    citizen = relationship("Citizen", back_populates="reports")
    person = relationship("Gallery", foreign_keys=[gallery_id])
    verifier = relationship("User", foreign_keys=[verified_by])


class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    citizen_id = Column(Integer, ForeignKey("citizens.id", ondelete="CASCADE"))
    achievement_type = Column(String(100))
    points_awarded = Column(Integer, default=10)
    awarded_at = Column(DateTime, default=func.now())
    
    # Relationships
    citizen = relationship("Citizen", back_populates="achievements")


class CitizenChatHistory(Base):
    __tablename__ = "citizen_chat_history"
    
    id = Column(Integer, primary_key=True, index=True)
    citizen_id = Column(Integer, ForeignKey("citizens.id", ondelete="CASCADE"))
    message = Column(Text)
    response = Column(Text, nullable=True)
    context_person_id = Column(Integer, ForeignKey("gallery.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    citizen = relationship("Citizen", back_populates="chat_history")
    context_person = relationship("Gallery", foreign_keys=[context_person_id])