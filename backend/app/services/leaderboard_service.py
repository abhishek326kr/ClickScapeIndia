from typing import List
from sqlalchemy.orm import Session
from ..schemas.leaderboard import LeaderboardEntry
from ..models.photo import Photo
from ..models.vote import Vote
from sqlalchemy import func

class LeaderboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_leaderboard(self) -> List[LeaderboardEntry]:
        rows = (
            self.db.query(Photo.id, Photo.title, func.count(Vote.id).label("votes"))
            .outerjoin(Vote, Vote.photo_id == Photo.id)
            .group_by(Photo.id)
            .order_by(func.count(Vote.id).desc())
            .limit(50)
            .all()
        )
        return [LeaderboardEntry(photo_id=r.id, title=r.title, votes=r.votes, jury_score=0.0) for r in rows]
