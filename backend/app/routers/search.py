import os
import uuid
import logging
import numpy as np
import face_recognition
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.search import SearchResult
from app.dependencies import get_current_user
from app.models.user import User
from app.models.search import Search
from app.models.gallery import Gallery
import json

logger = logging.getLogger(__name__)
router = APIRouter()

# -----------------------------
# IMAGE PATH HELPER
# -----------------------------
def find_image_path(image_name):
    if not image_name:
        return None
    if image_name.startswith('/') or image_name.startswith('http'):
        return image_name

    for base in ['media', 'data/gallery', 'data', '']:
        path = os.path.join(base, image_name) if base else image_name
        if os.path.exists(path):
            return path
    return None


# -----------------------------
# CACHE
# -----------------------------
_gallery_encodings_cache = None
_gallery_persons_cache = None

def gallery_match_payload(person: Gallery) -> dict:
    return {
        "person_id": person.id,
        "name": person.name,
        "id_number": person.id_number,
        "phone": person.phone,
        "residence_location": person.residence_location,
        "photo_location": person.photo_location,
        "station_added": person.station_added,
        "birth_date": person.birth_date,
        "additional_info": person.additional_info,
        "status": person.status,
        "description": person.description,
    }
def get_gallery_encodings(db: Session):
    global _gallery_encodings_cache, _gallery_persons_cache

    if _gallery_encodings_cache is not None and len(_gallery_encodings_cache) > 0:
        return _gallery_encodings_cache, _gallery_persons_cache

    persons = db.query(Gallery).all()
    valid = []
    encodings = []

    for p in persons:
        path = find_image_path(p.image_path)
        if not path:
            logger.warning(f"Missing image for {p.name}: {p.image_path}")
            continue

        try:
            img = face_recognition.load_image_file(path)
            enc = face_recognition.face_encodings(img)

            if enc:
                valid.append(gallery_match_payload(p))
                encodings.append(enc[0])
            else:
                logger.warning(f"No face found in {path}")

        except Exception as e:
            logger.warning(f"Error processing {path}: {e}")

    _gallery_encodings_cache = np.array(encodings) if encodings else np.array([])
    _gallery_persons_cache = valid

    return _gallery_encodings_cache, _gallery_persons_cache


# -----------------------------
# MAIN ENDPOINT
# -----------------------------
@router.post("/image", response_model=SearchResult)
async def search_image_fast(
    file: UploadFile = File(...),
    use_denoising: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Fast search request: {file.filename}")

    temp_path = f"temp_{uuid.uuid4().hex}.jpg"

    try:
        # -----------------------------
        # SAVE FILE
        # -----------------------------
        contents = await file.read()

        with open(temp_path, "wb") as f:
            f.write(contents)

        # -----------------------------
        # LOAD IMAGE + ENCODING
        # -----------------------------
        uploaded_img = face_recognition.load_image_file(temp_path)
        uploaded_encs = face_recognition.face_encodings(uploaded_img)

    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        logger.exception("Image processing failed")
        raise HTTPException(status_code=500, detail=f"Image processing error: {e}")

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    # -----------------------------
    # NO FACE DETECTED
    # -----------------------------
    if not uploaded_encs:
        result = {
            "is_human": False,
            "matches": [],
            "message": "No face detected in uploaded image.",
            "metadata": {
                "face_detected": False,
                "processing_time": 0.0
            }
        }

        db.add(Search(
            user_id=current_user.id,
            search_type="image",
            result_json=json.dumps(result, default=str)
        ))
        db.commit()

        return SearchResult(**result)

    uploaded_enc = uploaded_encs[0]

    # -----------------------------
    # GET GALLERY
    # -----------------------------
    gallery_encodings, persons = get_gallery_encodings(db)

    if len(gallery_encodings) == 0:
        result = {
            "is_human": True,
            "matches": [],
            "message": "No persons in gallery to compare.",
            "metadata": {
                "gallery_size": 0,
                "face_detected": True,
                "similarity_threshold": 0.45
            }
        }

        db.add(Search(
            user_id=current_user.id,
            search_type="image",
            result_json=json.dumps(result, default=str)
        ))
        db.commit()

        return SearchResult(**result)

    # -----------------------------
    # COMPARE
    # -----------------------------
    distances = np.linalg.norm(gallery_encodings - uploaded_enc, axis=1)
    similarities = 1 - distances

    threshold = 0.45
    matches = []

    for i, sim in enumerate(similarities):
        if sim > threshold:
            p = persons[i]
            matches.append({
                "person_id": p["person_id"],
                "name": p["name"],
                "id_number": p["id_number"],
                "phone": p["phone"],
                "residence_location": p["residence_location"],
                "photo_location": p["photo_location"],
                "station_added": p["station_added"],
                "birth_date": p["birth_date"],
                "additional_info": p["additional_info"],
                "status": p["status"],
                "description": p["description"],
                "similarity": round(float(sim), 3)
            })

    matches.sort(key=lambda x: x["similarity"], reverse=True)

    result = {
        "is_human": True,
        "matches": matches[:10],
        "message": f"Found {len(matches)} similar persons.",
        "metadata": {
            "total_faces_detected": 1,
            "similarity_threshold": threshold,
            "total_matches": len(matches),
            "gallery_size": len(persons),
            "top_similarity": matches[0]["similarity"] if matches else 0
        }
    }

    db.add(Search(
        user_id=current_user.id,
        search_type="image",
        result_json=json.dumps(result, default=str)
    ))
    db.commit()

    return SearchResult(**result)