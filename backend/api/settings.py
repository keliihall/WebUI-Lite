from fastapi import APIRouter, HTTPException
from ..config import config, config_manager
from ..config.config_models import Config, OllamaConfig, StorageConfig, ServerConfig, ModelsConfig
from pydantic import BaseModel

router = APIRouter()

class OllamaSettings(BaseModel):
    host: str

@router.get("/settings")
async def get_settings() -> Config:
    """Get current settings"""
    return config_manager.config

@router.post("/settings")
async def update_settings(new_config: Config):
    """Update settings"""
    try:
        return config_manager.update_config(new_config.dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/settings/ollama")
async def get_ollama_settings():
    """Get Ollama settings"""
    return {"host": config_manager.config.ollama.host}

@router.post("/settings/ollama")
async def update_ollama_settings(settings: OllamaSettings):
    """Update Ollama settings"""
    try:
        # Update configuration using config manager
        config_manager.update_config({"ollama": {"host": settings.host}})
        return {"status": "success", "host": config_manager.config.ollama.host}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
