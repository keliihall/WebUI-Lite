import yaml
from typing import Dict, Any
from .config_models import Config

# Default configuration
DEFAULT_CONFIG = {
    "ollama": {
        "host": "http://localhost:11434"
    },
    "storage": {
        "chat_dir": "./storage/chats",
        "database": "./storage/database.db"
    },
    "server": {
        "host": "localhost",
        "port": 8080,
        "cors_origins": ["http://localhost:5173"]
    }
}

def load_config() -> Dict[str, Any]:
    """Load configuration from file or use defaults"""
    try:
        with open("config.yaml", "r") as f:
            user_config = yaml.safe_load(f)
            if user_config is None:
                user_config = {}
        return {**DEFAULT_CONFIG, **user_config}
    except Exception as e:
        print(f"Failed to load config, using defaults: {e}")
        return DEFAULT_CONFIG

# Load configuration on module import
config = Config(**load_config())
