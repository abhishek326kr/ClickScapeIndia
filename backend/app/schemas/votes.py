from pydantic import BaseModel

class VoteResponse(BaseModel):
    status: str = "ok"
