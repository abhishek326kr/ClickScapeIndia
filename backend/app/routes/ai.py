from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .auth import get_current_user
from ..models.user import User
from ..services.plan_service import get_plan, normalize_ext
from ..services.ai_service import AIService
import os
import uuid

router = APIRouter()


def _save_bytes(data: bytes, ext: str) -> str:
    base_dir = os.path.dirname(os.path.dirname(__file__))  # .../app
    upload_dir = os.path.join(base_dir, "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    ext = (ext or ".png").lower()
    filename = f"ai_{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(upload_dir, filename)
    with open(file_path, "wb") as f:
        f.write(data)
    return f"/uploads/{filename}"


@router.post("/background-remove")
async def background_remove(
    image: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Premium only
    if get_plan(user) != "premium":
        raise HTTPException(status_code=403, detail="Upgrade to Premium to use background removal")
    ai = AIService()
    raw = await image.read()
    out = ai.background_remove(raw, image.filename or "image.png")
    if not out:
        raise HTTPException(status_code=502, detail="Background removal service unavailable")
    url = _save_bytes(out, normalize_ext(image.filename) or ".png")
    return {"url": url}


@router.post("/enhance")
async def ai_enhance(
    image: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Premium only
    if get_plan(user) != "premium":
        raise HTTPException(status_code=403, detail="Upgrade to Premium to use AI Enhance")
    ai = AIService()
    raw = await image.read()
    out = ai.ai_enhance(raw, image.filename or "image.jpg", mode="autofix")
    if not out:
        raise HTTPException(status_code=502, detail="AI enhance service unavailable")
    url = _save_bytes(out, normalize_ext(image.filename) or ".jpg")
    return {"url": url}
