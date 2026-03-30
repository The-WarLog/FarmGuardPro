from datetime import datetime
from typing import ClassVar, Optional, TYPE_CHECKING

from sqlalchemy import Column, DateTime, String
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .user_profile_details import UserProfileDetails


class User(SQLModel, table=True):
    __tablename__: ClassVar[str] = "users"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    name: str = Field(sa_column=Column(String(255), nullable=False))
    email: str = Field(sa_column=Column(String(255), unique=True, index=True, nullable=False))
    password: str = Field(sa_column=Column(String(255), nullable=False))
    is_admin: bool = Field(default=False, nullable=False)

    # Equivalent of Mongoose timestamps: true
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(
        sa_column=Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    )

    # Equivalent of virtual one-to-one profile relation
    profile: Optional["UserProfileDetails"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"uselist": False}
    )
