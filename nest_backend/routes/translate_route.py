from fastapi import APIRouter

from controller.translate_controller import translate

router = APIRouter()
router.include_router(
    translate,
    prefix="",
    tags=["Translation"],
)
