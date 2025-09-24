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

    def background_remove(self, image_bytes: bytes, filename: str) -> Optional[bytes]:
        if not self.bg_api_url or not self.bg_api_key:
            # Not configured; return None to indicate no-op
            return None
        try:
            files = {"image": (filename, image_bytes)}
            headers = {"Authorization": f"Bearer {self.bg_api_key}"}
            resp = requests.post(self.bg_api_url, files=files, headers=headers, timeout=60)
            resp.raise_for_status()
            # Assume the API returns binary image bytes
            return resp.content
        except Exception as e:
            print(f"[ai] background_remove failed: {e}")
            return None

    def ai_enhance(self, image_bytes: bytes, filename: str, mode: str = "autofix") -> Optional[bytes]:
        if not self.enhance_api_url or not self.enhance_api_key:
            return None
        try:
            files = {"image": (filename, image_bytes)}
            data = {"mode": mode}
            headers = {"Authorization": f"Bearer {self.enhance_api_key}"}
            resp = requests.post(self.enhance_api_url, files=files, data=data, headers=headers, timeout=60)
            resp.raise_for_status()
            return resp.content
        except Exception as e:
            print(f"[ai] ai_enhance failed: {e}")
            return None
