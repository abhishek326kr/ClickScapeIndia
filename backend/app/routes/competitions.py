from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.participation import Participation
from ..schemas.participation import ParticipationCreate, ParticipationOut
from .auth import get_current_user

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
