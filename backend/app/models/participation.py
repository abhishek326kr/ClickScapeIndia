from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func
from ..database import Base

class Participation(Base):
    __tablename__ = "participations"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    plan = Column(String, nullable=False)  # enthusiast | creator_plus
    entry_paid = Column(Boolean, default=False)
    addon_slots = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
