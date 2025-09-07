from pydantic import BaseModel, EmailStr
from typing import Literal

class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: Literal["participant", "creator"]

    class Config:
        orm_mode = True
