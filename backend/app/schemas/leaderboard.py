from pydantic import BaseModel

class LeaderboardEntry(BaseModel):
    photo_id: int
    title: str
    votes: int
    jury_score: float
