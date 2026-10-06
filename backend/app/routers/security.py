from fastapi import APIRouter, HTTPException
from app.schemas import TemplateAnalysisRequest, SecurityReportResponse, ErrorResponse
from app.services.security_validator import validate_security
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Security"])


@router.post(
    "/security-check",
    response_model=SecurityReportResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    description="Audit CloudFormation template against CIS security rules and generate security score."
)
async def security_check_endpoint(request: TemplateAnalysisRequest):
    template = request.template_yaml or request.template_json
    if not template:
        raise HTTPException(status_code=400, detail="Either template_yaml or template_json must be provided")

    try:
        result = validate_security(template)
        return result
    except Exception as e:
        logger.error(f"Error auditing security: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to audit security: {str(e)}")
