from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.vote_service import VoteService
from ..models.vote import Vote
from ..models.photo import Photo
from ..models.profile import Profile
from .auth import get_current_user
from typing import List, Dict, Any

router = APIRouter()

@router.post("/vote/{photo_id}")
def vote_photo(photo_id: int, phone: str, otp: str, db: Session = Depends(get_db)):
    service = VoteService(db)
    ok = service.cast_vote(photo_id, phone, otp)
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid vote/OTP")
    return {"status": "ok"}


@router.post("/vote/{photo_id}/auth")
def vote_photo_auth(photo_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Cast a vote associated to the authenticated user (no phone/otp)
    # Prevent duplicate votes by same user on the same photo
    exists = db.query(Vote).filter(Vote.photo_id == photo_id, Vote.user_id == user.id).first()
    if exists:
        raise HTTPException(status_code=400, detail="Already voted")
    v = Vote(photo_id=photo_id, phone="", user_id=user.id)
    db.add(v)
    db.commit()
    return {"status": "ok"}


@router.get("/votes/mine", response_model=List[Dict[str, Any]])
def my_votes(db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Return list of voted photos with owner info
    votes = db.query(Vote).filter(Vote.user_id == user.id).all()
    photo_ids = [v.photo_id for v in votes]
    photos = []
    owners: Dict[int, Profile] = {}
    if photo_ids:
        photos = db.query(Photo).filter(Photo.id.in_(photo_ids)).all()
        user_ids = {p.user_id for p in photos if p.user_id}
        if user_ids:
            for p in db.query(Profile).filter(Profile.user_id.in_(list(user_ids))).all():
                owners[p.user_id] = p
    items = []
    for p in photos:
        prof = owners.get(p.user_id)
        items.append({
            "photo_id": p.id,
            "title": p.title,
            "url": p.url,
            "owner_name": (prof.name if prof else ""),
            "owner_avatar_url": (prof.avatar_url if prof else ""),
        })
    return items
