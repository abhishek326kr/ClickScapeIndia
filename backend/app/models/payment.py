from sqlalchemy import Column, Integer, String, Float
from ..database import Base

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    amount = Column(Float, default=0.0)
    provider_ref = Column(String, nullable=True)
