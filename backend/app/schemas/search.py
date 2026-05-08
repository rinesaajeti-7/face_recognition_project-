from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date

class MatchResult(BaseModel):
    person_id: int
    name: str
    similarity: float
    thumbnail_base64: Optional[str] = None
    
    # Fushat shtesë nga Gallery
    id_number: Optional[str] = None
    phone: Optional[str] = None
    residence_location: Optional[str] = None
    photo_location: Optional[str] = None
    station_added: Optional[str] = None
    birth_date: Optional[date] = None
    additional_info: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None

class SearchResult(BaseModel):
    matches: List[MatchResult]
    metadata: Dict[str, Any]          # mosha, gjinia, etj. (vetëm nëse ka njeri)
    is_human: bool = True             # tregon nëse është zbuluar njeri
    message: Optional[str] = None     # p.sh. "Nuk u zbulua asnjë fytyrë njerëzore"
    detected_objects: Optional[List[str]] = None  # lista e objekteve të zbuluara