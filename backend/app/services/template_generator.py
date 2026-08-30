from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas import GenerateResponse
from app.models import PromptHistory
from app.services.prompt_processor import process_prompt
from app.services.explanation_generator import generate_explanation

async def generate_template(prompt: str, db: AsyncSession) -> GenerateResponse:
    """Generate a CloudFormation template from a prompt, explain it, and save to DB."""
    # 1. Process prompt to generate template
    processed = await process_prompt(prompt)
    template_yaml = processed["yaml"]
    template_json = processed["json"]
    
    # 2. Generate explanation
    explanation = await generate_explanation(template_yaml)
    
    # 3. Save to database
    history_item = PromptHistory(
        prompt_text=prompt,
        generated_template=template_yaml,
        explanation=explanation
    )
    db.add(history_item)
    await db.commit()
    await db.refresh(history_item)
    
    # 4. Return response
    return GenerateResponse(
        template_yaml=template_yaml,
        template_json=template_json,
        explanation=explanation,
        prompt_id=history_item.id
    )
