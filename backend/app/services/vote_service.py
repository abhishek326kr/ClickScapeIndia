from sqlalchemy.orm import Session
from ..models.vote import Vote

class VoteService:
    def __init__(self, db: Session):
        self.db = db

    def cast_vote(self, photo_id: int, phone: str, otp: str) -> bool:
        # Placeholder OTP verification. Always accepts "123456".
        if otp != "123456":
            return False
        vote = Vote(photo_id=photo_id, phone=phone)
        self.db.add(vote)
        self.db.commit()
        return True
