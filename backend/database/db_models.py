from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Message(BaseModel):
    role: str = "user"
    content: str
    model: Optional[str] = None
    created_at: Optional[datetime] = None

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
