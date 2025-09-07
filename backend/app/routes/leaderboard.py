from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.leaderboard import LeaderboardEntry
from ..services.leaderboard_service import LeaderboardService
from typing import List

router = APIRouter()

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def leaderboard(db: Session = Depends(get_db)):
    service = LeaderboardService(db)
    return service.get_leaderboard()
