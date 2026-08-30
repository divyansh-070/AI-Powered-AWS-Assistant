from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import GenerateRequest, GenerateResponse, ErrorResponse
from app.database import get_db
from app.services.template_generator import generate_template
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Generate"])

@router.post(
    "/generate-template",
    response_model=GenerateResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    description="Generate an AWS CloudFormation template based on a natural language prompt."
)
async def generate_template_endpoint(
    request: GenerateRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await generate_template(request.prompt, db)
    except ValueError as e:
        logger.error(f"Validation error generating template: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating template: {e}")
        raise HTTPException(status_code=500, detail="Internal server error generating template")
