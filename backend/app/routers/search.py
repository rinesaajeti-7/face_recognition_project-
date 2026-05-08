from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.ai_pipeline import process_image, process_video
from app.schemas.search import SearchResult
from app.dependencies import get_current_user
from app.models.user import User
from app.models.search import Search
import json

router = APIRouter()

@router.post("/image", response_model=SearchResult)
async def search_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Read image bytes
    contents = await file.read()
    # Call AI pipeline (stub for now)
    result = process_image(contents)  # returns dict with matches and metadata
    
    # Save search record
    search_record = Search(
        user_id=current_user.id,
        search_type="image",
        result_json=json.dumps(result)
    )
    db.add(search_record)
    db.commit()
    
    return SearchResult(**result)

@router.post("/video")
async def search_video(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    # Similar to image but for video
    return {"message": "Video search stub - will process frames"}