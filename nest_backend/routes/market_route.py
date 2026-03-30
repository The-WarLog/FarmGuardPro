from fastapi import APIRouter

from controller.market_controller import market as market_controller_router

router = APIRouter()
router.include_router(market_controller_router, tags=["Market"])
