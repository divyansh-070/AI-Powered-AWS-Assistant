import yaml
import re
from typing import Dict, Any
from app.services.llm_service import generate_with_llm


SYSTEM_PROMPT = """You are an expert AWS CloudFormation architect.
Generate a valid AWS CloudFormation YAML template based on the user's request.
Ensure it uses AWSTemplateFormatVersion: '2010-09-09' and includes necessary Resources.
Include appropriate Parameters, Outputs, and Mappings where relevant.
Follow AWS security best practices (e.g., restrict security group ingress, enable encryption).
Output ONLY the raw YAML code inside a markdown code block. Do not include any explanations.
"""

# ──────────────────────────────────────────────────────────────
# Custom YAML Loader that supports CloudFormation intrinsic functions
# CloudFormation uses YAML tags like !Ref, !Sub, !GetAtt, etc.
# yaml.safe_load() chokes on these, so we register custom constructors.
# ──────────────────────────────────────────────────────────────

CFN_TAGS = [
    "!Ref", "!Sub", "!GetAtt", "!Join", "!Select", "!Split",
    "!FindInMap", "!GetAZs", "!ImportValue", "!Condition",
    "!Equals", "!If", "!Not", "!And", "!Or", "!Base64",
    "!Cidr", "!Transform",
]


class CfnLoader(yaml.SafeLoader):
    """YAML loader that handles AWS CloudFormation intrinsic function tags."""
    pass


def _cfn_tag_constructor(loader, tag_suffix, node):
    """Generic constructor for CloudFormation tags — preserves them as dicts."""
    if isinstance(node, yaml.ScalarNode):
        value = loader.construct_scalar(node)
        return {tag_suffix: value}
    elif isinstance(node, yaml.SequenceNode):
        value = loader.construct_sequence(node, deep=True)
        return {tag_suffix: value}
    elif isinstance(node, yaml.MappingNode):
        value = loader.construct_mapping(node, deep=True)
        return {tag_suffix: value}
    return {tag_suffix: None}


# Register all CloudFormation tags
for tag in CFN_TAGS:
    tag_name = tag[1:]  # strip the '!'
    CfnLoader.add_multi_constructor(
        f"!{tag_name}",
        lambda loader, suffix, node, t=tag_name: _cfn_tag_constructor(loader, t, node),
    )

# Also register a catch-all for any other ! tags we might have missed
CfnLoader.add_multi_constructor(
    "!",
    lambda loader, suffix, node: _cfn_tag_constructor(loader, suffix, node),
)


def extract_yaml_from_response(response: str) -> str:
    """Extract YAML code from markdown fences in the response."""
    # Match ```yaml ... ``` or ``` ... ```
    pattern = r"```(?:yaml|yml)?\s*\n?(.*?)```"
    match = re.search(pattern, response, re.DOTALL)
    if match:
        return match.group(1).strip()
    return response.strip()


async def process_prompt(user_prompt: str) -> Dict[str, Any]:
    """Process a user prompt and generate CloudFormation YAML and JSON."""
    raw_response = await generate_with_llm(SYSTEM_PROMPT, user_prompt)
    yaml_content = extract_yaml_from_response(raw_response)

    # Parse YAML with CloudFormation tag support
    try:
        json_content = yaml.load(yaml_content, Loader=CfnLoader)
    except yaml.YAMLError as e:
        raise ValueError(f"Failed to parse generated YAML: {e}")

    if not isinstance(json_content, dict):
        raise ValueError("Generated template is not a valid dictionary")

    # Check for essential CloudFormation keys
    if 'Resources' not in json_content:
        raise ValueError("Generated template missing 'Resources' key")

    # Add AWSTemplateFormatVersion if missing
    if 'AWSTemplateFormatVersion' not in json_content:
        json_content['AWSTemplateFormatVersion'] = '2010-09-09'
        yaml_content = f"AWSTemplateFormatVersion: '2010-09-09'\n{yaml_content}"

    return {
        "yaml": yaml_content,
        "json": json_content,
        "raw_response": raw_response
    }
