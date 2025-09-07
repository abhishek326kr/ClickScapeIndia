from pydantic import BaseModel

class DashboardSummary(BaseModel):
    participants: int
    my_uploads: int
    votes_received: int
