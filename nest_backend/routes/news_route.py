from fastapi import APIRouter

from controller.news_controller import news as news_controller_router

router = APIRouter()
router.include_router(news_controller_router, tags=["News"])
