from fastapi import APIRouter, HTTPException
from ..database.db_models import LoginRequest, TokenResponse
from ..utils.auth import create_token, verify_password

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Handle login request"""
    if verify_password(request.username, request.password):
        token = create_token({"sub": request.username})
        return {"token": token}
    raise HTTPException(status_code=401, detail="Invalid username or password") 