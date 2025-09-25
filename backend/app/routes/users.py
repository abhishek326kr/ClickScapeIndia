from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from .auth import get_current_user
from ..models.profile import Profile
from ..schemas.profile import ProfileIn, ProfileOut
from ..schemas.users import PlanChangeRequest, EntitlementsOut
from ..services.plan_service import get_plan, get_entitlements
import os
import uuid

router = APIRouter()

@router.get("/me/profile", response_model=ProfileOut)
def get_my_profile(db: Session = Depends(get_db), user=Depends(get_current_user)):
    prof = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not prof:
        prof = Profile(user_id=user.id)
        db.add(prof)
        db.commit()
        db.refresh(prof)
    return prof


@router.post("/me/plan")
def change_plan(payload: PlanChangeRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Basic server-side validation; in real life you'd integrate payments/webhooks
    plan = payload.plan
    if plan not in {"free", "premium"}:
        plan = "free"
    # No-op if same
    if getattr(user, "plan", "free") == plan:
        return {"status": "ok", "plan": plan}
    user.plan = plan
    db.add(user)
    db.commit()
    return {"status": "ok", "plan": plan}


@router.get("/me/entitlements", response_model=EntitlementsOut)
def my_entitlements(user=Depends(get_current_user)):
    plan = get_plan(user)
    return EntitlementsOut(**get_entitlements(plan))


@router.put("/me/profile", response_model=ProfileOut)
def update_my_profile(payload: ProfileIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    prof = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not prof:
        prof = Profile(user_id=user.id)
        db.add(prof)
        db.flush()
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(prof, field, value)
    db.commit()
    db.refresh(prof)
    return prof


@router.post("/me/avatar", response_model=ProfileOut)
async def upload_avatar(avatar: UploadFile = File(...), db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Save avatar to uploads and set profile.avatar_url
    base_dir = os.path.dirname(os.path.dirname(__file__))  # .../app
    upload_dir = os.path.join(base_dir, "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(avatar.filename or "")[1].lower() or ".jpg"
    filename = f"avatar_{user.id}_{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, filename)

    content = await avatar.read()
    with open(file_path, "wb") as f:
        f.write(content)

    url = f"/uploads/{filename}"
    prof = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not prof:
        prof = Profile(user_id=user.id)
        db.add(prof)
        db.flush()
    prof.avatar_url = url
    db.commit()
    db.refresh(prof)
    return prof
