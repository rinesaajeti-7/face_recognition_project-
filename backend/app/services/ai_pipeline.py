import cv2
import numpy as np
from PIL import Image
from io import BytesIO
from app.services.face_service import FaceService
from app.services.matching import gallery_index
from app.db.database import SessionLocal
from app.models.gallery import Gallery
import logging

logger = logging.getLogger(__name__)

def process_image(image_bytes: bytes, use_denoising: bool = False):
    """Pipeline kryesore për njohjen e fytyrave"""
    try:
        # Konverto bytes në imazh RGB
        pil_img = Image.open(BytesIO(image_bytes))
        img_rgb = np.array(pil_img)
        
        # Denoising opsional
        if use_denoising:
            img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
            denoised_bgr = cv2.fastNlMeansDenoisingColored(img_bgr, None, h=10, hColor=10)
            img_rgb = cv2.cvtColor(denoised_bgr, cv2.COLOR_BGR2RGB)
            _, buffer = cv2.imencode('.jpg', denoised_bgr)
            image_bytes_for_encoding = buffer.tobytes()
        else:
            image_bytes_for_encoding = image_bytes
        
        # Nxjerr encoding-un e fytyrës
        query_encoding = FaceService.get_face_encoding(image_bytes_for_encoding)
        
        if query_encoding is None:
            return {
                "matches": [],
                "metadata": {"face_detected": False},
                "is_human": False,
                "message": "No face detected in the image",
                "detected_objects": []
            }
        
        # Kërko në galeri
        results = gallery_index.search(query_encoding, k=5)
        logger.info(f"Gallery search returned {len(results)} results")
        
        # Krijo matches
        db = SessionLocal()
        matches = []
        for person_id, similarity in results:
            person = db.query(Gallery).filter(Gallery.id == person_id).first()
            if person and similarity >= 0.5:  # Threshold 0.5 (50% ngjashmëri)
                matches.append({
                    "person_id": person.id,
                    "name": person.name,
                    "similarity": float(similarity),
                    "id_number": person.id_number or "",
                    "phone": person.phone or "",
                    "residence_location": person.residence_location or "",
                    "photo_location": person.photo_location or "",
                    "status": person.status or "missing"
                })
                logger.info(f"Match found: {person.name} with similarity {similarity:.4f}")
        db.close()
        
        return {
            "matches": matches,
            "metadata": {
                "face_detected": True,
                "matches_found": len(matches)
            },
            "is_human": True,
            "message": f"Found {len(matches)} matches" if matches else "Face detected but no matches found",
            "detected_objects": ["person"]
        }
    except Exception as e:
        logger.error(f"Error in process_image: {str(e)}")
        return {
            "matches": [],
            "metadata": {"error": str(e)},
            "is_human": False,
            "message": f"Error: {str(e)}",
            "detected_objects": []
        }

def process_video(video_bytes: bytes):
    """Përpunimi i videove"""
    return {
        "matches": [],
        "metadata": {"face_detected": False},
        "is_human": False,
        "message": "Video processing not implemented",
        "detected_objects": []
    }
