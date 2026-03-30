from datetime import datetime
from typing import ClassVar, Optional

from sqlalchemy import Column, DateTime, String, Text
from sqlmodel import Field, SQLModel


class AnalysisRecord(SQLModel, table=True):
    __tablename__: ClassVar[str] = "analysis_records"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    user_id: int = Field(foreign_key="users.id", nullable=False, index=True)

    crop_name: Optional[str] = Field(default=None, sa_column=Column(String(120), nullable=True))
    disease: str = Field(sa_column=Column(String(255), nullable=False))
    confidence: int = Field(default=0, nullable=False)
    severity: str = Field(default="Low", sa_column=Column(String(30), nullable=False))
    recommendations: str = Field(default="", sa_column=Column(Text, nullable=False))
    result_source: str = Field(default="backend", sa_column=Column(String(30), nullable=False))
    is_disease_detected: bool = Field(default=True, nullable=False)

    # Stored as JSON string to keep schema simple while preserving prediction details.
    top_predictions_json: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
    image_name: Optional[str] = Field(default=None, sa_column=Column(String(255), nullable=True))

    created_at: datetime = Field(
        sa_column=Column(DateTime, nullable=False, default=datetime.utcnow)
    )
