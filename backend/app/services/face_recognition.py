# app/services/face_recognition.py
import numpy as np

class FaceRecognizer:
    def __init__(self):
        pass
    
    def get_embedding(self, face_image: np.ndarray) -> np.ndarray:
        # Kthen embedding false për testim
        return np.random.rand(512).astype(np.float32)