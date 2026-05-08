from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.alert import Alert
from app.models.gallery import Gallery
from app.models.search import Search
from app.dependencies import get_current_user
from app.models.user import User
from typing import Optional
from app.dependencies import get_current_user, get_current_admin

router = APIRouter()

@router.get("/")
def get_alerts(
    reviewed: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Alert)
    if reviewed is not None:
        query = query.filter(Alert.reviewed == reviewed)
    alerts = query.order_by(Alert.alert_timestamp.desc()).offset(skip).limit(limit).all()

    result = []
    for alert in alerts:
        person = db.query(Gallery).filter(Gallery.id == alert.person_id).first()
        result.append({
            "id": alert.id,
            "person_id": person.id if person else None,   # shto këtë rresht
            "person_name": person.name if person else "Unknown",
            "similarity": alert.similarity,
            "timestamp": alert.alert_timestamp,
            "reviewed": alert.reviewed,
            "thumbnail_path": alert.thumbnail_path,
            "source": alert.source
        })
    return result


@router.post("/{alert_id}/review")
def review_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.reviewed = True
    db.commit()
    return {"message": "Alert marked as reviewed"}

@router.delete("/{alert_id}")
def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)  # vetëm admin mund të fshijë
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted successfully"}

@router.post("/create/{person_id}")
def create_manual_alert(
    person_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Kontrollo nëse personi ekziston
    person = db.query(Gallery).filter(Gallery.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    # Krijo një search record për referencë
    new_search = Search(
        user_id=current_user.id,
        search_type="manual",
        result_json=f'{{"manual_alert": true, "person_id": {person_id}}}'
    )
    db.add(new_search)
    db.flush()  # për të marrë ID-në e search

    # Krijo alertin
    alert = Alert(
        person_id=person_id,
        search_id=new_search.id,
        similarity=1.0,
        source=f"Manual by {current_user.email}",
        reviewed=False
    )
    db.add(alert)
    db.commit()

    return {"message": f"Alert created for {person.name}", "alert_id": alert.id}