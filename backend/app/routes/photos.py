from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.photos import PhotoOut, PhotoFilter, PhotoUpdate
from ..services.photo_service import PhotoService
from .auth import get_current_user
from ..models.user import User
from ..services.plan_service import get_plan, get_upload_rules

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
    user: User = Depends(get_current_user),
):
    service = PhotoService(db)
    try:
        return await service.upload_photo(
            title=title,
            category=category,
            tags=tags or "",
            price=price or 0.0,
            watermark=(True if watermark is None else watermark),
            image=image,
            user=user,
        )
    except ValueError as e:
        # Plan-based validation errors surface here
        raise HTTPException(status_code=400, detail=str(e))

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
    user: User = Depends(get_current_user),
):
    service = PhotoService(db)
    return service.list_my_photos(user_id=user.id, page=page, size=size)


@router.get("/{photo_id}", response_model=PhotoOut)
def get_photo(photo_id: int, db: Session = Depends(get_db)):
    service = PhotoService(db)
    photo = service.get_photo(photo_id)
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    return PhotoOut.from_orm(photo)


@router.put("/{photo_id}", response_model=PhotoOut)
def update_photo(photo_id: int, payload: PhotoUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    service = PhotoService(db)
    try:
        # Ownership check
        existing = service.get_photo(photo_id)
        if not existing or (existing.user_id is not None and existing.user_id != user.id):
            raise HTTPException(status_code=403, detail="Not allowed")
        return service.update_photo(photo_id, payload)
    except ValueError:
        raise HTTPException(status_code=404, detail="Photo not found")


@router.delete("/{photo_id}")
def delete_photo(photo_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    service = PhotoService(db)
    try:
        existing = service.get_photo(photo_id)
        if not existing or (existing.user_id is not None and existing.user_id != user.id):
            raise HTTPException(status_code=403, detail="Not allowed")
        service.delete_photo(photo_id)
        return {"status": "deleted"}
    except ValueError:
        raise HTTPException(status_code=404, detail="Photo not found")


@router.post("/upload/batch", response_model=List[PhotoOut])
async def upload_batch(
    title: str = Form(""),
    category: str = Form("uncategorized"),
    tags: Optional[str] = Form(""),
    price: Optional[float] = Form(0.0),
    images: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    plan = get_plan(user)
    _allowed, _max_bytes, upload_limit = get_upload_rules(plan)
    if len(images) > upload_limit:
        raise HTTPException(status_code=400, detail=f"{plan.capitalize()} plan allows up to {upload_limit} images per batch. Upgrade for more.")
    service = PhotoService(db)
    results: List[PhotoOut] = []
    for img in images:
        try:
            out = await service.upload_photo(
                title=title or (img.filename or "Untitled"),
                category=category,
                tags=tags or "",
                price=price or 0.0,
                watermark=True,
                image=img,
                user=user,
            )
            results.append(out)
        except ValueError as e:
            # Skip invalid with error note using dummy placeholder
            raise HTTPException(status_code=400, detail=str(e))
    return results


@router.get("/{photo_id}/export")
def export_photo(photo_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    service = PhotoService(db)
    try:
        url = service.export_photo_url(photo_id, user)
        plan = get_plan(user)
        quality = "high" if plan == "premium" else "web"
        if not url:
            raise HTTPException(status_code=404, detail="Export not available")
        return {"url": url, "quality": quality}
    except ValueError:
        raise HTTPException(status_code=404, detail="Photo not found")
