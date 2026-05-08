import face_recognition
import numpy as np
from PIL import Image
import io
from sqlalchemy.orm import Session
from app.models.gallery import Gallery

class FaceService:
    def __init__(self, db: Session):
        self.db = db
    
    @staticmethod
    def get_face_encoding(image_bytes: bytes):
        """Merr encoding të fytyrës nga bytes të imazhit."""
        img = Image.open(io.BytesIO(image_bytes))
        img_np = np.array(img)
        # face_recognition punon me RGB (PIL jep RGB)
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

    def compare_faces_with_details(self, query_encoding, tolerance=0.5):
        """
        Krahason një encoding me të gjithë personat në database dhe kthen detajet e plota.
        """
        if query_encoding is None:
            return []
        
        # Merr të gjithë personat nga database
        persons = self.db.query(Gallery).all()
        
        results = []
        for person in persons:
            # Supozojmë që encoding-et ruhen në një fushë të veçantë ose ngarkohen nga foto
            # Nëse nuk ke encoding të ruajtur, duhet të ngarkosh foton dhe të llogaritësh
            if hasattr(person, 'face_encoding') and person.face_encoding:
                known_encoding = np.array(person.face_encoding)
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
        
        # Sorto rezultatet sipas ngjashmërisë (nga më e larta tek më e ulta)
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
    
    