import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:12341@localhost:5432/face_recognition_db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-this")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # AI thresholds & features
    SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.7"))
    ENABLE_AGE_GENDER: bool = os.getenv("ENABLE_AGE_GENDER", "true").lower() == "true"
    ENABLE_EMOTION: bool = os.getenv("ENABLE_EMOTION", "true").lower() == "true"
    ENABLE_OBJECT_DETECTION: bool = os.getenv("ENABLE_OBJECT_DETECTION", "true").lower() == "true"
    ENABLE_ANTI_SPOOFING: bool = os.getenv("ENABLE_ANTI_SPOOFING", "true").lower() == "true"
    
    # Email
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    EMAIL_SENDER: str = os.getenv("EMAIL_SENDER", "")
    EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD", "")

settings = Settings()