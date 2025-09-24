from fastapi import APIRouter, Depends, HTTPException, Query, Response, Request
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict
import os
import jwt
from ..database import get_db
from ..schemas.auth import SignUpRequest, LoginRequest, AuthResponse, ChangePasswordRequest, MeResponse, ForgotPasswordRequest, ResetPasswordRequest
from ..services.auth_service import AuthService
from ..models.user import User

router = APIRouter()
security = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
    token_q: str | None = Query(default=None, alias="token"),
) -> User:
    # Accept Bearer token from Authorization header primarily,
    # support a 'token' query param (debug), or cookie 'access_token' as fallback
    token = None
    if credentials is not None and credentials.scheme and credentials.scheme.lower() == "bearer":
        token = credentials.credentials
    elif token_q:
        token = token_q
    # Cookie fallback
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    secret_key = os.getenv("SECRET_KEY", "devsecretkey_change_me")
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignUpRequest, response: Response, db: Session = Depends(get_db)):
    service = AuthService(db)
    try:
        res = service.signup(payload)
        # Also set cookies for cookie-based sessions
        access, refresh = service.create_token_pair(subject=payload.email)
        _set_auth_cookies(response, access, refresh)
        return res
    except ValueError as e:
        # User already exists
        raise HTTPException(status_code=409, detail=str(e))

@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    service = AuthService(db)
    try:
        res = service.login(payload)
        # Also set cookies for cookie-based sessions
        access, refresh = service.create_token_pair(subject=payload.email)
        _set_auth_cookies(response, access, refresh)
        return res
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid credentials")


@router.get("/me", response_model=MeResponse)
def me(user: User = Depends(get_current_user)) -> Dict[str, str]:
    return {"email": user.email, "role": user.role, "plan": getattr(user, "plan", "free")}


@router.post("/refresh", response_model=AuthResponse)
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Try to read refresh token from Authorization header (Bearer) or from cookie 'refresh_token'
    token = None
    if credentials is not None and credentials.scheme and credentials.scheme.lower() == "bearer":
        token = credentials.credentials
    # Cookie fallback
    if not token:
        token = request.cookies.get("refresh_token")
    secret_key = os.getenv("SECRET_KEY", "devsecretkey_change_me")
    if not token:
        # No token, cannot refresh
        raise HTTPException(status_code=401, detail="Missing refresh token")
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=400, detail="Not a refresh token")
        subject = payload.get("sub")
        service = AuthService(db)
        access = service._create_access_token(subject)
        refresh = service._create_refresh_token(subject)
        _set_auth_cookies(response, access, refresh)
        return AuthResponse(access_token=access)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.post("/logout")
def logout(response: Response):
    # Clear cookies with matching attributes
    _delete_auth_cookies(response)
    return {"status": "logged_out"}


@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    service = AuthService(db)
    # Verify current password
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not service._verify_password(payload.current_password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password incorrect")
    db_user.password_hash = service._hash_password(payload.new_password)
    db.commit()
    return {"status": "password_changed"}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    token = service.create_reset_token(payload.email)
    # In production, you would send email with the token link.
    # For development, optionally return the token to make testing easy.
    if os.getenv("ENV", "development").lower() in {"dev", "development", "local"} and token:
        return {"status": "ok", "token": token, "message": "Use this token to reset your password (dev only)"}
    return {"status": "ok", "message": "If this email exists, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    try:
        service.reset_password(payload.token, payload.new_password)
        return {"status": "password_reset"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


def _set_auth_cookies(response: Response, access: str, refresh: str):
    # HttpOnly cookies for security.
    # For production HTTPS and cross-site (frontend on app.* calling api.*), use SameSite=None and Secure.
    # You can override cookie domain via env COOKIE_DOMAIN (e.g. .clickscapeindia.com)
    env = os.getenv("ENV", "production").lower()
    cookie_domain = os.getenv("COOKIE_DOMAIN", None)
    # In development/local, default to insecure cookies so localhost over http works
    is_dev = env in {"dev", "development", "local"}
    default_secure = "false" if is_dev else "true"
    is_https = os.getenv("COOKIE_SECURE", default_secure).lower() in {"1", "true", "yes"}
    # Default to None for dev, "none" for production (and when secure cookies are used)
    samesite = os.getenv("COOKIE_SAMESITE", "none" if is_https else "lax").lower()
    if samesite not in {"lax", "strict", "none"}:
        samesite = "none" if is_https else "lax"

    response.set_cookie(
        key="access_token",
        value=access,
        httponly=True,
        samesite=samesite,  # use "none" for cross-site
        secure=is_https,    # must be True when samesite="none"
        path="/",
        domain=cookie_domain if cookie_domain else None,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh,
        httponly=True,
        samesite=samesite,
        secure=is_https,
        path="/",
        domain=cookie_domain if cookie_domain else None,
    )


@router.get("/debug-cookies")
def debug_cookies():
    # Dev-only diagnostics for cookie attrs to debug 401 issues
    env = os.getenv("ENV", "production").lower()
    if env not in {"dev", "development", "local"}:
        # Hide this in non-dev
        raise HTTPException(status_code=404, detail="Not found")
    cookie_domain = os.getenv("COOKIE_DOMAIN", None)
    default_secure = "false" if env in {"dev", "development", "local"} else "true"
    is_https = os.getenv("COOKIE_SECURE", default_secure).lower() in {"1", "true", "yes"}
    samesite = os.getenv("COOKIE_SAMESITE", "none" if is_https else "lax").lower()
    return {
        "env": env,
        "cookie_domain": cookie_domain,
        "secure": is_https,
        "samesite": samesite,
        "notes": "Match frontend and backend hosts (both 127.0.0.1 or both localhost). In dev, use COOKIE_SECURE=false."
    }

def _delete_auth_cookies(response: Response):
    env = os.getenv("ENV", "production").lower()
    cookie_domain = os.getenv("COOKIE_DOMAIN", None)
    is_dev = env in {"dev", "development", "local"}
    default_secure = "false" if is_dev else "true"
    is_https = os.getenv("COOKIE_SECURE", default_secure).lower() in {"1", "true", "yes"}
    samesite = os.getenv("COOKIE_SAMESITE", "none" if is_https else "lax").lower()
    if samesite not in {"lax", "strict", "none"}:
        samesite = "none" if is_https else "lax"
    response.delete_cookie(
        key="access_token",
        path="/",
        domain=cookie_domain if cookie_domain else None,
        samesite=samesite,
    )
    response.delete_cookie(
        key="refresh_token",
        path="/",
        domain=cookie_domain if cookie_domain else None,
        samesite=samesite,
    )
