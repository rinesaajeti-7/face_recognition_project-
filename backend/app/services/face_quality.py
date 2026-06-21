# backend/app/services/face_quality.py
import cv2
import numpy as np
from PIL import Image
import io
import dlib
from typing import Tuple, Dict, Optional

class FaceQualityChecker:
    def __init__(self):
        # Detektor për landmarks (kërkon shape_predictor_68_face_landmarks.dat)
        self.detector = dlib.get_frontal_face_detector()
        self.predictor = None
        
        # Provo të ngarkosh predictor-in
        try:
            self.predictor = dlib.shape_predictor("models/shape_predictor_68_face_landmarks.dat")
        except:
            print("⚠️ Shape predictor not found. Eye detection will be disabled.")
    
    def check_face_quality(self, image_bytes: bytes, min_sharpness: float = 50.0) -> Dict:
        """
        Verifikon cilësinë e fotos para shtimit në galeri.
        
        Kriteret:
        - Fytyra e zbuluar
        - Këndi frontal (opsional)
        - Cilësi e mjaftueshme (sharpness)
        - Sytë e hapur (nëse dlib është i disponueshëm)
        
        Returns:
            {
                "valid": bool,
                "face_detected": bool,
                "frontal_face": bool,
                "eyes_open": bool,
                "sharpness_score": float,
                "brightness_score": float,
                "errors": list[str],
                "warnings": list[str]
            }
        """
        # Konverto bytes në imazh
        pil_img = Image.open(io.BytesIO(image_bytes))
        img_rgb = np.array(pil_img)
        gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
        
        # Lartësia dhe gjerësia minimale
        h, w = gray.shape
        if h < 100 or w < 100:
            return self._error_result(["Fotografia është shumë e vogël (min 100x100 piksel)"])
        
        result = {
            "valid": False,
            "face_detected": False,
            "frontal_face": True,  # Default true nëse nuk mund të verifikohet
            "eyes_open": True,     # Default true nëse nuk mund të verifikohet
            "sharpness_score": 0.0,
            "brightness_score": 0.0,
            "errors": [],
            "warnings": []
        }
        
        # 1. Zbulimi i fytyrës me dlib (më i saktë se Haar)
        faces = self.detector(gray, 1)
        
        if len(faces) == 0:
            result["errors"].append("Nuk u zbulua asnjë fytyrë në foto")
            return result
        
        result["face_detected"] = True
        face = faces[0]
        
        # 2. Verifiko madhësinë e fytyrës
        face_height = face.bottom() - face.top()
        face_width = face.right() - face.left()
        
        if face_height < 80 or face_width < 80:
            result["warnings"].append(f"Fytyra është shumë e vogël ({face_width}x{face_height} piksel). Rekomandohet të paktën 80x80")
        
        # 3. Sharpness (Laplacian variance)
        # Merr rajonin e fytyrës për sharpness më të saktë
        face_roi = gray[face.top():face.bottom(), face.left():face.right()]
        sharpness = cv2.Laplacian(face_roi, cv2.CV_64F).var()
        result["sharpness_score"] = round(sharpness, 2)
        
        if sharpness < min_sharpness:
            result["errors"].append(f"Fotografia është e turbullt (sharpness: {sharpness:.1f} < {min_sharpness})")
        
        # 4. Brightness (vetëm në rajonin e fytyrës)
        brightness = np.mean(face_roi)
        result["brightness_score"] = round(brightness, 2)
        
        if brightness < 50:
            result["errors"].append("Fotografia është shumë e errët")
        elif brightness > 200:
            result["errors"].append("Fotografia është shumë e ndritshme (e ekspozuar)")
        
        # 5. Frontal face check (asimetria)
        face_center_x = (face.left() + face.right()) // 2
        image_center_x = w // 2
        offset_percent = abs(face_center_x - image_center_x) / w
        
        if offset_percent > 0.25:  # 25% larg qendrës
            result["warnings"].append("Fytyra nuk është në qendër të fotos")
        
        # 6. Eye detection (nëse dlib është i disponueshëm)
        if self.predictor is not None:
            try:
                landmarks = self.predictor(gray, face)
                
                # Merr koordinatat e syve
                left_eye_points = [(landmarks.part(i).x, landmarks.part(i).y) for i in range(36, 42)]
                right_eye_points = [(landmarks.part(i).x, landmarks.part(i).y) for i in range(42, 48)]
                
                # Llogarit EAR (Eye Aspect Ratio)
                def eye_aspect_ratio(eye_points):
                    # EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
                    p1 = np.array(eye_points[0])
                    p2 = np.array(eye_points[1])
                    p3 = np.array(eye_points[2])
                    p4 = np.array(eye_points[3])
                    p5 = np.array(eye_points[4])
                    p6 = np.array(eye_points[5])
                    
                    vertical1 = np.linalg.norm(p2 - p6)
                    vertical2 = np.linalg.norm(p3 - p5)
                    horizontal = np.linalg.norm(p1 - p4)
                    
                    ear = (vertical1 + vertical2) / (2.0 * horizontal + 1e-6)
                    return ear
                
                left_ear = eye_aspect_ratio(left_eye_points)
                right_ear = eye_aspect_ratio(right_eye_points)
                avg_ear = (left_ear + right_ear) / 2.0
                
                if avg_ear < 0.2:  # Sy të mbyllur
                    result["eyes_open"] = False
                    result["warnings"].append("Sytë duken të mbyllur - rekomandohet foto me sy të hapur")
                
            except Exception as e:
                print(f"Eye detection error: {e}")
        
        # Vendim final
        if len(result["errors"]) == 0:
            result["valid"] = True
        
        return result
    
    def _error_result(self, errors: list) -> Dict:
        return {
            "valid": False,
            "face_detected": False,
            "frontal_face": True,
            "eyes_open": True,
            "sharpness_score": 0.0,
            "brightness_score": 0.0,
            "errors": errors,
            "warnings": []
        }

# Singleton instance
quality_checker = FaceQualityChecker()
