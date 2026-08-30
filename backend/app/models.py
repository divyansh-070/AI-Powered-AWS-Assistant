from sqlalchemy import Column, Integer, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base

class PromptHistory(Base):
    __tablename__ = 'prompt_history'

    id = Column(Integer, primary_key=True, autoincrement=True)
    prompt_text = Column(Text, nullable=False)
    generated_template = Column(Text)
    cost_report = Column(Text, nullable=True)
    security_report = Column(Text, nullable=True)
    diagram_code = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
