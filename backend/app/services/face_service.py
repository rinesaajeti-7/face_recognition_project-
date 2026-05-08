import face_recognition
import numpy as np
from PIL import Image
import io

class FaceService:
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

    @staticmethod
    def compare_faces(known_encodings, query_encoding, tolerance=0.5):
        """Krahason një encoding me një listë encodings-sh të njohura."""
        if not known_encodings or query_encoding is None:
            return []
        distances = face_recognition.face_distance(known_encodings, query_encoding)
        results = [(i, 1 - d) for i, d in enumerate(distances) if (1 - d) >= (1 - tolerance)]
        results.sort(key=lambda x: x[1], reverse=True)
        return results