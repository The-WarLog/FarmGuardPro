from fastapi import APIRouter, Depends

from JWT.dependencies import get_current_user
from controller.analysis_controller import analysis as analysis_controller_router

router = APIRouter()
router.include_router(
    analysis_controller_router,
    prefix="/analysis",
    tags=["Analysis"],
    dependencies=[Depends(get_current_user)],
)
