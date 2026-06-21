from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from app.db.database import get_db
from app.models.alert import Alert
from app.models.gallery import Gallery
from app.dependencies import get_current_user
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime
import traceback
import os
import shutil

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

# ========== PYDANTIC MODELS ==========
class AlertResponse(BaseModel):
    id: int
    person_id: Optional[int] = None
    title: Optional[str] = None
    message: Optional[str] = None
    priority: str
    is_read: bool
    reviewed: bool
    is_public: bool = False
    image_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PublicAlertCreate(BaseModel):
    title: str
    message: str
    priority: str = "high"
    image_path: Optional[str] = None  

# ========== ENDPOINTS ==========
@router.get("/", response_model=List[AlertResponse])
def get_alerts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        alerts = db.query(Alert).order_by(desc(Alert.created_at)).offset(skip).limit(limit).all()
        return alerts
    except Exception as e:
        print(f"❌ Error in get_alerts: {e}")
        traceback.print_exc()
        return []

@router.get("/public", response_model=List[AlertResponse])
def get_public_alerts(db: Session = Depends(get_db)):
    public_alerts = db.query(Alert).filter(Alert.is_public == True).order_by(desc(Alert.created_at)).all()
    return public_alerts

@router.post("/public")
def create_public_alert(
    alert_data: PublicAlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        new_alert = Alert(
            title=alert_data.title,
            message=alert_data.message,
            priority=alert_data.priority,
            is_public=True,
            reviewed=False,
            is_read=False,
            image_path=alert_data.image_path 
        )
        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)
        return {"message": "Shpallja publike u krijua", "alert_id": new_alert.id}
    except Exception as e:
        print(f"❌ Error creating public alert: {e}")
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create/{person_id}")
def create_alert_for_person(
    person_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        person = db.query(Gallery).filter(Gallery.id == person_id).first()
        if not person:
            raise HTTPException(status_code=404, detail="Person not found")
        alert = Alert(
            person_id=person_id,
            title=f"Alert for {person.name}",
            message=f"Urgent: Please pay attention to case of {person.name}",
            priority="high",
            reviewed=False,
            is_read=False,
            is_public=False
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        return {"message": "Alert created successfully", "alert_id": alert.id}
    except Exception as e:
        print(f"❌ Error creating alert: {e}")
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{alert_id}/review")
def review_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        alert.reviewed = True
        db.commit()
        return {"message": "Alert reviewed successfully", "alert_id": alert_id}
    except Exception as e:
        print(f"❌ Error reviewing alert: {e}")
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{alert_id}/unreview")
def unreview_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        alert.reviewed = False
        db.commit()
        return {"message": "Alert marked as unreviewed", "alert_id": alert_id}
    except Exception as e:
        print(f"❌ Error unreviewing alert: {e}")
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{alert_id}")
def delete_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        db.delete(alert)
        db.commit()
        return {"message": "Alert deleted successfully"}
    except Exception as e:
        print(f"❌ Error deleting alert: {e}")
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ========== RUAJ NË GALERI (ME KOPJIM FOTOJE) ==========
@router.post("/{alert_id}/save-to-gallery")
def save_alert_to_gallery(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Merr foton nga alerti dhe e ruan në galeri (kopjon skedarin)"""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert or not alert.image_path:
        raise HTTPException(status_code=404, detail="Alert or image not found")
    
    # Përcakto rrugën e plotë të fotos burim
    if alert.image_path.startswith("media/"):
        source_path = alert.image_path
    else:
        source_path = f"data/citizen_reports/{alert.image_path}"
    
    if not os.path.exists(source_path):
        raise HTTPException(status_code=404, detail="Image file not found on server")
    
    # Krijo emër unik për foton e re
    file_extension = os.path.splitext(source_path)[1]
    new_filename = f"gallery_{alert.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{file_extension}"
    dest_path = os.path.join("data/gallery", new_filename)
    
    # Sigurohu që direktoria ekziston
    os.makedirs("data/gallery", exist_ok=True)
    
    # Kopjo skedarin
    shutil.copy2(source_path, dest_path)
    
    # Krijo regjistrim në Gallery
    new_person = Gallery(
        name=alert.title or "Person i raportuar",
        description=alert.message or "Raport nga qytetari",
        status="missing",
        image_path=f"media/{new_filename}",
        source="citizen_report",
        created_at=datetime.now()
    )
    db.add(new_person)
    db.commit()
    db.refresh(new_person)
    
    # Lidh alarmin me personin e ri dhe shëno të shqyrtuar
    alert.person_id = new_person.id
    alert.reviewed = True
    db.commit()
    
    return {"message": "Personi u ruajt në galeri", "gallery_id": new_person.id}