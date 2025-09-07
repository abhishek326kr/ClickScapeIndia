from sqlalchemy import Column, Integer, String, Float, Boolean
from ..database import Base

class Photo(Base):
    __tablename__ = "photos"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)
    title = Column(String, nullable=False)
    category = Column(String, index=True)
    tags = Column(String, default="")
    price = Column(Float, default=0.0)
    watermark = Column(Boolean, default=False)
    url = Column(String, nullable=True)
