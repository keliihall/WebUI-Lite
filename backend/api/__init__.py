"""API routes module"""

from fastapi import APIRouter
from .chat import router as chat_router
from .models import router as models_router
from .example_questions import router as example_questions_router

router = APIRouter()

router.include_router(chat_router, tags=["chat"])
router.include_router(models_router, tags=["models"])
router.include_router(example_questions_router, tags=["example_questions"])
