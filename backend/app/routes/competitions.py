from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.participation import Participation
from ..schemas.participation import ParticipationCreate, ParticipationOut
from .auth import get_current_user
from ..models.photo import Photo
from sqlalchemy import select

router = APIRouter()

@router.get("/me", response_model=ParticipationOut | None)
def get_my_participation(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rec = db.query(Participation).filter(Participation.user_id == user.id).first()
    return rec


@router.post("/join", response_model=ParticipationOut)
def join_competition(payload: ParticipationCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # In real implementation, verify payment before marking entry_paid=True
    rec = db.query(Participation).filter(Participation.user_id == user.id).first()
    if rec:
        # Update plan/addon slots; keep entry_paid as is or set true for prototype
        rec.plan = payload.plan
        rec.addon_slots = payload.addon_slots
        rec.entry_paid = True
    else:
        rec = Participation(
            user_id=user.id,
            plan=payload.plan,
            addon_slots=payload.addon_slots,
            entry_paid=True,
        )
        db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


@router.post("/submit")
def submit_entry(photo_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Mark a user's photo as a competition entry.

    Requirements:
    - User must have joined (entry_paid)
    - User must own the photo
    - Sets a competition_entry flag on the photo
    """
    # Ensure user joined
    part = db.query(Participation).filter(Participation.user_id == user.id, Participation.entry_paid == True).first()  # noqa: E712
    if not part:
        raise HTTPException(status_code=403, detail="Join the competition first")

    # Validate photo ownership
    p = db.scalars(select(Photo).where(Photo.id == photo_id)).first()
    if not p:
        raise HTTPException(status_code=404, detail="Photo not found")
    if p.user_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this photo")

    # Flag as competition entry
    if not hasattr(p, 'competition_entry'):
        # Safety: if column doesn't exist, error out
        raise HTTPException(status_code=500, detail="Server not ready for submissions")
    setattr(p, 'competition_entry', True)
    db.add(p)
    db.commit()

    return {"success": True, "message": "Entry submitted", "data": {"photo_id": p.id}}
