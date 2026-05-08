from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import shutil
from datetime import datetime  # shto
from app.db.database import get_db
from app.models.gallery import Gallery
from app.schemas.gallery import GalleryUpdate, GalleryOut, GalleryCreate
from app.dependencies import get_current_user, get_current_admin
from app.models.user import User

router = APIRouter()

UPLOAD_DIR = "data/gallery"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=GalleryOut)
def create_gallery_item(
    name: str = Form(...),
    status: str = Form("missing"),
    description: str = Form(None),
    # Fushat e reja (opsionale)
    id_number: str = Form(None),
    phone: str = Form(None),
    residence_location: str = Form(None),
    photo_location: str = Form(None),
    station_added: str = Form(None),
    birth_date: str = Form(None),   # vjen si string "YYYY-MM-DD"
    additional_info: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Konverto birth_date në date nëse është dhënë
    birth_date_obj = None
    if birth_date:
        try:
            birth_date_obj = datetime.strptime(birth_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Formati i datëlindjes duhet të jetë YYYY-MM-DD")

    safe_name = f"{name.replace(' ', '_')}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

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

    # Llogarit encoding-in (pjesa ekzistuese)
    try:
        from app.services.face_service import FaceService
        encoding = FaceService.get_face_encoding_from_file(file_path)
        if encoding is not None:
            from app.services.matching import gallery_index
            gallery_index.add_encoding(encoding, gallery_item.id)
            print(f"Encoding added for {name}")
        else:
            print(f"No face detected in {file_path}")
    except Exception as e:
        print(f"Error computing encoding: {e}")

    return gallery_item


# ================= LIST =================
@router.get("/", response_model=list[GalleryOut])
def list_gallery(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Gallery).offset(skip).limit(limit).all()


# ================= GET ONE =================
@router.get("/{item_id}", response_model=GalleryOut)
def get_gallery_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Gallery).filter(Gallery.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


# ================= UPDATE =================
@router.put("/{item_id}", response_model=GalleryOut)
def update_gallery_item(
    item_id: int,
    update: GalleryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
    current_user: User = Depends(get_current_admin)
):
    item = db.query(Gallery).filter(Gallery.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if os.path.exists(item.image_path):
        os.remove(item.image_path)
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}