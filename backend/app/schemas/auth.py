from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    role: Literal["participant", "creator"] = "participant"
    name: Optional[str] = ""
    phone: Optional[str] = ""
    plan: Literal["free", "premium"] = "free"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class MeResponse(BaseModel):
    email: EmailStr
    role: str
    plan: Literal["free", "premium"] = "free"
