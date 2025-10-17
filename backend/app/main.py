from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from sqlalchemy import text

from .routes import auth, photos, votes, leaderboard, users, competitions, marketplace
from .routes import secure as secure_routes
from .routes import payment as payment_routes
from .routes import ai as ai_routes
from .routes import dashboard
from .database import Base, engine
from . import models  # noqa: F401 ensures models are imported for table creation

app = FastAPI(title="ClickScape API", version="0.1.0")

# CORS settings
# IMPORTANT: When using cookies (allow_credentials=True), you must NOT use "*".
# Specify exact dev origins here and include production by default.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://app.clickscapeindia.com",
    "http://app.clickscapeindia.com",
]

# Allow overriding origins via env var FRONTEND_ORIGINS (comma-separated)
_env_origins = os.getenv("FRONTEND_ORIGINS")
if _env_origins:
    origins = [o.strip() for o in _env_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Static uploads directory (development)
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/")
def read_root():
    return {"message": "Welcome to ClickScape API"}


# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(photos.router, prefix="/photos", tags=["photos"])
app.include_router(votes.router, tags=["votes"])  # contains /vote/{photo_id}
app.include_router(leaderboard.router, tags=["leaderboard"])  # contains /leaderboard
app.include_router(users.router, prefix="/users", tags=["users"])  # placeholder
app.include_router(competitions.router, prefix="/competitions", tags=["competitions"])  # placeholder
app.include_router(marketplace.router, prefix="/marketplace", tags=["marketplace"])  # placeholder
app.include_router(dashboard.router, tags=["dashboard"])  # contains /dashboard/summary
app.include_router(secure_routes.router, tags=["secure"])  # /secure/download
app.include_router(ai_routes.router, prefix="/ai", tags=["ai"])  # premium-only features
app.include_router(payment_routes.router, prefix="/payment", tags=["payment"])  # payments

# Create tables in development (use Alembic for migrations in production)
Base.metadata.create_all(bind=engine)

# Lightweight SQLite migrations for dev only
def _ensure_sqlite_column(table: str, column: str, ddl: str):
    try:
        with engine.connect() as conn:
            res = conn.execute(text(f"PRAGMA table_info({table});")).mappings().all()
            existing = {row['name'] for row in res}
            if column not in existing:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {ddl};"))
                conn.commit()
    except Exception:
        # best-effort; ignore in dev
        pass

# Add 'phone' to profiles if missing
_ensure_sqlite_column("profiles", "phone", "phone VARCHAR(255) DEFAULT ''")

# Add 'user_id' to photos if missing
_ensure_sqlite_column("photos", "user_id", "user_id INTEGER")

# Add 'user_id' to votes if missing
_ensure_sqlite_column("votes", "user_id", "user_id INTEGER")

# Add 'avatar_url' to profiles if missing
_ensure_sqlite_column("profiles", "avatar_url", "avatar_url VARCHAR(512) DEFAULT ''")

# Add new plan/quota columns to users in dev
_ensure_sqlite_column("users", "plan", "plan VARCHAR(32) DEFAULT 'free'")
_ensure_sqlite_column("users", "storage_used", "storage_used INTEGER DEFAULT 0")
_ensure_sqlite_column("users", "reset_token", "reset_token VARCHAR(256) DEFAULT ''")
_ensure_sqlite_column("users", "reset_expires", "reset_expires INTEGER DEFAULT 0")
_ensure_sqlite_column("users", "token_version", "token_version INTEGER DEFAULT 0")

# Add new photo storage/export columns in dev
_ensure_sqlite_column("photos", "processed_url", "processed_url VARCHAR(1024)")
_ensure_sqlite_column("photos", "original_url", "original_url VARCHAR(1024)")
_ensure_sqlite_column("photos", "bytes_size", "bytes_size INTEGER DEFAULT 0")
_ensure_sqlite_column("photos", "royalty_percent", "royalty_percent FLOAT DEFAULT 0.15")
_ensure_sqlite_column("photos", "for_sale", "for_sale BOOLEAN DEFAULT 0")
_ensure_sqlite_column("photos", "is_public", "is_public BOOLEAN DEFAULT 1")
_ensure_sqlite_column("photos", "competition_entry", "competition_entry BOOLEAN DEFAULT 0")

# New dev columns for roles and payments
_ensure_sqlite_column("users", "role", "role VARCHAR(32) DEFAULT 'free'")
_ensure_sqlite_column("users", "referral_code", "referral_code VARCHAR(64) DEFAULT ''")
_ensure_sqlite_column("users", "referred_by", "referred_by VARCHAR(64) DEFAULT ''")
_ensure_sqlite_column("payments", "photo_ids", "photo_ids TEXT DEFAULT ''")
_ensure_sqlite_column("payments", "status", "status VARCHAR(32) DEFAULT 'pending'")
_ensure_sqlite_column("payments", "txn_id", "txn_id VARCHAR(128)")
_ensure_sqlite_column("payments", "created_at", "created_at INTEGER DEFAULT 0")


# Basic security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    resp = await call_next(request)
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("X-Frame-Options", "DENY")
    # CSP is restrictive for API; limit to none by default for static download route already set in handler
    resp.headers.setdefault("Referrer-Policy", "no-referrer")
    return resp
