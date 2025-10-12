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
    # Royalty percent (e.g., 0.15 = 15%) used to compute photographer earnings on purchase
    royalty_percent = Column(Float, default=0.15)
    watermark = Column(Boolean, default=False)
    # processed_url: the watermarked/derived image (free users see this)
    url = Column(String, nullable=True)  # legacy field kept for compatibility
    processed_url = Column(String, nullable=True)
    # original_url: the original uploaded file (premium export uses this)
    original_url = Column(String, nullable=True)
    # bytes_size: original file size in bytes (for quota)
    bytes_size = Column(Integer, default=0)
