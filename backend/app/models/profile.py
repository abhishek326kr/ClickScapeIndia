from sqlalchemy import Column, Integer, String, ForeignKey
from ..database import Base

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    name = Column(String, default="")
    phone = Column(String, default="")
    location = Column(String, default="")
    address = Column(String, default="")
    facebook = Column(String, default="")
    instagram = Column(String, default="")
    portfolio = Column(String, default="")
    avatar_url = Column(String, default="")
