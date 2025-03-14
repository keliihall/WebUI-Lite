from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Message(BaseModel):
    role: str = "user"
    content: str
    model: Optional[str] = None
    created_at: Optional[str] = Field(default_factory=lambda: datetime.now().isoformat())

class Chat(BaseModel):
    title: str
    model: str

class ChatUpdate(BaseModel):
    title: str

class ExampleQuestion(BaseModel):
    content: str
    category: Optional[str] = None
    order_num: Optional[int] = None

class ExampleQuestionUpdate(BaseModel):
    content: Optional[str] = None
    category: Optional[str] = None
    order_num: Optional[int] = None

class Role(BaseModel):
    """AI Role/Persona Model"""
    id: Optional[str] = None
    name: str
    description: str
    system_prompt: str
    category: Optional[str] = None
    is_built_in: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "代码专家",
                "description": "专注于代码审查和最佳实践建议的AI助手",
                "system_prompt": "你是一位经验丰富的高级软件工程师...",
                "category": "开发",
                "is_built_in": False
            }
        }

class RoleUpdate(BaseModel):
    """Role Update Model"""
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    category: Optional[str] = None

class LoginRequest(BaseModel):
    """Login request model"""
    username: str
    password: str
    remember_me: bool = False

class TokenResponse(BaseModel):
    """Token response model"""
    token: str
