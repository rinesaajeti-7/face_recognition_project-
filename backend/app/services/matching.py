import os
import pickle
from typing import List, Tuple
import numpy as np
import json
import logging

logger = logging.getLogger(__name__)

class FaceGalleryIndex:
    def __init__(self):
        self.storage_path = "data/embeddings/gallery_encodings.pkl"
        self.encodings = []  # list of (person_id, encoding)
        self._load()
        # Nëse indeksi është bosh, rindërto nga database
        if not self.encodings:
            self.rebuild_from_db()

    def _load(self):
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, 'rb') as f:
                    self.encodings = pickle.load(f)
                logger.info(f"Loaded {len(self.encodings)} encodings from disk")
            except Exception as e:
                logger.error(f"Error loading index: {e}")
                self.encodings = []

    def _save(self):
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        with open(self.storage_path, 'wb') as f:
            pickle.dump(self.encodings, f)
        logger.info(f"Saved {len(self.encodings)} encodings to disk")

    def rebuild_from_db(self):
        """Rindërto indeksin nga database"""
        from app.db.database import SessionLocal
        from app.models.gallery import Gallery
        
        db = SessionLocal()
        self.encodings = []
        persons = db.query(Gallery).all()
        
        for person in persons:
            if person.face_encoding:
                try:
                    encoding = np.array(json.loads(person.face_encoding))
                    self.encodings.append((person.id, encoding))
                    logger.info(f"Added {person.name} (ID: {person.id}) to index")
                except Exception as e:
                    logger.error(f"Error loading encoding for {person.name}: {e}")
        
        db.close()
        self._save()
        logger.info(f"Rebuilt index with {len(self.encodings)} encodings")

    def add_encoding(self, encoding: np.ndarray, person_id: int):
        self.encodings.append((person_id, encoding))
        self._save()

    def search(self, query_encoding: np.ndarray, k: int = 5) -> List[Tuple[int, float]]:
        """Kërkon personat më të ngjashëm"""
        if not self.encodings or query_encoding is None:
            return []
        
        results = []
        for person_id, known_encoding in self.encodings:
            distance = np.linalg.norm(known_encoding - query_encoding)
            similarity = max(0, 1 - distance)
            results.append((person_id, similarity))
        
        # Rendit sipas ngjashmërisë (nga më e larta)
        results.sort(key=lambda x: x[1], reverse=True)
        
        # Kthe top k rezultatet
        return results[:k]

gallery_index = FaceGalleryIndex()
