from pydantic import BaseModel
from typing import Literal

class ParticipationCreate(BaseModel):
    plan: Literal["enthusiast", "creator_plus"]
    addon_slots: int = 0

class ParticipationOut(BaseModel):
    id: int
    user_id: int
    plan: str
    entry_paid: bool
    addon_slots: int

    class Config:
        orm_mode = True
