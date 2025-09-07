from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.photo import Photo
from ..models.vote import Vote
from ..schemas.dashboard import DashboardSummary
from .auth import get_current_user

router = APIRouter()

@router.get("/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Total distinct participants (users who have uploaded at least one photo)
    participants = db.query(Photo.user_id).filter(Photo.user_id.isnot(None)).distinct().count()

    # My uploads count
    my_uploads = db.query(Photo).filter(Photo.user_id == user.id).count()

    # Total votes received on my uploads
    my_photo_ids = [pid for (pid,) in db.query(Photo.id).filter(Photo.user_id == user.id).all()]
    votes_received = 0
    if my_photo_ids:
        votes_received = db.query(Vote).filter(Vote.photo_id.in_(my_photo_ids)).count()

    return DashboardSummary(participants=participants, my_uploads=my_uploads, votes_received=votes_received)
