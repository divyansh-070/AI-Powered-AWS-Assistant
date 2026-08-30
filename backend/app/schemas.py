from pydantic import BaseModel, Field
from typing import Dict, List, Literal, Optional
from datetime import datetime

class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=10)

class GenerateResponse(BaseModel):
    template_yaml: str
    template_json: dict
    explanation: str
    prompt_id: int

class CostBreakdownItem(BaseModel):
    resource: str
    resource_type: str
    monthly_cost: float

class CostEstimateResponse(BaseModel):
    total_monthly: float
    breakdown: List[CostBreakdownItem]
    region: str

class SecurityIssue(BaseModel):
    severity: Literal["HIGH", "MEDIUM", "LOW"]
    resource: str
    issue: str
    fix: str

class SecurityReportResponse(BaseModel):
    issues: List[SecurityIssue]
    score: int = Field(ge=0, le=100)
    summary: str

class DiagramResponse(BaseModel):
    mermaid_code: str

class HistoryItem(BaseModel):
    id: int
    prompt_text: str
    created_at: datetime
    has_template: bool

class HistoryListResponse(BaseModel):
    items: List[HistoryItem]
    total: int

class ErrorResponse(BaseModel):
    detail: str
