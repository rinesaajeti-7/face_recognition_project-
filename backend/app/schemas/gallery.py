# backend/app/schemas/gallery.py (Shto face_encoding në GalleryOut)
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class GalleryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "missing"
    age_est: Optional[int] = None
    gender: Optional[str] = None
    case_id: Optional[str] = None
    id_number: Optional[str] = None
    phone: Optional[str] = None
    residence_location: Optional[str] = None
    photo_location: Optional[str] = None
    station_added: Optional[str] = None
    birth_date: Optional[date] = None
    additional_info: Optional[str] = None

class GalleryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    age_est: Optional[int] = None
    gender: Optional[str] = None
    case_id: Optional[str] = None
    id_number: Optional[str] = None
    phone: Optional[str] = None
    residence_location: Optional[str] = None
    photo_location: Optional[str] = None
    station_added: Optional[str] = None
    birth_date: Optional[date] = None
    additional_info: Optional[str] = None

class GalleryOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    status: str
    image_path: str
    age_est: Optional[int] = None
    gender: Optional[str] = None
    case_id: Optional[str] = None
    created_at: datetime
    last_seen: Optional[datetime] = None
    id_number: Optional[str] = None
    phone: Optional[str] = None
    residence_location: Optional[str] = None
    photo_location: Optional[str] = None
    station_added: Optional[str] = None
    birth_date: Optional[date] = None
    additional_info: Optional[str] = None
    face_encoding: Optional[str] = None  # <--- Shto këtë (opsionale, nuk dërgohet tek frontend)

    class Config:
        from_attributes = True
        