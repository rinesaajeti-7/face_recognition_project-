# backend/app/services/age_progression.py
import cv2
import numpy as np
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)

class AgeProgressionTool:
    """Tool për të parashikuar se si do të duket një person pas X vitesh"""
    
    @staticmethod
    def estimate_current_age(birth_date, photo_date=None):
        """Llogarit moshën aktuale nga datëlindja"""
        from datetime import date
        today = date.today()
        if birth_date:
            age = today.year - birth_date.year
            if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
                age -= 1
            return age
        return None
    
    @staticmethod
    def predict_age_progression(age, target_age):
        """
        Parashikon ndryshimet e fytyrës me kalimin e moshës.
        Kthen ndryshimet kryesore që priten.
        """
        age_diff = target_age - age
        
        changes = {
            "age_difference": age_diff,
            "expected_changes": []
        }
        
        if age_diff > 0:
            if age_diff <= 5:
                changes["expected_changes"] = [
                    "Pjekje e lehtë e tipareve të fytyrës",
                    "Mundësi për ndryshim të modelit të flokëve"
                ]
            elif age_diff <= 10:
                changes["expected_changes"] = [
                    "Linja të holla në ballë",
                    "Ndryshim në elasticitetin e lëkurës",
                    "Mundësi për thinja të hershme"
                ]
            elif age_diff <= 20:
                changes["expected_changes"] = [
                    "Linja të theksuara rreth syve dhe gojës",
                    "Humbje e elasticitetit të lëkurës",
                    "Thinja të mundshme",
                    "Ndryshim i strukturës së flokëve"
                ]
            else:
                changes["expected_changes"] = [
                    "Rrudha të theksuara",
                    "Ndryshim i konsiderueshëm i tipareve",
                    "Thinja të plota (nëse parashikohet)",
                    "Humbje e masës muskulore në fytyrë"
                ]
        elif age_diff < 0:
            changes["expected_changes"] = [
                "Fytyrë më e re dhe më e butë",
                "Më pak rrudha",
                "Elasticitet më i lartë i lëkurës"
            ]
        
        return changes

# backend/app/routers/age_progression.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.gallery import Gallery
from app.services.age_progression import AgeProgressionTool
from pydantic import BaseModel
from datetime import date

router = APIRouter()

class AgeProgressionRequest(BaseModel):
    person_id: int
    target_age: int

class AgeEstimateRequest(BaseModel):
    image_file: str  # base64 or path

@router.post("/age-progression/predict")
async def predict_age_progression(
    request: AgeProgressionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Parashikon se si do të duket një person pas X vitesh"""
    
    person = db.query(Gallery).filter(Gallery.id == request.person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Llogarit moshën aktuale
    current_age = AgeProgressionTool.estimate_current_age(person.birth_date)
    
    if current_age is None:
        return {
            "person_id": person.id,
            "name": person.name,
            "current_age": "Unknown",
            "target_age": request.target_age,
            "age_difference": "Unknown",
            "predictions": ["No birth date available for age progression"]
        }
    
    # Parashiko ndryshimet
    predictions = AgeProgressionTool.predict_age_progression(current_age, request.target_age)
    
    return {
        "person_id": person.id,
        "name": person.name,
        "current_age": current_age,
        "target_age": request.target_age,
        "age_difference": request.target_age - current_age,
        "predictions": predictions["expected_changes"],
        "disclaimer": "Kjo është një parashikim i bazuar në modele të përgjithshme. Rezultatet aktuale mund të ndryshojnë."
    }

@router.get("/age-progression/estimate-from-photo")
async def estimate_age_from_photo(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Vlerëson moshën nga fotoja e personit (përdor DeepFace)"""
    try:
        from deepface import DeepFace
        # Kjo do të kërkojë DeepFace të instaluar
        return {"message": "DeepFace required for age estimation from photo"}
    except ImportError:
        return {"message": "Age estimation from photo requires DeepFace library"}