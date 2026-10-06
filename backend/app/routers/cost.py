from fastapi import APIRouter, HTTPException
from app.schemas import TemplateAnalysisRequest, CostEstimateResponse, ErrorResponse
from app.services.cost_estimator import estimate_costs
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Cost"])


@router.post(
    "/estimate-cost",
    response_model=CostEstimateResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    description="Calculate monthly cost estimate for AWS resources in a CloudFormation template."
)
async def estimate_cost_endpoint(request: TemplateAnalysisRequest):
    template = request.template_yaml or request.template_json
    if not template:
        raise HTTPException(status_code=400, detail="Either template_yaml or template_json must be provided")

    try:
        result = estimate_costs(template, region=request.region or "us-east-1")
        return result
    except Exception as e:
        logger.error(f"Error estimating costs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to estimate costs: {str(e)}")
