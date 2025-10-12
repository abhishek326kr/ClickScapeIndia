from pydantic import BaseModel
from typing import Optional

class QuestionnaireIn(BaseModel):
    style_tools: Optional[str] = ""
    motivation: Optional[str] = ""
    vision: Optional[str] = ""
    community: Optional[str] = ""
    future: Optional[str] = ""

class QuestionnaireOut(QuestionnaireIn):
    user_id: int

    class Config:
        from_attributes = True
