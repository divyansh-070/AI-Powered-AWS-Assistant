from fastapi import APIRouter, HTTPException
from app.schemas import TemplateAnalysisRequest, DiagramResponse, ErrorResponse
from app.services.diagram_generator import generate_mermaid_diagram
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Diagram"])


@router.post(
    "/generate-diagram",
    response_model=DiagramResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    description="Generate Mermaid.js architectural topology diagram code from CloudFormation template."
)
async def generate_diagram_endpoint(request: TemplateAnalysisRequest):
    template = request.template_yaml or request.template_json
    if not template:
        raise HTTPException(status_code=400, detail="Either template_yaml or template_json must be provided")

    try:
        result = generate_mermaid_diagram(template)
        return result
    except Exception as e:
        logger.error(f"Error generating diagram: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate diagram: {str(e)}")
