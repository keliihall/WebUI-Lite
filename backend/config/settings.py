import yaml
from typing import Dict, Any, Optional
from pathlib import Path
from .config_models import Config

class ConfigManager:
    _instance: Optional['ConfigManager'] = None
    _config: Optional[Config] = None
    _last_load_time: float = 0
    
    def __init__(self):
        raise RuntimeError('Call get_instance() instead')
    
    @classmethod
    def get_instance(cls) -> 'ConfigManager':
        if cls._instance is None:
            cls._instance = cls.__new__(cls)
            cls._instance._config = None
            cls._instance._last_load_time = 0
        return cls._instance
    
    def _should_reload(self) -> bool:
        """Check if config file has been modified since last load"""
        if not CONFIG_FILE.exists():
            return False
        
        current_mtime = CONFIG_FILE.stat().st_mtime
        should_reload = current_mtime > self._last_load_time
        
        if should_reload:
            print(f"Config file modified, reloading... (last load: {self._last_load_time}, current: {current_mtime})")
        
        return should_reload
    
    @property
    def config(self) -> Config:
        """Get current configuration, reloading if file has been modified"""
        if self._config is None or self._should_reload():
            print("[CONFIG_SOURCE] Loading config...")
            self._config = Config(**load_config())
            if CONFIG_FILE.exists():
                self._last_load_time = CONFIG_FILE.stat().st_mtime
        return self._config
    
    def reload_config(self) -> Config:
        """Force reload configuration from file"""
        print("[CONFIG_SOURCE] Reloading config...")
        self._config = Config(**load_config())
        if CONFIG_FILE.exists():
            self._last_load_time = CONFIG_FILE.stat().st_mtime
        return self._config
    
    def update_config(self, new_config: Dict[str, Any]) -> Config:
        """Update and save configuration"""
        try:
            print("[CONFIG_SOURCE] Updating config...")
            # Save configuration to file
            save_config(new_config)
            
            # Force reload configuration
            return self.reload_config()
        except Exception as e:
            print(f"Failed to update config: {e}")
            raise

# Default configuration
DEFAULT_CONFIG = {
    "ollama": {
        "host": "http://localhost:11434 [FROM_DEFAULT]"
    },
    "storage": {
        "chat_dir": "./storage/chats",
        "database": "./storage/database.db"
    },
    "server": {
        "host": "localhost [FROM_DEFAULT]",
        "port": 8080,
        "cors_origins": ["http://localhost:5173 [FROM_DEFAULT]"]
    }
}

# Get the absolute path to the config directory (same directory as this file)
CONFIG_DIR = Path(__file__).parent
CONFIG_FILE = CONFIG_DIR / "config.yaml"

def deep_merge(dict1: Dict, dict2: Dict) -> Dict:
    """Deep merge two dictionaries"""
    result = dict1.copy()
    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result

def load_config() -> Dict[str, Any]:
    """Load configuration from file or use defaults"""
    try:
        if CONFIG_FILE.exists():
            print(f"[CONFIG_SOURCE] Loading config from {CONFIG_FILE}")
            with open(CONFIG_FILE, "r", encoding='utf-8') as f:
                user_config = yaml.safe_load(f)
                if user_config is None:
                    print("[CONFIG_SOURCE] Empty config file, using defaults")
                    user_config = {}
                # Use deep merge to properly handle nested configurations
                final_config = deep_merge(DEFAULT_CONFIG, user_config)
                print(f"[CONFIG_SOURCE] Loaded config: {final_config}")
                return final_config
        print("[CONFIG_SOURCE] Config file not found, using defaults")
        return DEFAULT_CONFIG.copy()
    except Exception as e:
        print(f"[CONFIG_SOURCE] Failed to load config, using defaults: {e}")
        return DEFAULT_CONFIG.copy()

def save_config(new_config: Dict[str, Any]) -> None:
    """Save configuration to file"""
    try:
        # Ensure config directory exists
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        
        print("[CONFIG_SOURCE] Current new_config:", new_config)
        
        # Load existing config from file directly
        current_config = {}
        if CONFIG_FILE.exists():
            print(f"[CONFIG_SOURCE] Loading existing config from {CONFIG_FILE}")
            with open(CONFIG_FILE, "r", encoding='utf-8') as f:
                file_config = yaml.safe_load(f)
                if file_config is not None:
                    current_config = file_config
                    print("[CONFIG_SOURCE] Existing config:", current_config)
        
        # Merge new config with current config
        updated_config = deep_merge(current_config, new_config)
        print("[CONFIG_SOURCE] Merged config:", updated_config)
        
        # Save to file with proper encoding
        with open(CONFIG_FILE, "w", encoding='utf-8') as f:
            yaml.dump(updated_config, f, default_flow_style=False, allow_unicode=True)
            
        print(f"[CONFIG_SOURCE] Configuration saved to {CONFIG_FILE}: {updated_config}")
    except Exception as e:
        print(f"[CONFIG_SOURCE] Failed to save config: {e}")
        raise

# Initialize the config manager singleton
config_manager = ConfigManager.get_instance()

# Initialize the config property for backward compatibility
print("[CONFIG_SOURCE] Initializing module-level config")
config = config_manager.config

# Export both config and config_manager
__all__ = ['config', 'config_manager']
