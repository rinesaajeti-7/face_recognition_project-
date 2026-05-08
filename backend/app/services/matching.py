import os
import pickle
from typing import List, Tuple
import numpy as np

class FaceGalleryIndex:
    def __init__(self):
        self.storage_path = "data/embeddings/gallery_encodings.pkl"
        self.encodings = []  # list of (person_id, encoding)
        self._load()

    def _load(self):
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, 'rb') as f:
                    self.encodings = pickle.load(f)
            except Exception:
                self.encodings = []

    def _save(self):
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        with open(self.storage_path, 'wb') as f:
            pickle.dump(self.encodings, f)

    def add_encoding(self, encoding: np.ndarray, person_id: int):
        self.encodings.append((person_id, encoding))
        self._save()

    def search(self, query_encoding: np.ndarray, k: int = 5) -> List[Tuple[int, float]]:
        from app.services.face_service import FaceService
        if not self.encodings or query_encoding is None:
            return []
        known = [enc for _, enc in self.encodings]
        idx_sims = FaceService.compare_faces(known, query_encoding, tolerance=0.6)
        result = [(self.encodings[idx][0], sim) for idx, sim in idx_sims]
        return result[:k]

gallery_index = FaceGalleryIndex()