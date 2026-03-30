from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from pydantic import BaseModel
from sqlmodel import Session, select
from sqlalchemy.exc import SQLAlchemyError
from JWT.dependencies import get_current_user
from db.database import get_db
from model.user import User
from model.user_profile_details import UserProfileDetails

details = APIRouter()


class UserProfileCreate(BaseModel):
    full_name: str
    phone_number: str
    address: str
    city: str
    state: str
    pin_code: int | None = None
    country: str


@details.get("/user-bio")
def fetch_user_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.exec(
        select(UserProfileDetails).where(UserProfileDetails.user_id == current_user.id)
    ).first()

    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    
    return {
        "user_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "profile": {
            "full_name": profile.full_name,
            "phone_number": profile.phone_number,
            "address": profile.address,
            "city": profile.city,
            "state": profile.state,
            "pin_code": profile.pin_code,
            "country": profile.country,
        },
    }

@details.post("/add-bio")
def add_user_bio(payload: UserProfileCreate,db:Session=Depends(get_db),current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user context",
        )

    try:
        existing_profile = db.exec(
            select(UserProfileDetails).where(UserProfileDetails.user_id == user_id)
        ).first()

        if existing_profile is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Profile already exists",
            )

        profile = UserProfileDetails(
            full_name=payload.full_name,
            email=current_user.email,
            phone_number=payload.phone_number,
            address=payload.address,
            city=payload.city,
            state=payload.state,
            pin_code=payload.pin_code,
            country=payload.country,
            user_id=user_id,
            updated_at=datetime.utcnow(),
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        return {
            "message": "Profile created successfully",
            "profile_id": profile.id,
        }

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while fetching"
        ) from e
  
    