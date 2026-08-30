import yaml
import re
from typing import Dict, Any
from app.services.llm_service import generate_with_llm

SYSTEM_PROMPT = """You are an expert AWS CloudFormation architect.
Generate a valid AWS CloudFormation YAML template based on the user's request.
Ensure it uses AWSTemplateFormatVersion: '2010-09-09' and includes necessary Resources.
Output ONLY the raw YAML code inside a markdown code block. Do not include any explanations.
"""

def extract_yaml_from_response(response: str) -> str:
    """Extract YAML code from markdown fences in the response."""
    pattern = r"```(?:yaml)?(.*?)```"
    match = re.search(pattern, response, re.DOTALL)
    if match:
        return match.group(1).strip()
    return response.strip()

async def process_prompt(user_prompt: str) -> Dict[str, Any]:
    """Process a user prompt and generate CloudFormation YAML and JSON."""
    raw_response = await generate_with_llm(SYSTEM_PROMPT, user_prompt)
    yaml_content = extract_yaml_from_response(raw_response)
    
    try:
        json_content = yaml.safe_load(yaml_content)
    except yaml.YAMLError as e:
        raise ValueError(f"Failed to parse generated YAML: {e}")
        
    if not isinstance(json_content, dict):
        raise ValueError("Generated template is not a valid dictionary")
        
    if 'AWSTemplateFormatVersion' not in json_content or 'Resources' not in json_content:
        raise ValueError("Generated template missing required CloudFormation keys")
        
    return {
        "yaml": yaml_content,
        "json": json_content,
        "raw_response": raw_response
    }
