from fastapi import APIRouter

from controller.chat_controller import chat as chat_controller_router

# Aggregate chat endpoints under one router for app-level inclusion.
router = APIRouter()
router.include_router(chat_controller_router, prefix="/chat", tags=["Chat"])
