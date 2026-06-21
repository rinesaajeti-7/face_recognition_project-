# backend/app/models/gallery.py (Shto këtë fushë)
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Date
from sqlalchemy.sql import func
from app.db.database import Base

class Gallery(Base):
    __tablename__ = "gallery"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="missing")
    image_path = Column(String, nullable=False)
    embedding_path = Column(String, nullable=True)
    age_est = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    case_id = Column(String, nullable=True)
    last_seen = Column(DateTime(timezone=True), nullable=True)
    
    # Fushat ekzistuese
    id_number = Column(String, unique=True, nullable=True)
    phone = Column(String, nullable=True)
    residence_location = Column(String, nullable=True)
    photo_location = Column(String, nullable=True)
    station_added = Column(String, nullable=True)
    birth_date = Column(Date, nullable=True)
    additional_info = Column(Text, nullable=True)
    
    # FUSHA E RE - Për ruajtjen e encoding-ut si JSON string
    face_encoding = Column(Text, nullable=True)  # <--- Shto këtë!
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    