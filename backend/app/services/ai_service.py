import os
from typing import Optional
import base64

import requests


class AIService:
    """
    Thin wrapper around external AI APIs.
    Premium-only features:
    - Background removal
    - AI enhance (autofix/clarity/light)

    Set the following env vars to configure providers:
    - BG_REMOVE_API_URL, BG_REMOVE_API_KEY
    - AI_ENHANCE_API_URL, AI_ENHANCE_API_KEY
    """

    def __init__(self):
        self.bg_api_url = os.getenv("BG_REMOVE_API_URL", "")
        self.bg_api_key = os.getenv("BG_REMOVE_API_KEY", "")
        self.enhance_api_url = os.getenv("AI_ENHANCE_API_URL", "")
        self.enhance_api_key = os.getenv("AI_ENHANCE_API_KEY", "")
        self.upscale_api_url = os.getenv("AI_UPSCALE_API_URL", "")
        self.upscale_api_key = os.getenv("AI_UPSCALE_API_KEY", "")

    def background_remove(self, image_bytes: bytes, filename: str) -> Optional[bytes]:
        # If external provider configured, use it first
        if self.bg_api_url and self.bg_api_key:
            try:
                files = {"image": (filename, image_bytes)}
                headers = {"Authorization": f"Bearer {self.bg_api_key}"}
                resp = requests.post(self.bg_api_url, files=files, headers=headers, timeout=60)
                resp.raise_for_status()
                # Assume the API returns binary image bytes
                return resp.content
            except Exception as e:
                print(f"[ai] background_remove provider failed: {e}")
                # fall through to local fallback

        # Local fallback using rembg (if installed)
        try:
            from rembg import remove  # type: ignore
            out = remove(image_bytes)
            return out
        except Exception as e:
            print(f"[ai] background_remove fallback failed: {e}")
            return None

    def ai_enhance(self, image_bytes: bytes, filename: str, mode: str = "autofix") -> Optional[bytes]:
        # If external provider configured, try it first
        if self.enhance_api_url and self.enhance_api_key:
            try:
                files = {"image": (filename, image_bytes)}
                data = {"mode": mode}
                headers = {"Authorization": f"Bearer {self.enhance_api_key}"}
                resp = requests.post(self.enhance_api_url, files=files, data=data, headers=headers, timeout=60)
                resp.raise_for_status()
                return resp.content
            except Exception as e:
                print(f"[ai] ai_enhance provider failed: {e}")

        # Local fallback using Pillow: auto-contrast + sharpen
        try:
            from PIL import Image, ImageFilter, ImageOps
            import io
            im = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            im = ImageOps.autocontrast(im)
            im = im.filter(ImageFilter.SHARPEN)
            out = io.BytesIO()
            im.save(out, format="JPEG", quality=92)
            return out.getvalue()
        except Exception as e:
            print(f"[ai] ai_enhance fallback failed: {e}")
            return None

    def upscale(self, image_bytes: bytes, filename: str, scale: int = 2) -> Optional[bytes]:
        # If external provider configured, try it first
        if self.upscale_api_url and self.upscale_api_key:
            try:
                files = {"image": (filename, image_bytes)}
                data = {"scale": str(scale)}
                headers = {"Authorization": f"Bearer {self.upscale_api_key}"}
                resp = requests.post(self.upscale_api_url, files=files, data=data, headers=headers, timeout=120)
                resp.raise_for_status()
                return resp.content
            except Exception as e:
                print(f"[ai] upscale provider failed: {e}")

        # Local fallback using Pillow resize with LANCZOS
        try:
            from PIL import Image
            import io
            im = Image.open(io.BytesIO(image_bytes))
            w, h = im.size
            new_size = (max(1, int(w * scale)), max(1, int(h * scale)))
            im = im.resize(new_size, Image.LANCZOS)
            out = io.BytesIO()
            # Preserve format if possible
            fmt = (im.format or "JPEG") if im.format in {"JPEG", "PNG", "WEBP"} else "JPEG"
            im = im.convert("RGB") if fmt == "JPEG" else im
            im.save(out, format=fmt, quality=92)
            return out.getvalue()
        except Exception as e:
            print(f"[ai] upscale fallback failed: {e}")
            return None
