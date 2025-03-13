from fastapi import APIRouter
from ..core import ollama as ollama_service

router = APIRouter()

@router.get("/models")
async def get_models():
    """Get available Ollama models"""
    return await ollama_service.get_models()
