from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date   # shto date

class GalleryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "missing"
    age_est: Optional[int] = None
    gender: Optional[str] = None
    case_id: Optional[str] = None
    # Fushat e reja
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
    # Fushat e reja
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
    # Fushat e reja
    id_number: Optional[str] = None
    phone: Optional[str] = None
    residence_location: Optional[str] = None
    photo_location: Optional[str] = None
    station_added: Optional[str] = None
    birth_date: Optional[date] = None
    additional_info: Optional[str] = None
class MatchResult(BaseModel):
    person_id: int
    name: str
    similarity: float
    thumbnail_base64: Optional[str] = None
    id_number: Optional[str] = None
    phone: Optional[str] = None
    residence_location: Optional[str] = None
    photo_location: Optional[str] = None
    station_added: Optional[str] = None
    birth_date: Optional[str] = None
    additional_info: Optional[str] = None
    status: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    
    class Config:
        from_attributes = True