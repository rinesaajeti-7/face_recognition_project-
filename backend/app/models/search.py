from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base

class Search(Base):
    __tablename__ = "searches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    search_type = Column(String)  # image, video, live
    input_path = Column(String, nullable=True)
    result_json = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())