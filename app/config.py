import os
from dotenv import load_dotenv
from typing import Optional

# Load environment variables from .env file
load_dotenv()


class Settings:
    def __init__(self):
        # Required environment variables
        self.mongo_uri = self._get_required_env("MONGO_URI")
        self.jwt_secret = self._get_required_env("JWT_SECRET")
        
        # Optional environment variables with defaults
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.jwt_expire_minutes = self._get_int_env("JWT_EXPIRE_MINUTES", 1440)  # 24 hours default
    
    def _get_required_env(self, var_name: str) -> str:
        """Get required environment variable or raise error if missing"""
        value = os.getenv(var_name)
        if not value:
            raise ValueError(f"{var_name} environment variable is required and cannot be empty")
        return value
    
    def _get_int_env(self, var_name: str, default: int) -> int:
        """Get integer environment variable with default value"""
        value = os.getenv(var_name)
        if value is None:
            return default
        
        try:
            int_value = int(value)
            if int_value <= 0:
                raise ValueError(f"{var_name} must be a positive integer")
            return int_value
        except ValueError:
            raise ValueError(f"{var_name} must be a valid positive integer, got: {value}")


# Initialize settings with error handling
try:
    settings = Settings()
except ValueError as e:
    print(f"Configuration Error: {e}")
    raise SystemExit(1)