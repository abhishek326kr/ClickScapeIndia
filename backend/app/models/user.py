from sqlalchemy import Column, Integer, String
from ..database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="participant")  # participant | creator
    # Plan and quota tracking
    # plan: 'free' or 'premium'
    plan = Column(String, default="free")
    # storage_used: total bytes used by this user (premium only enforced)
    storage_used = Column(Integer, default=0)
    # Password reset support
    reset_token = Column(String, default="")
    reset_expires = Column(Integer, default=0)  # epoch seconds
