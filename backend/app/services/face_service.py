# backend/app/services/face_service.py (VERSIONI I PLOTË)
import face_recognition
import numpy as np
import json
from PIL import Image
import io
from sqlalchemy.orm import Session
from app.models.gallery import Gallery

class FaceService:
    def __init__(self, db: Session = None):
        self.db = db
    
    @staticmethod
    def get_face_encoding(image_bytes: bytes):
        """Merr encoding të fytyrës nga bytes të imazhit."""
        img = Image.open(io.BytesIO(image_bytes))
        img_np = np.array(img)
        locations = face_recognition.face_locations(img_np)
        if not locations:
            return None
        encodings = face_recognition.face_encodings(img_np, locations)
        if not encodings:
            return None
        return encodings[0]

    @staticmethod
    def get_face_encoding_from_file(file_path: str):
        """Merr encoding nga një file i ruajtur."""
        img = face_recognition.load_image_file(file_path)
        locations = face_recognition.face_locations(img)
        if not locations:
            return None
        encodings = face_recognition.face_encodings(img, locations)
        if not encodings:
            return None
        return encodings[0]
    
    @staticmethod
    def encoding_to_json(encoding: np.ndarray) -> str:
        """Konverton numpy array në JSON string për ruajtje."""
        if encoding is None:
            return None
        return json.dumps(encoding.tolist())
    
    @staticmethod
    def json_to_encoding(json_str: str) -> np.ndarray:
        """Konverton JSON string në numpy array."""
        if not json_str:
            return None
        return np.array(json.loads(json_str))

    def compare_faces_with_details(self, query_encoding, tolerance=0.5):
        """Krahason një encoding me të gjithë personat në database."""
        if query_encoding is None or self.db is None:
            return []
        
        persons = self.db.query(Gallery).all()
        results = []
        
        for person in persons:
            if person.face_encoding:
                known_encoding = self.json_to_encoding(person.face_encoding)
                if known_encoding is not None:
                    distance = face_recognition.face_distance([known_encoding], query_encoding)[0]
                    similarity = 1 - distance
                    
                    if similarity >= (1 - tolerance):
                        results.append({
                            "person_id": person.id,
                            "name": person.name,
                            "similarity": similarity,
                            "id_number": person.id_number,
                            "phone": person.phone,
                            "residence_location": person.residence_location,
                            "photo_location": person.photo_location,
                            "station_added": person.station_added,
                            "birth_date": person.birth_date,
                            "additional_info": person.additional_info,
                            "status": person.status,
                            "description": person.description,
                            "image_path": person.image_path
                        })
        
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results

    @staticmethod
    def compare_faces(known_encodings, query_encoding, tolerance=0.5):
        """Krahason një encoding me një listë encodings-sh të njohura."""
        if not known_encodings or query_encoding is None:
            return []
        distances = face_recognition.face_distance(known_encodings, query_encoding)
        results = [(i, 1 - d) for i, d in enumerate(distances) if (1 - d) >= (1 - tolerance)]
        results.sort(key=lambda x: x[1], reverse=True)
        return results
    