from pydantic import BaseModel, EmailStr
from typing import Literal

class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: Literal["participant", "creator"]

    class Config:
        orm_mode = True


class PlanChangeRequest(BaseModel):
    plan: Literal["free", "premium"]


class EntitlementsOut(BaseModel):
    plan: Literal["free", "premium"]
    upload_limit: int
    max_file_mb: int
    formats: list[str]
    basic_edits: bool
    filters_basic: bool
    filters_pro: bool
    background_remove: bool
    ai_enhancer: bool
    watermark_remove: bool
    export_quality: Literal["web", "high"]
    ads: bool
    save_to_profile: bool
    marketplace_sell: bool
    premium_badge: bool
