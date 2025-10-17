from sqlalchemy import Column, Integer, String, Float
from ..database import Base
import time


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    # Comma-separated list of photo IDs for this transaction
    photo_ids = Column(String, default="")
    amount = Column(Float, default=0.0)
    status = Column(String, default="pending")  # pending | success | failed
    txn_id = Column(String, nullable=True)  # gateway transaction/reference id
    created_at = Column(Integer, default=lambda: int(time.time()))

