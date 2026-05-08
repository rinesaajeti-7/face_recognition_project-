import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Face Recognition System", version="1.0")

# ===== CORS (Saktë) =====
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5174",
         "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== PATHS =====
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "data", "gallery")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ===== STATIC FILES (IMPORTANT) =====
app.mount("/media", StaticFiles(directory=UPLOAD_DIR), name="media")


# ===== ROUTERS =====
from app.routers import (
    auth_router,
    gallery_router,
    search_router,
    alerts_router,
    history_router,
    admin_router,
    profile_router
)

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(gallery_router, prefix="/api/gallery", tags=["Gallery"])
app.include_router(search_router, prefix="/api/search", tags=["Search"])
app.include_router(alerts_router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(history_router, prefix="/api/history", tags=["History"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(profile_router, prefix="/api/profile", tags=["Profile"])


@app.get("/")
def root():
    return {"message": "API running"}

@app.get("/health")
def health():
    return {"status": "ok"}