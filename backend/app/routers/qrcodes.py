from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse, JSONResponse
from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.qrcode_service import QRCodeService
import io

router = APIRouter(prefix="/api/qrcodes", tags=["QR Codes"])


@router.get("/person/{person_id}")
def get_person_qr_code(
    person_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate QR code for a missing person"""
    service = QRCodeService(db)
    result = service.generate_person_qr(person_id)
    
    if result.get("error"):
        raise HTTPException(status_code=404, detail=result["error"])
    
    return JSONResponse(content=result)


@router.get("/person/{person_id}/image")
def get_person_qr_image(
    person_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download QR code as PNG image"""
    service = QRCodeService(db)
    result = service.generate_person_qr(person_id)
    
    if result.get("error"):
        raise HTTPException(status_code=404, detail=result["error"])
    
    # Decode base64 to bytes
    import base64
    qr_bytes = base64.b64decode(result["qr_base64"])
    
    return StreamingResponse(
        io.BytesIO(qr_bytes),
        media_type="image/png",
        headers={"Content-Disposition": f"attachment; filename=qr_person_{person_id}.png"}
    )


@router.get("/person/{person_id}/poster")
def get_person_poster(
    person_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download poster PDF with QR code"""
    service = QRCodeService(db)
    pdf_bytes = service.generate_poster_with_qr(person_id)
    
    if not pdf_bytes:
        raise HTTPException(status_code=404, detail="Could not generate poster")
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=poster_person_{person_id}.pdf"}
    )