from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json
import time

from app.database import get_db
from app.user_registration.user_models import User
from app.user_registration.auth_schemas import UserRegisterRequest, UserResponse, UserLoginRequest, LoginResponse
from app.user_registration.security import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

# Simple JWT-like token generation (for MVP)
def generate_token(user_id: str) -> str:
    """Generate a simple token for now. In production, use proper JWT."""
    payload = {
        "user_id": user_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + 86400 * 7  # 7 days
    }
    return json.dumps(payload)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    # Check for existing email
    existing_email = db.query(User).filter(User.email == payload.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Check for existing username
    existing_username = db.query(User).filter(User.username == payload.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This username is already taken.",
        )

    new_user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=hash_password(payload.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=LoginResponse)
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == payload.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Verify password
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Generate token
    token = generate_token(user.id)
    
    return {
        "user": user,
        "accessToken": token
    }