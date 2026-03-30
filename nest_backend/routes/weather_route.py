from fastapi import APIRouter

from controller.weatherinfo import weather as weather_controller_router

# Aggregate weather endpoints under one router for app-level inclusion.
router = APIRouter()
router.include_router(weather_controller_router, tags=["Weather"])

