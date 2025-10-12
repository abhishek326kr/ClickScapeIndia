from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from .auth import get_current_user
from ..models.user import User
from ..services.plan_service import get_plan
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
