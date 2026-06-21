from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.db.database import get_db
from app.services.cohere_chat_service import CohereChatService

router = APIRouter(prefix="/api/chat", tags=["Chat"])

class PoliceChatRequest(BaseModel):
    message: str

class CitizenChatRequest(BaseModel):
    message: str
    citizen_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str
    intent: str
    suggestions: List[str] = []


@router.post("/police", response_model=ChatResponse)
async def police_chat(
    request: PoliceChatRequest,
    db: Session = Depends(get_db)
):
    """Chatbot për Policinë duke përdorur Cohere API"""
    chat_service = CohereChatService(db)
    result = await chat_service.get_response(request.message, user_role="police")
    return ChatResponse(**result)


@router.post("/citizen", response_model=ChatResponse)
async def citizen_chat(
    request: CitizenChatRequest,
    db: Session = Depends(get_db)
):
    """Chatbot për Qytetarët duke përdorur Cohere API"""
    chat_service = CohereChatService(db)
    result = await chat_service.get_response(request.message, user_role="citizen", citizen_id=request.citizen_id)
    return ChatResponse(**result)


@router.get("/test")
async def test_chat():
    """Test endpoint për të verifikuar që chat po punon"""
    return {"message": "Chat API is working!", "status": "active"}