from sqlalchemy.orm import Session
from app.models.gallery import Gallery
from app.models.citizen import CitizenReport
from typing import List, Dict, Any
from datetime import datetime, timedelta
import json
import random

class MapService:
    """Service for handling map data and heatmaps"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_missing_persons_locations(self) -> List[Dict[str, Any]]:
        """Get locations of missing persons"""
        persons = self.db.query(Gallery).filter(
            Gallery.status.in_(["missing", "wanted"])
        ).all()
        
        locations = []
        # Koordinata të njohura për Kosovë (për demo)
        known_locations = [
            {"lat": 42.6629, "lng": 21.1655, "name": "Prishtinë"},
            {"lat": 42.4325, "lng": 21.4404, "name": "Gjilan"},
            {"lat": 42.3808, "lng": 21.2532, "name": "Ferizaj"},
            {"lat": 42.4669, "lng": 20.7453, "name": "Pejë"},
            {"lat": 42.3990, "lng": 20.4320, "name": "Gjakovë"},
            {"lat": 42.4146, "lng": 20.6192, "name": "Deçan"},
            {"lat": 42.5500, "lng": 21.3667, "name": "Lipjan"},
            {"lat": 42.7500, "lng": 21.1333, "name": "Podujevë"},
            {"lat": 42.3500, "lng": 21.1500, "name": "Kaçanik"},
            {"lat": 42.7167, "lng": 20.5667, "name": "Istog"},
        ]
        
        for idx, person in enumerate(persons):
            # Përdor koordinata të bazuara në ID për qëndrueshmëri
            loc_idx = person.id % len(known_locations) if person.id else idx % len(known_locations)
            location = known_locations[loc_idx]
            
            locations.append({
                "id": person.id,
                "name": person.name,
                "latitude": location["lat"],
                "longitude": location["lng"],
                "location_name": location["name"],
                "status": person.status,
                "type": "missing_person",
                "description": person.description or "Nuk ka përshkrim",
                "image_path": person.image_path
            })
        
        return locations
    
    def get_citizen_reports_locations(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get locations from citizen reports"""
        cutoff_date = datetime.now() - timedelta(days=days)
        reports = self.db.query(CitizenReport).filter(
            CitizenReport.reported_at >= cutoff_date
        ).all()
        
        # Koordinata për vendet kryesore në Kosovë
        city_coords = {
            "Prishtinë": {"lat": 42.6629, "lng": 21.1655},
            "Prishtina": {"lat": 42.6629, "lng": 21.1655},
            "Gjilan": {"lat": 42.4325, "lng": 21.4404},
            "Ferizaj": {"lat": 42.3808, "lng": 21.2532},
            "Pejë": {"lat": 42.4669, "lng": 20.7453},
            "Peja": {"lat": 42.4669, "lng": 20.7453},
            "Gjakovë": {"lat": 42.3990, "lng": 20.4320},
            "Gjakova": {"lat": 42.3990, "lng": 20.4320},
            "Deçan": {"lat": 42.4146, "lng": 20.6192},
            "Lipjan": {"lat": 42.5500, "lng": 21.3667},
            "Podujevë": {"lat": 42.7500, "lng": 21.1333},
            "Podujeva": {"lat": 42.7500, "lng": 21.1333},
            "Kaçanik": {"lat": 42.3500, "lng": 21.1500},
            "Istog": {"lat": 42.7167, "lng": 20.5667},
            "Mitrovicë": {"lat": 42.8833, "lng": 20.8667},
            "Mitrovica": {"lat": 42.8833, "lng": 20.8667},
            "Vushtrri": {"lat": 42.8167, "lng": 20.9667},
            "Suharekë": {"lat": 42.3667, "lng": 20.8167},
            "Suhareka": {"lat": 42.3667, "lng": 20.8167},
            "Malishevë": {"lat": 42.4833, "lng": 20.7500},
            "Rahovec": {"lat": 42.4000, "lng": 20.6500},
        }
        
        locations = []
        for report in reports:
            # Gjej koordinatat bazuar në lokacionin e raportuar
            lat = report.location_lat
            lng = report.location_lng
            location_name = report.location_name
            
            # Nëse nuk ka koordinata, provo të gjesh nga emri i qytetit
            if not lat or not lng:
                for city, coords in city_coords.items():
                    if location_name and city.lower() in location_name.lower():
                        lat = coords["lat"]
                        lng = coords["lng"]
                        break
            
            # Nëse ende nuk ka koordinata, përdor koordinata të rastësishme
            if not lat or not lng:
                lat = 42.6 + (report.id % 100) / 1000
                lng = 20.9 + (report.id % 100) / 1000
            
            locations.append({
                "id": report.id,
                "latitude": lat,
                "longitude": lng,
                "location_name": location_name or "Vend i panjohur",
                "description": report.description[:150] if report.description else "",
                "type": "citizen_report",
                "reported_at": report.reported_at.isoformat(),
                "status": report.status,
                "citizen_id": report.citizen_id
            })
        
        return locations
    
    def get_heatmap_data(self) -> Dict[str, Any]:
        """Get heatmap data for all locations"""
        reports = self.get_citizen_reports_locations(days=90)
        missing_persons = self.get_missing_persons_locations()
        
        # Prepare data for heatmap
        heatmap_points = []
        for report in reports:
            if report.get("latitude") and report.get("longitude"):
                heatmap_points.append({
                    "lat": report["latitude"],
                    "lng": report["longitude"],
                    "weight": 1,
                    "type": "report"
                })
        
        for person in missing_persons:
            if person.get("latitude") and person.get("longitude"):
                heatmap_points.append({
                    "lat": person["latitude"],
                    "lng": person["longitude"],
                    "weight": 2,
                    "type": "missing"
                })
        
        return {
            "heatmap_points": heatmap_points,
            "reports": reports,
            "missing_persons": missing_persons,
            "total_reports": len(reports),
            "total_missing": len(missing_persons)
        }