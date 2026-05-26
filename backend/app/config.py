from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "泳池运营-水质巡检与整改回查"
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    api_v1_prefix: str = "/api/v1"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
