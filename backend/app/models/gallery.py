from sqlalchemy import Column, Integer, String, Float, DateTime, Text,Date
from sqlalchemy.sql import func
from app.db.database import Base

class Gallery(Base):
    __tablename__ = "gallery"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="missing")  # missing, wanted
    image_path = Column(String, nullable=False)
    embedding_path = Column(String, nullable=True)
    age_est = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    case_id = Column(String, nullable=True)
   
    last_seen = Column(DateTime(timezone=True), nullable=True)
     # Fushat e reja
    id_number = Column(String, unique=True, nullable=True)       # numri i leternjoftimit
    phone = Column(String, nullable=True)                        # numri i telefonit
    residence_location = Column(String, nullable=True)           # vendbanimi
    photo_location = Column(String, nullable=True)               # lokacioni ku është bërë fotoja
    station_added = Column(String, nullable=True)                # stacioni/sistemi ku u shtua
    birth_date = Column(Date, nullable=True)                     # datëlindja
    additional_info = Column(Text, nullable=True)                # të dhëna të tjera

    created_at = Column(DateTime(timezone=True), server_default=func.now())