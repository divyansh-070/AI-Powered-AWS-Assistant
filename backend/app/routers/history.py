from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.schemas import HistoryListResponse, HistoryItem, ErrorResponse
from app.database import get_db
from app.models import PromptHistory
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
        # Get total count
        count_stmt = select(func.count(PromptHistory.id))
        count_result = await db.execute(count_stmt)
        total = count_result.scalar_one_or_none() or 0

        # Get items sorted by most recent
        stmt = select(PromptHistory).order_by(desc(PromptHistory.created_at))
        result = await db.execute(stmt)
        records = result.scalars().all()

        items = [
            HistoryItem(
                id=record.id,
                prompt_text=record.prompt_text,
                created_at=record.created_at,
                has_template=bool(record.generated_template)
            )
            for record in records
        ]

        return HistoryListResponse(items=items, total=total)
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch history records")
