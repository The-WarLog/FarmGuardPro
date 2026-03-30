from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from pydantic import BaseModel
from sqlmodel import Session, select

from JWT.dependencies import get_current_user
from JWT.jwt_handler import create_access_token
from JWT.security import hash_password, verify_password
from db.database import get_db
from model.user import User

auth = APIRouter()


class RegisterRequest(BaseModel):
	name: str
	email: str
	password: str
	is_admin: bool = False


class LoginRequest(BaseModel):
	email: str
	password: str


@auth.post("/register")
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
	existing_user = db.exec(select(User).where(User.email == payload.email.lower())).first()
	if existing_user:
		raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

	user = User(
		name=payload.name,
		email=payload.email.lower(),
		password=hash_password(payload.password),
		is_admin=payload.is_admin,
		updated_at=datetime.utcnow(),
	)
	db.add(user)
	db.commit()
	db.refresh(user)

	token = create_access_token(subject=user.email, extra_claims={"user_id": user.id, "is_admin": user.is_admin})

	return {
		"message": "User created successfully",
		"access_token": token,
		"token_type": "bearer",
		"user": {
			"id": user.id,
			"name": user.name,
			"email": user.email,
			"is_admin": user.is_admin,
		},
	}


@auth.post("/login")
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
	user = db.exec(select(User).where(User.email == payload.email.lower())).first()
	if user is None or not verify_password(payload.password, user.password):
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

	token = create_access_token(subject=user.email, extra_claims={"user_id": user.id, "is_admin": user.is_admin})
	return {
		"access_token": token,
		"token_type": "bearer",
	}


@auth.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
	return {
		"id": current_user.id,
		"name": current_user.name,
		"email": current_user.email,
		"is_admin": current_user.is_admin,
	}
