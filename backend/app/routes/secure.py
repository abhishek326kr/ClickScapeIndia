import os
import hmac
import time
import hashlib
from urllib.parse import unquote
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse

router = APIRouter()

# Sign/verify helpers
SECRET = os.getenv("DOWNLOAD_SECRET", os.getenv("SECRET_KEY", "change-me"))
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")


def _verify(sig: str, path: str, exp: int) -> bool:
    try:
        if not sig or not path or not exp:
            return False
        if int(exp) < int(time.time()):
            return False
        msg = f"{path}|{exp}".encode()
        calc = hmac.new(SECRET.encode(), msg, hashlib.sha256).hexdigest()
        return hmac.compare_digest(calc, sig)
    except Exception:
        return False


@router.get("/secure/download")
def secure_download(
    path: str = Query(..., description="URL-style path like /uploads/filename.jpg"),
    exp: int = Query(..., description="Unix timestamp expiry"),
    sig: str = Query(..., description="HMAC signature"),
):
    # Verify signature
    if not _verify(sig, path, exp):
        raise HTTPException(status_code=403, detail="Invalid or expired link")

    # Map to filesystem under uploads only
    path = unquote(path)
    if not path.startswith("/uploads/"):
        raise HTTPException(status_code=400, detail="Invalid path")
    filename = path.split("/uploads/")[-1]
    fs_path = os.path.join(UPLOAD_DIR, filename)

    if not os.path.isfile(fs_path):
        raise HTTPException(status_code=404, detail="File not found")

    # Stream file with sensible headers
    return FileResponse(
        fs_path,
        media_type="application/octet-stream",
        filename=filename,
        headers={
            "Cache-Control": "private, max-age=0, no-store",
            "Content-Security-Policy": "default-src 'none'",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
        },
    )
