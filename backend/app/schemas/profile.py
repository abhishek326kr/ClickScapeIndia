from pydantic import BaseModel
from typing import Optional

class ProfileIn(BaseModel):
    name: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    address: Optional[str] = ""
    facebook: Optional[str] = ""
    instagram: Optional[str] = ""
    portfolio: Optional[str] = ""

class ProfileOut(ProfileIn):
    user_id: int
    avatar_url: Optional[str] = ""

    class Config:
        from_attributes = True
