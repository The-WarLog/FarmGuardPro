from fastapi import APIRouter

from controller.add_user import auth as auth_controller_router

router = APIRouter()
router.include_router(auth_controller_router, prefix="/auth", tags=["Auth"])
