from pydantic import BaseModel
from typing import List, Dict

class OllamaConfig(BaseModel):
    host: str = "http://localhost:11434"

class StorageConfig(BaseModel):
    chat_dir: str = "./storage/chats"
    database: str = "./storage/database.db"

class ServerConfig(BaseModel):
    host: str = "localhost"
    port: int = 8080
    cors_origins: List[str] = ["http://localhost:5173"]
    secret_key: str = "your-secret-key-please-change-in-production"
    token_expire_days: int = 30

class ModelsConfig(BaseModel):
    default: str = "deepseek-r1:1.5b"
    available: List[str] = []

class AuthConfig(BaseModel):
    users: Dict[str, str] = {
        "admin": "admin123"
    }

class Config(BaseModel):
    ollama: OllamaConfig = OllamaConfig()
    storage: StorageConfig
    server: ServerConfig
    models: ModelsConfig = ModelsConfig()
    auth: AuthConfig = AuthConfig()
