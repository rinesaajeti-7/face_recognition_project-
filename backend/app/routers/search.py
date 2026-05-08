from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.ai_pipeline import process_image, process_video
from app.schemas.search import SearchResult
from app.dependencies import get_current_user
from app.models.user import User
from app.models.search import Search
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/image", response_model=SearchResult)
async def search_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Read image bytes
    contents = await file.read()
    # Call AI pipeline
    result = process_image(contents)
    
    # LOGO REZULTATIN
    logger.info(f"Search result keys: {result.keys()}")
    if result.get('matches'):
        logger.info(f"Number of matches: {len(result['matches'])}")
        if result['matches']:
            logger.info(f"First match fields: {result['matches'][0].keys()}")
            logger.info(f"First match data: {result['matches'][0]}")
    
    # Save search record
    search_record = Search(
        user_id=current_user.id,
        search_type="image",
        result_json=json.dumps(result, default=str)  # default=str për date fields
    )
    db.add(search_record)
    db.commit()
    
    return SearchResult(**result)