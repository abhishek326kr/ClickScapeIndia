import os
import io
import tempfile
from fastapi.testclient import TestClient
from app.main import app
from PIL import Image

client = TestClient(app)

def make_image_bytes(fmt="JPEG", size=(800, 600), color=(120, 180, 200)):
    buf = io.BytesIO()
    im = Image.new("RGB", size, color)
    im.save(buf, format=fmt)
    return buf.getvalue()

def signup(email: str, plan: str = "free"):
    r = client.post("/auth/signup", json={
        "email": email,
        "password": "password123",
        "role": "participant",
        "plan": plan,
    })
    assert r.status_code == 200
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_free_filetype_restrictions():
    headers = signup("free_user@example.com", plan="free")
    img = make_image_bytes(fmt="JPEG")
    files = {
        "title": (None, "Sample"),
        "category": (None, "test"),
        "tags": (None, "t1"),
        "price": (None, "0"),
        "image": ("test.jpg", img, "image/jpeg"),
    }
    r = client.post("/photos/upload", files=files, headers=headers)
    assert r.status_code == 200
    # Try TIFF (not allowed for free)
    tiff = make_image_bytes(fmt="TIFF")
    files["image"] = ("test.tiff", tiff, "image/tiff")
    r2 = client.post("/photos/upload", files=files, headers=headers)
    assert r2.status_code == 400
    assert "Unsupported file type" in r2.text

def test_premium_allows_tiff_and_large_size_within_limit():
    headers = signup("prem_user@example.com", plan="premium")
    # Make a ~1MB PNG
    png = make_image_bytes(fmt="PNG", size=(1600, 1200))
    files = {
        "title": (None, "Premium"),
        "category": (None, "test"),
        "tags": (None, "t1"),
        "price": (None, "0"),
        "image": ("test.png", png, "image/png"),
    }
    r = client.post("/photos/upload", files=files, headers=headers)
    assert r.status_code == 200


def test_batch_limit_enforced():
    headers = signup("batch_free@example.com", plan="free")
    img = make_image_bytes()
    files = [
        ("images", (f"file{i}.jpg", img, "image/jpeg")) for i in range(2)
    ]
    # Free limit is 1 -> sending 2 should 400
    data = {
        "title": (None, "Batch"),
        "category": (None, "test"),
        "tags": (None, ""),
        "price": (None, "0"),
    }
    r = client.post("/photos/upload/batch", files=files, data=data, headers=headers)
    assert r.status_code == 400


def test_export_quality_flag():
    headers_free = signup("export_free@example.com", plan="free")
    img = make_image_bytes()
    files = {
        "title": (None, "X"),
        "category": (None, "test"),
        "tags": (None, ""),
        "price": (None, "0"),
        "image": ("x.jpg", img, "image/jpeg"),
    }
    r = client.post("/photos/upload", files=files, headers=headers_free)
    assert r.status_code == 200
    pid = r.json()["id"]
    e = client.get(f"/photos/{pid}/export", headers=headers_free)
    assert e.status_code == 200
    assert e.json()["quality"] == "web"

    headers_p = signup("export_p@example.com", plan="premium")
    r2 = client.post("/photos/upload", files=files, headers=headers_p)
    assert r2.status_code == 200
    pid2 = r2.json()["id"]
    e2 = client.get(f"/photos/{pid2}/export", headers=headers_p)
    assert e2.status_code == 200
    assert e2.json()["quality"] == "high"


def test_quota_enforcement(monkeypatch):
    monkeypatch.setenv("PREMIUM_STORAGE_QUOTA_MB", "1")  # 1 MB quota
    headers = signup("quota@example.com", plan="premium")
    # Upload ~800KB ok
    img_ok = make_image_bytes(fmt="JPEG", size=(1200, 900))
    files_ok = {
        "title": (None, "Ok"),
        "category": (None, "test"),
        "tags": (None, ""),
        "price": (None, "0"),
        "image": ("ok.jpg", img_ok, "image/jpeg"),
    }
    r1 = client.post("/photos/upload", files=files_ok, headers=headers)
    assert r1.status_code == 200
    # Upload another ~800KB should exceed 1MB and fail
    img_fail = make_image_bytes(fmt="JPEG", size=(1200, 900))
    files_fail = {
        "title": (None, "Fail"),
        "category": (None, "test"),
        "tags": (None, ""),
        "price": (None, "0"),
        "image": ("fail.jpg", img_fail, "image/jpeg"),
    }
    r2 = client.post("/photos/upload", files=files_fail, headers=headers)
    assert r2.status_code == 400
    assert "quota" in r2.text.lower()
