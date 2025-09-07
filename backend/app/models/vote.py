from sqlalchemy import Column, Integer, String, ForeignKey
from ..database import Base

class Vote(Base):
    __tablename__ = "votes"
    id = Column(Integer, primary_key=True, index=True)
    photo_id = Column(Integer, ForeignKey("photos.id"))
    phone = Column(String)
    user_id = Column(Integer, index=True, nullable=True)
