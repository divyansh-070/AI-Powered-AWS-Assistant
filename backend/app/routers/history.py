from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
import yaml

from app.schemas import HistoryListResponse, HistoryItem, GenerateResponse, ErrorResponse
from app.database import get_db
from app.models import PromptHistory
from app.services.prompt_processor import safe_load_yaml
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["History"])

@router.get(
    "/history",
    response_model=HistoryListResponse,
    responses={500: {"model": ErrorResponse}},
    description="Retrieve all previously generated infrastructure templates from history."
)
async def get_history_endpoint(
    db: AsyncSession = Depends(get_db)
):
    try:
        count_stmt = select(func.count(PromptHistory.id))
        count_result = await db.execute(count_stmt)
        total = count_result.scalar_one_or_none() or 0

        stmt = select(PromptHistory).order_by(desc(PromptHistory.created_at))
        result = await db.execute(stmt)
        records = result.scalars().all()

        items = [
            HistoryItem(
                id=record.id,
                prompt_text=record.prompt_text,
                generated_template=record.generated_template,
                explanation=record.explanation,
                created_at=record.created_at,
                has_template=bool(record.generated_template)
            )
            for record in records
        ]

        return HistoryListResponse(items=items, total=total)
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch history records")


@router.get(
    "/history/{item_id}",
    response_model=GenerateResponse,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    description="Get specific history template item details by ID."
)
async def get_history_detail_endpoint(
    item_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        stmt = select(PromptHistory).where(PromptHistory.id == item_id)
        result = await db.execute(stmt)
        record = result.scalar_one_or_none()

        if not record:
            raise HTTPException(status_code=404, detail="History record not found")

        template_yaml = record.generated_template or ""
        template_json = {}
        if template_yaml:
            try:
                template_json = safe_load_yaml(template_yaml)
            except Exception:
                template_json = {}

        return GenerateResponse(
            template_yaml=template_yaml,
            template_json=template_json if isinstance(template_json, dict) else {},
            explanation=record.explanation or "",
            prompt_id=record.id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching history detail: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch history item detail")
