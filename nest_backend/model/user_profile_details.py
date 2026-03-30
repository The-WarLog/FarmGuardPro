from datetime import datetime
from typing import ClassVar, Optional, TYPE_CHECKING

from sqlalchemy import Column, DateTime, String
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .user import User


class UserProfileDetails(SQLModel, table=True):
    __tablename__: ClassVar[str] = "user_profile_details"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True, index=True)

    full_name: str = Field(sa_column=Column(String(255), nullable=False))
    email: str = Field(sa_column=Column(String(255), unique=True, index=True, nullable=False))
    phone_number: str = Field(sa_column=Column(String(20), unique=True, index=True, nullable=False))
    address: str = Field(sa_column=Column(String(500), nullable=False))
    city: str = Field(sa_column=Column(String(100), nullable=False))
    state: str = Field(sa_column=Column(String(100), nullable=False))
    pin_code: Optional[int] = Field(default=None)
    country: str = Field(sa_column=Column(String(100), nullable=False))

    # One profile belongs to one user
    user_id: int = Field(foreign_key="users.id", unique=True, nullable=False)

    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(
        sa_column=Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    )

    user: "User" = Relationship(back_populates="profile")
