# backend/app/services/photo_forensics.py
import cv2
import numpy as np
from PIL import Image
import io
import hashlib
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class PhotoForensicsTool:
    """Tool për të analizuar autenticitetin e fotove"""
    
    @staticmethod
    def extract_metadata(image_bytes: bytes) -> dict:
        """Nxjerr metadata nga fotografia"""
        try:
            from PIL import Image
            from PIL.ExifTags import TAGS
            
            img = Image.open(io.BytesIO(image_bytes))
            exifdata = img.getexif()
            
            metadata = {}
            for tag_id, value in exifdata.items():
                tag = TAGS.get(tag_id, tag_id)
                metadata[tag] = str(value)
            
            return metadata
        except Exception as e:
            return {"error": f"Could not extract metadata: {str(e)}"}
    
    @staticmethod
    def detect_editing(image_bytes: bytes) -> dict:
        """Zbulon nëse fotografia është manipuluar"""
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        results = {
            "is_manipulated": False,
            "confidence": 0.0,
            "findings": []
        }
        
        # ELA (Error Level Analysis)
        # Ruan imazhin me cilësi të ndryshme dhe krahason
        temp_path = "/tmp/temp_image.jpg"
        cv2.imwrite(temp_path, img, [cv2.IMWRITE_JPEG_QUALITY, 90])
        img_high = cv2.imread(temp_path)
        
        cv2.imwrite(temp_path, img, [cv2.IMWRITE_JPEG_QUALITY, 70])
        img_low = cv2.imread(temp_path)
        
        if img_high is not None and img_low is not None:
            diff = cv2.absdiff(img_high, img_low)
            diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
            mean_diff = np.mean(diff_gray)
            
            if mean_diff > 15:
                results["findings"].append(f"High compression artifacts detected (ELA: {mean_diff:.2f})")
                results["is_manipulated"] = True
                results["confidence"] = min(mean_diff / 50, 1.0)
        
        # Noise inconsistency
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        noise_std = np.std(gray)
        
        if noise_std < 10:
            results["findings"].append("Unusually low noise level - possible smoothing filter")
        elif noise_std > 50:
            results["findings"].append("High noise level - possible low quality camera or compression")
        
        return results
    
    @staticmethod
    def generate_thumbnail(image_bytes: bytes, size: tuple = (150, 150)) -> str:
        """Gjeneron thumbnail në base64 për shfaqje të shpejtë"""
        import base64
        img = Image.open(io.BytesIO(image_bytes))
        img.thumbnail(size)
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG")
        return base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    @staticmethod
    def compute_image_hash(image_bytes: bytes) -> str:
        """Llogarit hash-in e imazhit për identifikim unik"""
        return hashlib.sha256(image_bytes).hexdigest()

# backend/app/routers/photo_forensics.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.dependencies import get_current_user
from app.models.user import User
from app.services.photo_forensics import PhotoForensicsTool

router = APIRouter()

@router.post("/photo-forensics/analyze")
async def analyze_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Analizon autenticitetin e fotos"""
    
    contents = await file.read()
    
    metadata = PhotoForensicsTool.extract_metadata(contents)
    editing_analysis = PhotoForensicsTool.detect_editing(contents)
    image_hash = PhotoForensicsTool.compute_image_hash(contents)
    thumbnail = PhotoForensicsTool.generate_thumbnail(contents)
    
    return {
        "filename": file.filename,
        "image_hash": image_hash,
        "metadata": metadata,
        "forensics": editing_analysis,
        "thumbnail_base64": thumbnail,
        "analysis_date": datetime.now().isoformat()
    }

@router.post("/photo-forensics/compare-hashes")
async def compare_hashes(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Krahason dy foto për të parë nëse janë identike"""
    
    contents1 = await file1.read()
    contents2 = await file2.read()
    
    hash1 = PhotoForensicsTool.compute_image_hash(contents1)
    hash2 = PhotoForensicsTool.compute_image_hash(contents2)
    
    return {
        "image1_hash": hash1,
        "image2_hash": hash2,
        "are_identical": hash1 == hash2,
        "image1_name": file1.filename,
        "image2_name": file2.filename
    }