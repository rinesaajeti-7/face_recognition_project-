import tempfile
import os
import requests
from deepface import DeepFace
from app.db.database import get_db
from app.models.gallery import Gallery
import logging

logger = logging.getLogger(__name__)

class FaceComparisonService:
    @staticmethod
    def compare_with_public_alerts(uploaded_image_bytes, similarity_threshold=0.6):
        """
        Compare uploaded face with all persons whose status is 'missing' or 'wanted'.
        Returns list of persons with similarity above threshold.
        """
        db = next(get_db())
        results = []

        # Get all public persons (missing or wanted)
        public_persons = db.query(Gallery).filter(
            Gallery.status.in_(['missing', 'wanted'])
        ).all()

        if not public_persons:
            return results

        # Save uploaded image to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_upload:
            tmp_upload.write(uploaded_image_bytes)
            uploaded_path = tmp_upload.name

        try:
            for person in public_persons:
                if not person.photo_url:
                    continue

                # Download person's photo
                try:
                    resp = requests.get(person.photo_url, timeout=10)
                    if resp.status_code != 200:
                        logger.warning(f"Cannot download photo for person {person.id}")
                        continue
                except Exception as e:
                    logger.error(f"Error downloading photo for person {person.id}: {e}")
                    continue

                with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_person:
                    tmp_person.write(resp.content)
                    person_path = tmp_person.name

                try:
                    # Verify face similarity using DeepFace
                    result = DeepFace.verify(
                        img1_path=uploaded_path,
                        img2_path=person_path,
                        model_name='Facenet',   # You can also use 'VGG-Face', 'DeepFace', etc.
                        enforce_detection=False
                    )
                    similarity = 1 - result['distance']   # convert distance to similarity
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
                    logger.error(f"Comparison failed for person {person.id}: {e}")
                finally:
                    if os.path.exists(person_path):
                        os.unlink(person_path)

        finally:
            if os.path.exists(uploaded_path):
                os.unlink(uploaded_path)

        # Sort by similarity descending
        results.sort(key=lambda x: x['similarity'], reverse=True)
        return results