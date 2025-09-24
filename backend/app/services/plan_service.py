import os
from typing import Set, Tuple

FREE_MAX_BYTES = int(os.getenv("FREE_MAX_UPLOAD_MB", "3")) * 1024 * 1024
PREMIUM_MAX_BYTES = int(os.getenv("PREMIUM_MAX_UPLOAD_MB", "25")) * 1024 * 1024
PREMIUM_STORAGE_QUOTA_MB = int(os.getenv("PREMIUM_STORAGE_QUOTA_MB", "10240"))  # 10 GB default

FREE_ALLOWED_EXTS: Set[str] = {".jpg", ".jpeg", ".png"}
PREMIUM_ALLOWED_EXTS: Set[str] = FREE_ALLOWED_EXTS | {".tif", ".tiff", ".raw", ".psd"}

# Upload counts per request
FREE_UPLOAD_LIMIT = 1
PREMIUM_UPLOAD_LIMIT = 10


def normalize_ext(filename: str) -> str:
    import os
    return os.path.splitext(filename or "")[1].lower()


def get_plan(user) -> str:
    # user.plan is expected to be 'free' or 'premium'
    plan = getattr(user, "plan", None)
    return plan if plan in {"free", "premium"} else "free"


def get_upload_rules(plan: str) -> Tuple[Set[str], int, int]:
    if plan == "premium":
        return PREMIUM_ALLOWED_EXTS, PREMIUM_MAX_BYTES, PREMIUM_UPLOAD_LIMIT
    return FREE_ALLOWED_EXTS, FREE_MAX_BYTES, FREE_UPLOAD_LIMIT


def get_storage_quota_bytes(plan: str) -> int:
    if plan == "premium":
        return PREMIUM_STORAGE_QUOTA_MB * 1024 * 1024
    # Free: No persistent storage per spec
    return 0
