from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from ..config import config_manager

security = HTTPBearer()

def create_token(data: dict) -> str:
    """Create a new JWT token"""
    config = config_manager.config
    expire = datetime.utcnow() + timedelta(days=config.server.token_expire_days)
    data.update({"exp": expire})
    return jwt.encode(data, config.server.secret_key, algorithm="HS256")

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """Verify JWT token"""
    try:
        config = config_manager.config
        payload = jwt.decode(credentials.credentials, config.server.secret_key, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def verify_password(username: str, password: str) -> bool:
    """Verify username and password against config"""
    config = config_manager.config
    stored_password = config.auth.users.get(username)
    return stored_password is not None and stored_password == password 