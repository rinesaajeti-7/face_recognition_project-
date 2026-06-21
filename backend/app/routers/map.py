from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.map_service import MapService

router = APIRouter(prefix="/api/map", tags=["Map"])


@router.get("/heatmap")
def get_heatmap_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get heatmap data for all locations"""
    service = MapService(db)
    return service.get_heatmap_data()


@router.get("/reports")
def get_citizen_reports_locations(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get citizen reports locations"""
    service = MapService(db)
    return service.get_citizen_reports_locations(days)


@router.get("/missing")
def get_missing_persons_locations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get missing persons locations"""
    service = MapService(db)
    return service.get_missing_persons_locations()


@router.get("/stats")
def get_location_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get statistics grouped by location"""
    service = MapService(db)
    return service.get_statistics_by_location()