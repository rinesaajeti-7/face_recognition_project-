from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CitizenCreate(BaseModel):
    email: str
    full_name: str
    phone: str
    password: str

class CitizenLogin(BaseModel):
    email: str
    password: str

class CitizenResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    points: int
    badge_level: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class CitizenReportCreate(BaseModel):
    citizen_id: int
    description: str
    location_name: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None

class CitizenReportResponse(BaseModel):
    id: int
    citizen_id: int
    gallery_id: Optional[int]
    image_path: str
    description: str
    location_name: Optional[str]
    status: str
    police_notes: Optional[str]
    reported_at: datetime
    verified_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class StatusCheckResponse(BaseModel):
    is_missing: bool
    message: str
    person_info: Optional[dict]

class AchievementResponse(BaseModel):
    id: int
    achievement_type: str
    points_awarded: int
    awarded_at: datetime
    
    class Config:
        from_attributes = TrueX

