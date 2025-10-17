from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Application
    app_name: str = "Literary Agent System"
    app_version: str = "1.0.0"
    debug: bool = True
    environment: str = "development"

    # Anthropic API
    anthropic_api_key: str

    # Database
    database_url: str
    database_url_sync: str

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS
    backend_cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000"
    ]

    # Agent Configuration
    max_agent_iterations: int = 10
    agent_timeout_seconds: int = 1800  # 30 minutes
    min_critic_score: float = 8.0

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
