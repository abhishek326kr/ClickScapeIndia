from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .auth import get_current_user
from ..models.user import User
from ..services.plan_service import get_plan

router = APIRouter()

@router.get("")
def marketplace_index():
    return {"items": []}


@router.get("/eligibility")
def marketplace_eligibility(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = get_plan(user)
    eligible = plan == "premium"
    return {"eligible": eligible, "reason": ("Premium required" if not eligible else "OK")}
