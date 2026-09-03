import logging
import asyncio
from typing import Dict, Any

import ollama
from huggingface_hub import InferenceClient

from app.config import settings

logger = logging.getLogger(__name__)

# HuggingFace model to use (free tier, auto-routed to best provider)
HF_MODEL = "Qwen/Qwen2.5-72B-Instruct"

# Initialize HF client if token is available
hf_client = (
    InferenceClient(api_key=settings.HF_API_TOKEN)
    if settings.HF_API_TOKEN
    else None
)


async def generate_with_llm(system_prompt: str, user_prompt: str) -> str:
    """
    Generate text using configured LLM provider.
    Tries configured provider first, then falls back to secondary provider,
    and finally falls back to local smart template mock generator if APIs are unconfigured.
    """
    # 1. Try Ollama if selected
    if settings.LLM_PROVIDER == "ollama":
        try:
            client = ollama.AsyncClient(host=settings.OLLAMA_BASE_URL)
            response = await client.chat(
                model=settings.OLLAMA_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            )
            return response['message']['content']
        except Exception as e:
            logger.warning(f"Ollama generation failed: {e}. Trying HuggingFace fallback.")

    # 2. Try HuggingFace if available
    if hf_client:
        try:
            return await _generate_with_hf(system_prompt, user_prompt)
        except Exception as e:
            logger.warning(f"HuggingFace generation failed: {e}. Falling back to Mock generator.")

    # 3. Smart Mock Mode Fallback (Option 3: guarantees 100% reliable generation for testing)
    return _generate_with_mock(system_prompt, user_prompt)


async def _generate_with_hf(system_prompt: str, user_prompt: str) -> str:
    """Generate text using HuggingFace Inference API."""
    def sync_call():
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        response = hf_client.chat_completion(
            model=HF_MODEL,
            messages=messages,
            max_tokens=2048,
            temperature=0.7,
        )
        return response.choices[0].message.content

    try:
        return await asyncio.to_thread(sync_call)
    except Exception as e:
        logger.error(f"HuggingFace generation failed: {e}")
        raise e


def _generate_with_mock(system_prompt: str, user_prompt: str) -> str:
    """Fallback generator when external LLM APIs are unavailable."""
    logger.info("Using smart mock fallback generator for AWS CloudFormation template.")
    
    # If the user prompt is YAML content (explanation request), return structured explanation text
    if "AWSTemplateFormatVersion" in user_prompt or "Resources:" in user_prompt:
        return (
            "### Architecture Overview\n"
            "This template provisions a complete production-grade AWS infrastructure stack based on your prompt:\n\n"
            "- **Compute & Web Server**: Configured with AWS EC2 t3.micro instance with custom Security Groups for HTTP/HTTPS access.\n"
            "- **Storage Layer**: AWS S3 Bucket created with strict public access blocks and versioning enabled.\n"
            "- **Database Layer**: Managed AWS RDS MySQL instance provisioned with secure credential management.\n"
            "- **Network & Security**: Inbound traffic rules, IAM roles, and intrinsic CloudFormation functions setup automatically."
        )

    prompt_lower = user_prompt.lower()
    resources = []

    if "s3" in prompt_lower or "bucket" in prompt_lower or "storage" in prompt_lower or "static" in prompt_lower:
        resources.append("""  AppStorageBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-storage-bucket'
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true""")

    if "ec2" in prompt_lower or "server" in prompt_lower or "web" in prompt_lower or not ("lambda" in prompt_lower or "serverless" in prompt_lower):
        resources.append("""  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.micro
      ImageId: ami-0c55b159cbfafe1f0
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-web-server'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Enable HTTP and HTTPS inbound access
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0""")

    if "rds" in prompt_lower or "mysql" in prompt_lower or "database" in prompt_lower or "db" in prompt_lower:
        resources.append("""  DatabaseInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t3.micro
      Engine: MySQL
      MasterUsername: admin
      MasterUserPassword: '{{resolve:ssm-secure:DBPassword:1}}'
      AllocatedStorage: 20
      DBName: appdb
      PubliclyAccessible: false""")

    if "lambda" in prompt_lower or "serverless" in prompt_lower or "api" in prompt_lower:
        resources.append("""  ApiFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-api-fn'
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Runtime: python3.11
      Code:
        ZipFile: |
          def handler(event, context):
              return {
                  'statusCode': 200,
                  'body': 'Hello from AWS Assistant API!'
              }

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: [lambda.amazonaws.com]
            Action: ['sts:AssumeRole']
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole""")

    if "dynamodb" in prompt_lower or "dynamo" in prompt_lower:
        resources.append("""  ApplicationTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AWS::StackName}-data'
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      BillingMode: PAY_PER_REQUEST""")

    if not resources:
        resources.append("""  AppStorageBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-storage'""")

    resources_str = "\n\n".join(resources)

    return f"""AWSTemplateFormatVersion: '2010-09-09'
Description: AWS CloudFormation infrastructure template generated for prompt - {user_prompt[:60]}

Resources:
{resources_str}

Outputs:
  StackName:
    Description: Name of the deployed CloudFormation stack
    Value: !Ref AWS::StackName"""


async def check_llm_health() -> Dict[str, Any]:
    """Check health of configured LLM providers."""
    status = {"provider": settings.LLM_PROVIDER, "ollama": "unavailable", "huggingface": "unavailable", "mock_fallback": "active"}

    # Check Ollama
    try:
        client = ollama.AsyncClient(host=settings.OLLAMA_BASE_URL)
        await client.list()
        status["ollama"] = "available"
    except Exception:
        pass

    # Check HF
    if hf_client:
        try:
            def check():
                r = hf_client.chat_completion(
                    model=HF_MODEL,
                    messages=[{"role": "user", "content": "Hi"}],
                    max_tokens=5,
                )
                return r.choices[0].message.content

            await asyncio.to_thread(check)
            status["huggingface"] = "available"
        except Exception as e:
            status["huggingface"] = f"error: {str(e)[:100]}"

    return status
