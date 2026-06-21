from .auth import router as auth_router
from .gallery import router as gallery_router
from .search import router as search_router
from .alerts import router as alerts_router
from .history import router as history_router
from .admin import router as admin_router
from .profile import router as profile_router
from .admin import router as admin_router
from .citizens import router as citizens_router
from .chat import router as chat_router
from .reports import router as reports_router
from app.routers import face_analysis  
from .face_analysis import router as face_analysis_router

__all__ = [
    "gallery_router",
    "search_router", 
    "auth_router",
    "alerts_router",
    "history_router",
    "profile_router",
    "admin_router",
    "citizens_router",
    "chat_router",
    "reports_router",
    "face_analysis_router",  
]