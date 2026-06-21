# backend/app/routers/face_analysis.py
import logging
import tempfile
import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from deepface import DeepFace

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/analyze-face")
async def analyze_face(file: UploadFile = File(...)):
    """
    Analyze age and gender from an uploaded image.
    Returns: { "age": int, "gender": str, "raw_gender": str, "probability": float }
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    tmp_path = None
    try:
        contents = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        # DeepFace analysis (only age & gender)
        result = DeepFace.analyze(
            img_path=tmp_path,
            actions=['age', 'gender'],
            enforce_detection=False
        )

        if not result or len(result) == 0:
            raise HTTPException(status_code=400, detail="No face detected")

        analysis = result[0]
        age = analysis.get('age')

        # Handle gender: DeepFace may return a dict like {'Man': 0.99, 'Woman': 0.01}
        gender_data = analysis.get('gender')
        if isinstance(gender_data, dict):
            # Extract the gender with highest probability
            gender_raw = max(gender_data, key=gender_data.get)
            prob = max(gender_data.values())
        else:
            # Fallback if it's a string (older versions)
            gender_raw = gender_data
            prob = 0.95

        gender_sq = "Mashkull" if gender_raw == "Man" else "Femër"

        return {
            "age": age,
            "gender": gender_sq,
            "raw_gender": gender_raw.lower(),
            "probability": prob
        }

    except Exception as e:
        logger.error(f"Face analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)