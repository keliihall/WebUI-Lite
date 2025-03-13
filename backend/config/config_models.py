from pydantic import BaseModel
from typing import List

class OllamaConfig(BaseModel):
    host: str = "http://localhost:11434"

class StorageConfig(BaseModel):
    chat_dir: str = "./storage/chats"
    database: str = "./storage/database.db"

class ServerConfig(BaseModel):
    host: str = "localhost"
    port: int = 8080
    cors_origins: List[str] = ["http://localhost:5173"]

class ModelsConfig(BaseModel):
    default: str = "deepseek-r1:1.5b"
    available: List[str] = ["deepseek-r1:1.5b", "qwen2.5:1.5b", "llama3.2:latest"]

class Config(BaseModel):
    ollama: OllamaConfig
    storage: StorageConfig
    server: ServerConfig
    models: ModelsConfig = ModelsConfig()
