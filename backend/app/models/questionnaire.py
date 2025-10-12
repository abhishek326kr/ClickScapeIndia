from sqlalchemy import Column, Integer, String, ForeignKey
from ..database import Base

class Questionnaire(Base):
    __tablename__ = "questionnaires"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    # Store answers as plain text per question
    style_tools = Column(String, default="")
    motivation = Column(String, default="")
    vision = Column(String, default="")
    community = Column(String, default="")
    future = Column(String, default="")
