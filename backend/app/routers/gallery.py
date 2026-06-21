from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
from datetime import datetime
from app.db.database import get_db
from app.models.gallery import Gallery
from app.schemas.gallery import GalleryUpdate, GalleryOut
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/gallery", tags=["Gallery"])

UPLOAD_DIR = "data/gallery"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ================= LIST =================
@router.get("/", response_model=list[GalleryOut])
def list_gallery(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listo të gjithë personat në galeri"""
    return db.query(Gallery).offset(skip).limit(limit).all()


# ================= GET ONE =================
@router.get("/{item_id}", response_model=GalleryOut)
def get_gallery_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Merr një person specifik nga galeria"""
    item = db.query(Gallery).filter(Gallery.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


# ================= CREATE =================
@router.post("/", response_model=GalleryOut)
async def create_gallery_item(
    name: str = Form(...),
    status: str = Form("missing"),
    description: str = Form(None),
    id_number: str = Form(None),
    phone: str = Form(None),
    residence_location: str = Form(None),
    photo_location: str = Form(None),
    station_added: str = Form(None),
    birth_date: str = Form(None),
    additional_info: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Shto një person të ri në galeri"""
    # Lexo imazhin
    image_bytes = await file.read()
    
    # Konverto birth_date
    birth_date_obj = None
    if birth_date:
        try:
            birth_date_obj = datetime.strptime(birth_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Formati i datëlindjes duhet të jetë YYYY-MM-DD")
    
    # Ruaj foton
    safe_name = f"{name.replace(' ', '_')}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    
    with open(file_path, "wb") as buffer:
        buffer.write(image_bytes)
    
    # Krijo objektin
    gallery_item = Gallery(
        name=name,
        description=description,
        status=status,
        image_path=safe_name,
        id_number=id_number,
        phone=phone,
        residence_location=residence_location,
        photo_location=photo_location,
        station_added=station_added,
        birth_date=birth_date_obj,
        additional_info=additional_info
    )
    
    db.add(gallery_item)
    db.commit()
    db.refresh(gallery_item)
    
    return gallery_item


# ================= UPDATE =================
@router.put("/{item_id}", response_model=GalleryOut)
def update_gallery_item(
    item_id: int,
    update: GalleryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Përditëso një person në galeri"""
    item = db.query(Gallery).filter(Gallery.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    for key, value in update.dict(exclude_unset=True).items():
        setattr(item, key, value)
    
    db.commit()
    db.refresh(item)
    return item


# ================= DELETE =================
@router.delete("/{item_id}")
def delete_gallery_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fshij një person nga galeria"""
    # Vetëm admin dhe detective mund të fshijnë
    if current_user.role not in ['admin', 'detective']:
        raise HTTPException(status_code=403, detail="Only admin or detective can delete items")
    
    item = db.query(Gallery).filter(Gallery.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Fshij foton
    image_full_path = os.path.join(UPLOAD_DIR, item.image_path)
    if os.path.exists(image_full_path):
        os.remove(image_full_path)
    
    # Fshij nga database
    db.delete(item)
    db.commit()
    
    return {"message": "Deleted", "id": item_id}