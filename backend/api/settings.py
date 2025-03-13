from fastapi import APIRouter, HTTPException
from ..config import config
from ..config.config_models import Config

router = APIRouter()

@router.get("/settings")
async def get_settings() -> Config:
    """Get current settings"""
    return config

@router.post("/settings")
async def update_settings(new_config: Config):
    """Update settings"""
    try:
        config.update(new_config)
        return config
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
