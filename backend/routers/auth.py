"""
routers/auth.py — Authentication API endpoints.

Routes (all prefixed with /api/auth in main.py):
  POST /api/auth/signup  — register a new user
  POST /api/auth/login   — authenticate, returns JWT
  GET  /api/auth/me      — return current user info (protected)
"""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session

from database.db import SessionLocal
from database.models import User
from core.auth_utils import hash_password, verify_password, create_access_token, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(tags=["auth"])


# ── DB dependency ──────────────────────────────────────────────────────────────

def get_db():
    with SessionLocal() as db:
        yield db


# ── Request / Response schemas ────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: str
    last_login: str | None
    subscription_plan: str
    subscription_status: str
    telegram_access: bool
    telegram_chat_id: str | None


# ── Helpers ────────────────────────────────────────────────────────────────────

def _user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "subscription_plan": user.subscription_plan,
        "subscription_status": user.subscription_status,
        "telegram_access": user.telegram_access,
        "telegram_chat_id": user.telegram_chat_id,
    }


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest, db: Session = Depends(get_db)):
    """
    Register a new user account.
    Returns a JWT access token immediately so the user is logged in after signup.
    """
    # Check if email already exists
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Create user
    user = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        last_login=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    logger.info(f"[Auth] New user registered: {user.email} (id={user.id})")

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _user_to_dict(user),
    }


@router.post("/login")
async def login(body: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate with email and password.
    Returns a JWT access token on success.
    """
    user = db.query(User).filter(User.email == body.email).first()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Update last_login timestamp
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    logger.info(f"[Auth] User logged in: {user.email} (id={user.id})")

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": _user_to_dict(user),
    }


@router.get("/me")
async def get_me(
    current_payload: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return the currently authenticated user's info.
    Requires: Authorization: Bearer <token>
    """
    user_id = int(current_payload.get("sub", 0))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _user_to_dict(user)
