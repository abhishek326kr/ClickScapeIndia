from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .auth import get_current_user
from ..models.user import User
from ..services.plan_service import get_plan
from ..services.photo_service import PhotoService
from ..schemas.photos import PhotoOut
import os

router = APIRouter()

@router.get("")
def marketplace_index():
    return {"items": []}


@router.get("/eligibility")
def marketplace_eligibility(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = get_plan(user)
    eligible = plan == "premium"
    return {"eligible": eligible, "reason": ("Premium required" if not eligible else "OK")}


def _pricing_config():
    # Defaults; can be overridden by env
    min_price = float(os.getenv("PRICE_MIN", "50"))
    max_price = float(os.getenv("PRICE_MAX", "50000"))
    royalty_percent = float(os.getenv("ROYALTY_PERCENT", "0.30"))  # 30%
    return {
        "min": min_price,
        "max": max_price,
        "royalty_percent": royalty_percent,
        "currency": "INR",
    }

# Public: list marketplace items
@router.get("/list", response_model=list[PhotoOut])
def list_marketplace(page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    svc = PhotoService(db)
    return svc.list_marketplace(page=page, size=size)


# Public: get single public item
@router.get("/item/{photo_id}", response_model=PhotoOut)
def get_marketplace_item(photo_id: int, db: Session = Depends(get_db)):
    svc = PhotoService(db)
    p = svc.get_photo(photo_id)
    if not p or not (p.for_sale and p.is_public):
        raise HTTPException(status_code=404, detail="Not found")
    return PhotoOut.from_orm(p)


# Auth: publish/unpublish
@router.post("/publish/{photo_id}", response_model=PhotoOut)
def publish(photo_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Enforce creator-only publishing (treat 'participant'/'enthusiast'/'free' as non-creator)
    role = (getattr(user, "role", "") or "").lower()
    if role in {"participant", "enthusiast", "free"}:
        raise HTTPException(status_code=403, detail="Creator role required to publish")
    svc = PhotoService(db)
    try:
        return svc.publish(photo_id, user)
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not allowed")
    except ValueError:
        raise HTTPException(status_code=404, detail="Not found")


@router.post("/unpublish/{photo_id}", response_model=PhotoOut)
def unpublish(photo_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    role = (getattr(user, "role", "") or "").lower()
    if role in {"participant", "enthusiast", "free"}:
        raise HTTPException(status_code=403, detail="Creator role required to unpublish")
    svc = PhotoService(db)
    try:
        return svc.unpublish(photo_id, user)
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not allowed")
    except ValueError:
        raise HTTPException(status_code=404, detail="Not found")


@router.get("/pricing-config")
def pricing_config(user: User = Depends(get_current_user)):
    # Optionally vary by plan in future; for now return global config
    return _pricing_config()


@router.get("/royalty-preview")
def royalty_preview(amount: float = Query(..., gt=0), user: User = Depends(get_current_user)):
    cfg = _pricing_config()
    rp = cfg["royalty_percent"]
    return {
        "price": amount,
        "royalty_percent": rp,
        "royalty_amount": round(amount * rp, 2),
        "currency": cfg["currency"],
    }
