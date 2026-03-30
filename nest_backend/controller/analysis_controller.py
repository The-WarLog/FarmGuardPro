import json
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from JWT.dependencies import get_current_user
from db.database import get_db
from model.analysis_record import AnalysisRecord
from model.user import User

analysis = APIRouter()


class AnalysisCreate(BaseModel):
    crop_name: Optional[str] = None
    disease: str
    confidence: int
    severity: str
    recommendations: str
    result_source: str = "backend"
    is_disease_detected: bool = True
    top_predictions: Optional[list[dict[str, Any]]] = None
    image_name: Optional[str] = None


@analysis.post("", status_code=status.HTTP_201_CREATED)
def create_analysis(
    payload: AnalysisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user context")

    top_predictions_json = None
    if payload.top_predictions is not None:
        top_predictions_json = json.dumps(payload.top_predictions)

    record = AnalysisRecord(
        user_id=current_user.id,
        crop_name=payload.crop_name,
        disease=payload.disease,
        confidence=max(0, min(100, int(payload.confidence))),
        severity=payload.severity,
        recommendations=payload.recommendations,
        result_source=payload.result_source,
        is_disease_detected=payload.is_disease_detected,
        top_predictions_json=top_predictions_json,
        image_name=payload.image_name,
        created_at=datetime.utcnow(),
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return {"id": record.id, "message": "Analysis saved"}


@analysis.get("")
def list_my_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = db.exec(
        select(AnalysisRecord).where(AnalysisRecord.user_id == current_user.id)
    ).all()
    records = sorted(records, key=lambda item: item.created_at, reverse=True)

    result = []
    for row in records:
        predictions = []
        if row.top_predictions_json:
            try:
                parsed = json.loads(row.top_predictions_json)
                if isinstance(parsed, list):
                    predictions = parsed
            except json.JSONDecodeError:
                predictions = []

        result.append(
            {
                "id": row.id,
                "crop_name": row.crop_name,
                "disease": row.disease,
                "confidence": row.confidence,
                "severity": row.severity,
                "recommendations": row.recommendations,
                "result_source": row.result_source,
                "is_disease_detected": row.is_disease_detected,
                "top_predictions": predictions,
                "image_name": row.image_name,
                "created_at": row.created_at,
            }
        )

    return {"items": result}


@analysis.get("/{analysis_id}")
def get_my_analysis_by_id(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = db.exec(
        select(AnalysisRecord).where(
            AnalysisRecord.id == analysis_id,
            AnalysisRecord.user_id == current_user.id,
        )
    ).first()

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

    predictions = []
    if row.top_predictions_json:
        try:
            parsed = json.loads(row.top_predictions_json)
            if isinstance(parsed, list):
                predictions = parsed
        except json.JSONDecodeError:
            predictions = []

    return {
        "id": row.id,
        "crop_name": row.crop_name,
        "disease": row.disease,
        "confidence": row.confidence,
        "severity": row.severity,
        "recommendations": row.recommendations,
        "result_source": row.result_source,
        "is_disease_detected": row.is_disease_detected,
        "top_predictions": predictions,
        "image_name": row.image_name,
        "created_at": row.created_at,
    }
