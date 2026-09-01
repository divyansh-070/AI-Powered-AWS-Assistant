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
    Generate text using the configured LLM provider.
    Tries the configured provider first, falls back to the other.
    """
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
            logger.warning(f"Ollama generation failed: {e}. Falling back to HuggingFace.")
            if hf_client:
                return await _generate_with_hf(system_prompt, user_prompt)
            raise e
    elif settings.LLM_PROVIDER == "huggingface":
        if not hf_client:
            raise ValueError("HuggingFace API token not configured")
        return await _generate_with_hf(system_prompt, user_prompt)
    else:
        raise ValueError(f"Unsupported LLM provider: {settings.LLM_PROVIDER}")


async def _generate_with_hf(system_prompt: str, user_prompt: str) -> str:
    """Generate text using HuggingFace Inference API (auto-routed to best free provider)."""
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


async def check_llm_health() -> Dict[str, Any]:
    """Check health of configured LLM providers."""
    status = {"provider": settings.LLM_PROVIDER, "ollama": "unavailable", "huggingface": "unavailable"}

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
