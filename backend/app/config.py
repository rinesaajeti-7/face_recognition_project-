import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./face_recognition.db")
    
    # Security - Përdor SECRET_KEY nga .env
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production-2024")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # AI thresholds
    SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.7"))
    ENABLE_AGE_GENDER: bool = os.getenv("ENABLE_AGE_GENDER", "true").lower() == "true"
    ENABLE_EMOTION: bool = os.getenv("ENABLE_EMOTION", "true").lower() == "true"
    ENABLE_OBJECT_DETECTION: bool = os.getenv("ENABLE_OBJECT_DETECTION", "true").lower() == "true"
    ENABLE_ANTI_SPOOFING: bool = os.getenv("ENABLE_ANTI_SPOOFING", "true").lower() == "true"
    
    # Email (opsional)
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    EMAIL_SENDER: str = os.getenv("EMAIL_SENDER", "")
    EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD", "")
    
    # App
    APP_NAME: str = os.getenv("APP_NAME", "Face Recognition System")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
settings = Settings()