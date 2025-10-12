from pydantic import BaseModel
from typing import Optional

class PhotoOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    title: str
    category: str
    tags: str
    price: float
    royalty_percent: Optional[float] = 0.15
    watermark: bool
    url: Optional[str] = None
    processed_url: Optional[str] = None
    original_url: Optional[str] = None
    bytes_size: Optional[int] = 0
    owner_name: Optional[str] = None
    owner_avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class PhotoFilter(BaseModel):
    category: Optional[str] = None
    location: Optional[str] = None
    popularity: Optional[str] = None


class PhotoUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    price: Optional[float] = None
    watermark: Optional[bool] = None
