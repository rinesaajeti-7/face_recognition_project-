# backend/app/routers/citizens.py
import face_recognition
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.alert import Alert
from app.models.gallery import Gallery
from app.services.websocket_manager import manager
import logging
import os
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/citizen", tags=["Citizens"])

def get_full_image_path(image_path):
    """Find image in media/, data/gallery/, or root."""
    if not image_path:
        return None
    if image_path.startswith('/') or image_path.startswith('http'):
        return image_path
    # List of possible directories to look for the image
    base_dirs = ['media', 'data/gallery', 'data', '']
    for base in base_dirs:
        if base:
            full = os.path.join(base, image_path)
        else:
            full = image_path
        if os.path.exists(full):
            return full
    # Fallback
    return os.path.join('media', image_path)

def get_face_encoding(image_path):
    """Load image and return face encoding (or None if no face)."""
    img = face_recognition.load_image_file(image_path)
    encodings = face_recognition.face_encodings(img)
    return encodings[0] if encodings else None


# Cache for gallery face encodings (to avoid recomputing every time)
_gallery_encodings_cache = None
_gallery_persons_cache = None

def get_gallery_encodings(db: Session):
    """Load all missing/wanted persons and precompute their face encodings."""
    global _gallery_encodings_cache, _gallery_persons_cache
    if _gallery_encodings_cache is not None:
        return _gallery_encodings_cache, _gallery_persons_cache
    
    persons = db.query(Gallery).filter(Gallery.status.in_(['missing', 'wanted'])).all()
    valid = []
    encodings = []
    for p in persons:
        path = get_full_image_path(p.image_path)
        if not path or not os.path.exists(path):
            logger.warning(f"Image not found: {path} (from DB: {p.image_path})")
            continue
        enc = get_face_encoding(path)
        if enc is not None:
            valid.append(p)
            encodings.append(enc)
        else:
            logger.warning(f"No face detected in {path}")
    _gallery_encodings_cache = encodings
    _gallery_persons_cache = valid
    return encodings, valid


@router.post("/compare-face-with-alerts")
async def compare_face_with_alerts(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file:
        raise HTTPException(400, "Ju lutemi ngarkoni një foto.")
    
    # Save uploaded image to temp file
    temp_path = f"temp_{uuid.uuid4().hex}.jpg"
    try:
        contents = await file.read()
        with open(temp_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(500, f"Error saving file: {e}")
    
    # Get encoding of uploaded face
    uploaded_enc = get_face_encoding(temp_path)
    if uploaded_enc is None:
        os.remove(temp_path)
        return {"matches": [], "message": "Nuk u gjet asnjë fytyrë në foton e ngarkuar."}
    
    # Get all gallery encodings (cached)
    gallery_encodings, persons = get_gallery_encodings(db)
    if not gallery_encodings:
        os.remove(temp_path)
        return {"matches": [], "message": "Nuk ka persona në galeri për krahasim."}
    
    # Compare uploaded face with each gallery face
    results = []
    for i, enc in enumerate(gallery_encodings):
        # Face distance (lower = more similar)
        distance = np.linalg.norm(uploaded_enc - enc)
        similarity = 1 - distance   # approximate; can be adjusted
        # Use a threshold of 0.45 (you can tweak)
        if similarity > 0.45:
            person = persons[i]
            results.append({
                'person_id': person.id,
                'name': person.name,
                'status': person.status,
                'similarity': round(similarity, 3),
                'photo_url': f"/media/{os.path.basename(person.image_path)}",
                'id_number': person.id_number,
                'residence_location': person.residence_location,
                'additional_info': person.additional_info,
                'station_added': person.station_added,
                'birth_date': person.birth_date,
            })
    
    os.remove(temp_path)
    results.sort(key=lambda x: x['similarity'], reverse=True)
    
    if not results:
        return {"matches": [], "message": "Nuk u gjet asnjë person që përputhet me foton tuaj."}
    return {
        "matches": results,
        "message": f"U gjetën {len(results)} persona që mund të përputhen."
    }



# ==================== ENDPOINTET E TJERA ====================
# (Mbaji të njëjta: /check-status, /report, etj.)

@router.post("/check-status")
async def check_status(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    temp_path = f"temp_{uuid.uuid4().hex}.jpg"
    try:
        with open(temp_path, "wb") as f:
            f.write(await file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error saving uploaded file")

    uploaded_image = face_recognition.load_image_file(temp_path)
    uploaded_encodings = face_recognition.face_encodings(uploaded_image)
    
    if len(uploaded_encodings) == 0:
        os.remove(temp_path)
        return {
            "is_missing": False,
            "message": "Nuk u gjet asnjë fytyrë në foton e ngarkuar. Ju lutemi provoni një foto tjetër.",
            "person_info": None
        }
    
    uploaded_encoding = uploaded_encodings[0]
    public_alerts = db.query(Alert).filter(
        Alert.is_public == True,
        Alert.image_path.isnot(None)
    ).all()
    
    best_match = None
    best_distance = 0.6
    
    for alert in public_alerts:
        # Përdor të njëjtën logjikë për rrugën e fotos
        full_path = get_full_image_path(alert.image_path)
        if not os.path.exists(full_path):
            continue
        
        alert_image = face_recognition.load_image_file(full_path)
        alert_encodings = face_recognition.face_encodings(alert_image)
        if len(alert_encodings) == 0:
            continue
        
        alert_encoding = alert_encodings[0]
        distance = np.linalg.norm(uploaded_encoding - alert_encoding)
        if distance < best_distance:
            best_distance = distance
            best_match = alert
    
    os.remove(temp_path)
    
    if best_match:
        return {
            "is_missing": True,
            "message": f"Ky person përputhet me shpalljen publike: {best_match.title}",
            "person_info": {
                "name": best_match.title,
                "status": "missing",
                "description": best_match.message,
                "missing_since": best_match.created_at.strftime("%Y-%m-%d") if best_match.created_at else None
            }
        }
    else:
        return {
            "is_missing": False,
            "message": "Personi nuk u gjet në asnjë shpallje publike.",
            "person_info": None
        }

@router.post("/report")
async def report_person(
    description: str = Form(...),
    location_name: str = Form(None),
    location_lat: float = Form(0),
    location_lng: float = Form(0),
    contact_name: str = Form(None),
    contact_phone: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    safe_name = f"report_{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join("data/citizen_reports", safe_name)
    os.makedirs("data/citizen_reports", exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    alert = Alert(
        title="Raport i ri nga qytetari",
        message=description,
        priority="high",
        reviewed=False,
        is_public=False,
        image_path=safe_name
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    report_data = {
        "alert_id": alert.id,
        "title": alert.title,
        "message": alert.message,
        "location": location_name,
        "image_path": safe_name,
        "timestamp": datetime.now().isoformat()
    }
    await manager.send_new_report_notification(report_data)
    
    return {"id": alert.id, "message": "Report submitted successfully"}