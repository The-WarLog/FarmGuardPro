from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select, func

from JWT.dependencies import get_current_user
from db.database import get_db
from model.analysis_record import AnalysisRecord
from model.user import User

stats = APIRouter()


class UserAnalyticsSummary(BaseModel):
    user_id: int
    user_name: str
    user_email: str
    total_scans: int
    healthy_plants: int
    diseased_plants: int


class PersonalAnalytics(BaseModel):
    total_scans: int
    healthy_plants: int
    diseased_plants: int


@stats.get("/stats/user-analytics")
def get_user_analytics_summary(db: Session = Depends(get_db)):
    """Get analytics summary for all users: total scans, healthy plants, diseased plants (PUBLIC)"""
    users = db.exec(select(User)).all()

    result = []
    for user in users:
        if user.id is None:
            continue
            
        total_scans = db.exec(
            select(func.count(AnalysisRecord.id)).where(AnalysisRecord.user_id == user.id)
        ).first() or 0

        healthy_plants = db.exec(
            select(func.count(AnalysisRecord.id)).where(
                AnalysisRecord.user_id == user.id,
                AnalysisRecord.is_disease_detected == False,
            )
        ).first() or 0

        diseased_plants = db.exec(
            select(func.count(AnalysisRecord.id)).where(
                AnalysisRecord.user_id == user.id,
                AnalysisRecord.is_disease_detected == True,
            )
        ).first() or 0

        result.append(
            UserAnalyticsSummary(
                user_id=user.id,
                user_name=user.name,
                user_email=user.email,
                total_scans=int(total_scans),
                healthy_plants=int(healthy_plants),
                diseased_plants=int(diseased_plants),
            )
        )

    return {"items": result}


@stats.get("/stats/my-analytics")
def get_my_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get personal analytics summary for the current authenticated user"""
    if current_user.id is None:
        return {
            "total_scans": 0,
            "healthy_plants": 0,
            "diseased_plants": 0,
        }

    total_scans = db.exec(
        select(func.count(AnalysisRecord.id)).where(AnalysisRecord.user_id == current_user.id)
    ).first() or 0

    healthy_plants = db.exec(
        select(func.count(AnalysisRecord.id)).where(
            AnalysisRecord.user_id == current_user.id,
            AnalysisRecord.is_disease_detected == False,
        )
    ).first() or 0

    diseased_plants = db.exec(
        select(func.count(AnalysisRecord.id)).where(
            AnalysisRecord.user_id == current_user.id,
            AnalysisRecord.is_disease_detected == True,
        )
    ).first() or 0

    return PersonalAnalytics(
        total_scans=int(total_scans),
        healthy_plants=int(healthy_plants),
        diseased_plants=int(diseased_plants),
    )
