import os
from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from ..schemas.auth import SignUpRequest, LoginRequest, AuthResponse
from time import time
import secrets
from ..models.user import User
from ..models.profile import Profile


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.secret_key = os.getenv("SECRET_KEY", "devsecretkey_change_me")
        self.jwt_algorithm = "HS256"
        self.jwt_expires_minutes = int(os.getenv("JWT_EXPIRES_MIN", "15"))
        self.refresh_expires_days = int(os.getenv("JWT_REFRESH_DAYS", "7"))

    def _hash_password(self, raw: str) -> str:
        return pwd_context.hash(raw)

    def _verify_password(self, raw: str, hashed: str) -> bool:
        return pwd_context.verify(raw, hashed)

    def _create_access_token(self, subject: str) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": subject,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=self.jwt_expires_minutes)).timestamp()),
            "type": "access",
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.jwt_algorithm)

    def _create_refresh_token(self, subject: str) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": subject,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(days=self.refresh_expires_days)).timestamp()),
            "type": "refresh",
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.jwt_algorithm)

    def create_token_pair(self, subject: str) -> tuple[str, str]:
        return self._create_access_token(subject), self._create_refresh_token(subject)

    def signup(self, payload: SignUpRequest) -> AuthResponse:
        existing = self.db.query(User).filter(User.email == payload.email).first()
        if existing:
            # Signal to route to return 409 Conflict
            raise ValueError("User already exists")

        user = User(
            email=payload.email,
            password_hash=self._hash_password(payload.password),
            role=payload.role,
            plan=getattr(payload, "plan", "free"),
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        # Create initial profile
        prof = Profile(user_id=user.id)
        if payload.name:
            prof.name = payload.name
        if payload.phone:
            prof.phone = payload.phone
        self.db.add(prof)
        self.db.commit()
        token = self._create_access_token(subject=user.email)
        return AuthResponse(access_token=token)

    def login(self, payload: LoginRequest) -> AuthResponse:
        user = self.db.query(User).filter(User.email == payload.email).first()
        if not user or not self._verify_password(payload.password, user.password_hash):
            # In production, avoid leaking which field is incorrect
            raise ValueError("Invalid credentials")
        token = self._create_access_token(subject=user.email)
        return AuthResponse(access_token=token)

    # Password reset flow
    def create_reset_token(self, email: str) -> str:
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            # Hide existence; pretend success but do nothing
            return ""
        token = secrets.token_urlsafe(32)
        ttl_minutes = int(os.getenv("RESET_TOKEN_TTL_MIN", "30"))
        user.reset_token = token
        user.reset_expires = int(time()) + ttl_minutes * 60
        self.db.add(user)
        self.db.commit()
        return token

    def reset_password(self, token: str, new_password: str) -> None:
        now = int(time())
        user = self.db.query(User).filter(User.reset_token == token).first()
        if not user or not user.reset_token or user.reset_expires <= 0 or user.reset_expires < now:
            raise ValueError("Invalid or expired token")
        user.password_hash = self._hash_password(new_password)
        # Invalidate token
        user.reset_token = ""
        user.reset_expires = 0
        self.db.add(user)
        self.db.commit()
