from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import gallery, search, auth, alerts, history, profile, admin
from app.routers import citizens, chat
from app.db.database import engine, Base
import os
from app.routers import map as map_router
from app.routers import qrcodes as qrcodes_router
from app.routers import websocket as websocket_router
from app.routers import reports 
from app.routers import face_analysis  
from app.routers import photo_forensics


# Krijo aplikacionin FastAPI
app = FastAPI(title="Face Recognition API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Krijo direktoritë për media
os.makedirs("data/gallery", exist_ok=True)
os.makedirs("data/citizen_reports", exist_ok=True)

# Mount static files directories
app.mount("/media", StaticFiles(directory="data/gallery"), name="media")
app.mount("/data", StaticFiles(directory="data"), name="data")

# Krijo tabelat nëse nuk ekzistojnë
Base.metadata.create_all(bind=engine)

# Regjistro router-at
app.include_router(auth.router)
app.include_router(gallery.router)
app.include_router(search.router, prefix="/api")
app.include_router(alerts.router)
app.include_router(history.router)
app.include_router(profile.router)
app.include_router(admin.router)
app.include_router(citizens.router)
app.include_router(chat.router)
app.include_router(map_router.router)
app.include_router(qrcodes_router.router)
app.include_router(websocket_router.router)
app.include_router(reports.router)
app.include_router(face_analysis.router, prefix="/api", tags=["face_analysis"])
app.include_router(photo_forensics.router, prefix="/api", tags=["photo-forensics"])
                   
@app.get("/")
def root():
    return {"message": "Face Recognition API is running", "status": "active"}

@app.get("/health")
def health():
    return {"status": "healthy"}

