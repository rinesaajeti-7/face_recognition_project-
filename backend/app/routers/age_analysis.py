from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.dependencies import get_current_user
from app.models.user import User
from app.services.face_plus_service import FacePlusService
import tempfile
import os

router = APIRouter()
face_service = FacePlusService()

@router.post("/age-analysis/analyze")
async def analyze_age_from_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Analizon moshën dhe gjininë nga fotografia e ngarkuar"""
    
    # Ruaj foton përkohësisht
    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # Analizo me Face++
        result = face_service.get_age_gender(tmp_path)
        
        # Shto informacionin e fotos
        result["filename"] = file.filename
        result["file_size"] = f"{len(content) / 1024:.2f} KB"
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Fshi foton e përkohshme
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

@router.post("/age-analysis/compare")
async def compare_face_ages(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Krahason moshën e dy personave në foto të ndryshme"""
    
    results = []
    for file_obj in [file1, file2]:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
            content = await file_obj.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        result = face_service.get_age_gender(tmp_path)
        result["filename"] = file_obj.filename
        results.append(result)
        
        os.unlink(tmp_path)
    
    return {
        "image1": results[0] if len(results) > 0 else None,
        "image2": results[1] if len(results) > 1 else None,
        "comparison": {
            "age_difference": abs(results[0].get("age", 0) - results[1].get("age", 0)) if len(results) > 1 else None,
            "same_gender": results[0].get("gender") == results[1].get("gender") if len(results) > 1 else None
        }
    }

@router.post("/age-analysis/public-analyze")
async def public_analyze_age(
    file: UploadFile = File(...)
):
    """Endpoint publik për testim - analizon moshën pa autentifikim"""
    
    import tempfile
    import os
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        result = face_service.get_age_gender(tmp_path)
        result["filename"] = file.filename
        return result
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
