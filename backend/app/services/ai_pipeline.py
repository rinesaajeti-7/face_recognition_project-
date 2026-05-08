import cv2
import numpy as np
from io import BytesIO
from PIL import Image
from app.services.face_service import FaceService
from app.services.matching import gallery_index
from app.db.database import SessionLocal
from app.models.gallery import Gallery
from app.services.age_gender import analyze_age_gender
from app.services.denoising import denoise_image
import face_recognition

# ------------------------------
# Zbulim i thjeshtë i fytyrës me HAAR Cascade
# ------------------------------
def has_face(image_bytes: bytes) -> bool:
    """
    Kthen True nëse imazhi përmban të paktën një fytyrë njerëzore.
    """
    pil_img = Image.open(BytesIO(image_bytes))
    img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    
    return len(faces) > 0

# ------------------------------
# Pipeline kryesore për imazhe (foto)
# ------------------------------
def process_image(image_bytes: bytes, use_denoising: bool = False):
    """
    Kthen një dictionary me çelësat:
        matches, metadata, is_human, message, detected_objects
    """
    db = SessionLocal()
    try:
        # Konvertim fillestar
        pil_img = Image.open(BytesIO(image_bytes))
        img_rgb = np.array(pil_img)

        # Denoising opsional
        if use_denoising:
            img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
            denoised_bgr = cv2.fastNlMeansDenoisingColored(img_bgr, None, h=10, hColor=10,
                                                           templateWindowSize=7, searchWindowSize=21)
            img_rgb = cv2.cvtColor(denoised_bgr, cv2.COLOR_BGR2RGB)
            _, buffer = cv2.imencode('.jpg', denoised_bgr)
            image_bytes_for_encoding = buffer.tobytes()
        else:
            image_bytes_for_encoding = image_bytes

        # 1. Përpiqemi të marrim encoding e fytyrës (metoda e saktë e face_recognition)
        query_encoding = FaceService.get_face_encoding(image_bytes_for_encoding)

        # Nëse nuk ka encoding, do të thotë se nuk u zbulua fytyrë
        if query_encoding is None:
            # Kontrollojmë nëse ka fytyrë me HAAR (për rastet kur fytyra është shumë e vogël ose e paqartë)
            face_exists = has_face(image_bytes)
            if face_exists:
                message = "Fotografia përmban një person, por fytyra nuk është e dukshme ose e qartë."
                detected = ["person"]
            else:
                message = "Kjo foto nuk përmban një fytyrë njerëzore."
                detected = []
            return {
                "matches": [],
                "metadata": {
                    "face_detected": False,
                    "gender": None,
                    "age": None,
                    "error": "No face detected"
                },
                "is_human": face_exists,
                "message": message,
                "detected_objects": detected
            }

        # 2. Nëse ka fytyrë, analizojmë moshën dhe gjininë
        gender, age, _ = analyze_age_gender(img_bytes=image_bytes)

        # 3. Kërkojmë në galeri
        results = gallery_index.search(query_encoding, k=3)
        matches = []
        for person_id, similarity in results:
            # Brenda ciklit for person_id, similarity in results:
            person = db.query(Gallery).filter(Gallery.id == person_id).first()
            if person:
                matches.append({
                    "person_id": person_id,
                    "name": person.name,
                    "similarity": round(similarity, 4),
                    "image": person.image_path,
                    "age": age,
                    "gender": gender,
                    # Fushat e reja:
                    "id_number": person.id_number,
                    "phone": person.phone,
                    "residence_location": person.residence_location,
                    "photo_location": person.photo_location,
                    "station_added": person.station_added,
                    "birth_date": person.birth_date.isoformat() if person.birth_date else None,
                    "additional_info": person.additional_info,
                    "status": person.status
                })

        # Kthe rezultatet e suksesshme
        return {
            "matches": matches,
            "metadata": {
                "face_detected": True,
                "matches_found": len(matches),
                "gender": gender,
                "age": age,
                "denoising_used": use_denoising
            },
            "is_human": True,
            "message": None,
            "detected_objects": None
        }

    finally:
        db.close()

# ------------------------------
# Pipeline për video (placeholder)
# ------------------------------
def process_video(video_bytes: bytes):
    """
    Përpunimi i videove – për t'u implementuar më vonë.
    """
    return {
        "matches": [],
        "metadata": {
            "face_detected": False,
            "message": "Video processing not yet implemented"
        },
        "is_human": False,
        "message": "Përpunimi i videove nuk është implementuar ende",
        "detected_objects": None
    }