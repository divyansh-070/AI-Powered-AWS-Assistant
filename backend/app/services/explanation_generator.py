from app.services.llm_service import generate_with_llm

EXPLANATION_SYSTEM_PROMPT = """You are an AWS cloud expert. 
Explain the provided CloudFormation template in plain, easy-to-understand English.
Focus on what resources are being created and how they interact.
Keep it concise and do not include the YAML code in your explanation."""

async def generate_explanation(template_yaml: str) -> str:
    """Generate a plain English explanation of a CloudFormation template."""
    return await generate_with_llm(EXPLANATION_SYSTEM_PROMPT, template_yaml)
