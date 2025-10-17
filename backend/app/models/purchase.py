from sqlalchemy import Column, Integer
from ..database import Base

class Purchase(Base):
    __tablename__ = "purchases"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    photo_id = Column(Integer, index=True)
