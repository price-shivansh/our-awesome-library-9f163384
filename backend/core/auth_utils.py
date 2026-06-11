"""
core/auth_utils.py — JWT + bcrypt authentication utilities.

Provides:
  - Password hashing and verification (bcrypt via passlib)
  - JWT token creation and decoding (python-jose)
  - FastAPI dependency for protected endpoints: get_current_user()
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from config import settings

# ── Password hashing context (bcrypt) ─────────────────────────────────────────
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── OAuth2 token scheme (reads Bearer token from Authorization header) ─────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── Password helpers ───────────────────────────────────────────────────────────

def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return _pwd_context.verify(plain_password, hashed_password)


# ── JWT helpers ────────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: Payload dict (should include "sub" with the user's email or id).
        expires_delta: Custom expiry; defaults to JWT_EXPIRE_DAYS from settings.

    Returns:
        Encoded JWT string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta
        else timedelta(days=settings.JWT_EXPIRE_DAYS)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT token.

    Raises:
        HTTPException 401 if the token is invalid or expired.

    Returns:
        The decoded payload dict.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise credentials_exception


# ── FastAPI dependency ─────────────────────────────────────────────────────────

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    FastAPI dependency that extracts and validates the JWT from the
    Authorization header, then returns the payload dict.

    Usage in a router:
        @router.get("/protected")
        def protected(current_user: dict = Depends(get_current_user)):
            ...
    """
    return decode_access_token(token)
