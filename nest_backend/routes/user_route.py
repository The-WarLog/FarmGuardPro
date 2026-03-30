from fastapi import APIRouter, Depends
from JWT.dependencies import get_current_user
from controller.addprofilesdeatils import details as profile_controller

router = APIRouter()
router.include_router(
    profile_controller, 
    prefix="/profile", 
    tags=["Profile"],
    dependencies=[Depends(get_current_user)]
)