from fastapi import APIRouter

from controller.stats_controller import stats

router = APIRouter()
router.include_router(
    stats,
    prefix="",
    tags=["Stats"],
)
