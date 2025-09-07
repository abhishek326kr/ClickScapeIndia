from fastapi import APIRouter, Depends, UploadFile, File, Form, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.photos import PhotoOut, PhotoFilter, PhotoUpdate
from ..services.photo_service import PhotoService
from .auth import get_current_user

router = APIRouter()

@router.post("/upload", response_model=PhotoOut)
async def upload_photo(
    title: str = Form(...),
    category: str = Form(...),
    tags: Optional[str] = Form(""),
    price: Optional[float] = Form(0.0),
    watermark: Optional[bool] = Form(True),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    service = PhotoService(db)
    return await service.upload_photo(
        title=title, category=category, tags=tags, price=price, watermark=(True if watermark is None else watermark), image=image, user_id=user.id
    )

@router.get("", response_model=List[PhotoOut])
def list_photos(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    location: Optional[str] = None,
    popularity: Optional[str] = None,
    db: Session = Depends(get_db),
):
    service = PhotoService(db)
    filters = PhotoFilter(category=category, location=location, popularity=popularity)
    return service.list_photos(page=page, size=size, filters=filters)


@router.get("/my", response_model=List[PhotoOut])
def list_my_photos(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    service = PhotoService(db)
    return service.list_my_photos(user_id=user.id, page=page, size=size)


@router.get("/{photo_id}", response_model=PhotoOut)
def get_photo(photo_id: int, db: Session = Depends(get_db)):
    service = PhotoService(db)
    photo = service.get_photo(photo_id)
    if not photo:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Photo not found")
    return PhotoOut.from_orm(photo)


@router.put("/{photo_id}", response_model=PhotoOut)
def update_photo(photo_id: int, payload: PhotoUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    service = PhotoService(db)
    try:
        # Ownership check
        existing = service.get_photo(photo_id)
        if not existing or (existing.user_id is not None and existing.user_id != user.id):
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Not allowed")
        return service.update_photo(photo_id, payload)
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Photo not found")


@router.delete("/{photo_id}")
def delete_photo(photo_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    service = PhotoService(db)
    try:
        existing = service.get_photo(photo_id)
        if not existing or (existing.user_id is not None and existing.user_id != user.id):
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Not allowed")
        service.delete_photo(photo_id)
        return {"status": "deleted"}
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Photo not found")
