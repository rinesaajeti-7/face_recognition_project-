# backend/app/services/face_comparison_service.py
import tempfile
import os
from deepface import DeepFace
from app.db.database import get_db
from app.models.gallery import Gallery
import logging

logger = logging.getLogger(__name__)

class FaceComparisonService:
    @staticmethod
    def compare_with_public_alerts(uploaded_image_bytes, similarity_threshold=0.6):
        """
        Krahason foton e ngarkuar me të gjithë personat e shpallur publikisht (missing/wanted).
        Kthen listën e personave që kanë similarity mbi threshold.
        """
        db = next(get_db())
        results = []
        
        # Merr të gjithë personat me status 'missing' ose 'wanted'
        public_persons = db.query(Gallery).filter(
            Gallery.status.in_(['missing', 'wanted'])
        ).all()
        
        if not public_persons:
            return results
        
        # Ruaj foton e ngarkuar në një skedar temporal
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_upload:
            tmp_upload.write(uploaded_image_bytes)
            uploaded_image_path = tmp_upload.name
        
        try:
            for person in public_persons:
                # Merr URL-në e fotos së personit nga database
                if not person.photo_url:
                    continue
                
                # Ruaj foton e personit në një skedar temporal
                with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_person:
                    # Shkarko foton nga URL (ose përdor path-in e ruajtur)
                    import requests
                    response = requests.get(person.photo_url)
                    tmp_person.write(response.content)
                    person_image_path = tmp_person.name
                
                try:
                    # Krahaso dy fytyrat duke përdorur DeepFace
                    result = DeepFace.verify(
                        img1_path=uploaded_image_path,
                        img2_path=person_image_path,
                        model_name='Facenet',  # ose 'DeepFace', 'VGG-Face', etj.
                        enforce_detection=False
                    )
                    
                    similarity = 1 - result['distance']  # konvert distance në similarity
                    
                    if similarity > similarity_threshold:
                        results.append({
                            'person_id': person.id,
                            'name': person.name,
                            'status': person.status,
                            'similarity': similarity,
                            'photo_url': person.photo_url,
                            'id_number': person.id_number,
                            'residence_location': person.residence_location,
                            'additional_info': person.additional_info,
                            'station_added': person.station_added,
                            'birth_date': person.birth_date,
                        })
                except Exception as e:
                    logger.error(f"Gabim gjatë krahasimit me personin {person.id}: {str(e)}")
                finally:
                    # Pastro skedarin temporal të personit
                    if os.path.exists(person_image_path):
                        os.unlink(person_image_path)
        finally:
            # Pastro skedarin temporal të fotografisë së ngarkuar
            if os.path.exists(uploaded_image_path):
                os.unlink(uploaded_image_path)
        
        # Rendit rezultatet sipas similarity (nga më e larta)
        results.sort(key=lambda x: x['similarity'], reverse=True)
        return results