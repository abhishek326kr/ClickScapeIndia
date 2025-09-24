from typing import List
from sqlalchemy.orm import Session
from fastapi import UploadFile
from ..models.photo import Photo
from ..models.profile import Profile
from ..models.user import User
from ..schemas.photos import PhotoOut, PhotoFilter, PhotoUpdate
import os
import uuid
from io import BytesIO
from .plan_service import (
    normalize_ext,
    get_plan,
    get_upload_rules,
    get_storage_quota_bytes,
)

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except Exception:
    PIL_AVAILABLE = False

class PhotoService:
    def __init__(self, db: Session):
        self.db = db

    def _apply_watermark(self, raw_bytes: bytes, orig_ext: str) -> tuple[bytes, str]:
        """Apply a center watermark. Prefer logo (app/assets/watermark.png), fallback to text.
        Returns (image_bytes, new_ext) where new_ext includes leading dot (e.g. '.jpg' or '.png')."""
        if not PIL_AVAILABLE:
            print("[watermark] Pillow not available; install 'pillow'")
            return raw_bytes, orig_ext or ".jpg"
        try:
            with Image.open(BytesIO(raw_bytes)) as im:
                im = im.convert("RGBA")
                assets_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets")
                logo_path = os.path.join(assets_dir, "watermark.png")

                applied_logo = False
                if os.path.exists(logo_path):
                    try:
                        with Image.open(logo_path).convert("RGBA") as logo:
                            # Scale logo to ~35% of min(image width,height)
                            base = min(im.width, im.height)
                            target_w = max(96, int(base * 0.35))
                            scale = target_w / logo.width
                            new_size = (int(logo.width * scale), int(logo.height * scale))
                            logo = logo.resize(new_size, Image.LANCZOS)
                            # Opacity 60%
                            alpha = logo.split()[3]
                            alpha = alpha.point(lambda a: int(a * 0.6))
                            logo.putalpha(alpha)
                            # Center position
                            x = (im.width - logo.width) // 2
                            y = (im.height - logo.height) // 2
                            im.alpha_composite(logo, (x, y))
                            applied_logo = True
                            print("[watermark] applied centered logo watermark")
                    except Exception as e:
                        print(f"[watermark] logo overlay failed: {e}; using text fallback")

                if not applied_logo:
                    draw = ImageDraw.Draw(im)
                    # Text fallback: size ~10% of min dimension
                    font_size = max(24, int(min(im.width, im.height) * 0.10))
                    try:
                        font = ImageFont.truetype("arial.ttf", font_size)
                    except Exception:
                        font = ImageFont.load_default()
                    text = "ClickScapeIndia"
                    bbox = draw.textbbox((0, 0), text, font=font)
                    text_w, text_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
                    x = (im.width - text_w) // 2
                    y = (im.height - text_h) // 2
                    # Shadow
                    shadow = max(2, font_size // 20)
                    draw.text((x + shadow, y + shadow), text, font=font, fill=(0, 0, 0, 160))
                    draw.text((x, y), text, font=font, fill=(255, 255, 255, 210))
                    print("[watermark] applied centered text watermark")

                # Encode result
                buf = BytesIO()
                save_ext = (orig_ext or ".jpg").lower()
                if save_ext in (".png", ".webp"):
                    fmt = "PNG"; new_ext = ".png"
                else:
                    fmt = "JPEG"; new_ext = ".jpg"
                if im.mode != "RGB":
                    im = im.convert("RGB")
                im.save(buf, format=fmt, quality=92)
                return buf.getvalue(), new_ext
        except Exception as e:
            print(f"[watermark] failed overall: {e}; using original image")
        return raw_bytes, (orig_ext or ".jpg")

    def _compress_for_free(self, raw_bytes: bytes, orig_ext: str) -> tuple[bytes, str]:
        """Produce a web-optimized image for free-tier export (medium quality)."""
        if not PIL_AVAILABLE:
            return raw_bytes, orig_ext or ".jpg"
        try:
            with Image.open(BytesIO(raw_bytes)) as im:
                if im.mode not in ("RGB", "L"):
                    im = im.convert("RGB")
                # Limit longest side to ~1600px for web
                max_side = 1600
                ratio = min(max_side / im.width, max_side / im.height, 1.0)
                if ratio < 1.0:
                    new_size = (int(im.width * ratio), int(im.height * ratio))
                    im = im.resize(new_size, Image.LANCZOS)
                buf = BytesIO()
                ext = (orig_ext or ".jpg").lower()
                if ext in (".png", ".webp"):
                    fmt = "PNG"; new_ext = ".png"
                else:
                    fmt = "JPEG"; new_ext = ".jpg"
                im.save(buf, format=fmt, quality=82, optimize=True)
                return buf.getvalue(), new_ext
        except Exception as e:
            print(f"[compress] failed: {e}; returning original")
        return raw_bytes, (orig_ext or ".jpg")

    def _save_bytes(self, data: bytes, ext: str) -> tuple[str, str]:
        """Saves bytes to uploads dir with random filename and returns (disk_path, public_url)."""
        base_dir = os.path.dirname(os.path.dirname(__file__))  # .../app
        upload_dir = os.path.join(base_dir, "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        ext = (ext or ".jpg").lower()
        filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(upload_dir, filename)
        with open(file_path, "wb") as f:
            f.write(data)
        url = f"/uploads/{filename}"
        return file_path, url

    async def upload_photo(self, title: str, category: str, tags: str, price: float, watermark: bool, image: UploadFile, user: User | None) -> PhotoOut:
        # Validate by plan
        plan = get_plan(user)
        allowed_exts, max_bytes, _upload_limit = get_upload_rules(plan)
        ext = normalize_ext(image.filename)
        if ext not in allowed_exts:
            raise ValueError(f"Unsupported file type for {plan} plan. Allowed: {', '.join(sorted(allowed_exts))}")
        contents = await image.read()
        orig_size = len(contents or b"")
        if orig_size > max_bytes:
            raise ValueError(f"File too large for {plan} plan. Max {max_bytes // (1024*1024)} MB")

        # Premium: enforce storage quota (persistent)
        original_url = None
        processed_url = None
        if plan == "premium":
            quota = get_storage_quota_bytes(plan)
            used = getattr(user, "storage_used", 0) or 0
            if used + orig_size > quota:
                raise ValueError("Storage quota exceeded. Please delete files or upgrade your plan.")
            # Save original as-is
            _, original_url = self._save_bytes(contents, ext)
            # Processed for previews can be a lightly compressed copy without watermark
            preview_bytes, preview_ext = self._compress_for_free(contents, ext)
            _, processed_url = self._save_bytes(preview_bytes, preview_ext)
        else:
            # Free: always watermark and web-optimize
            wm_bytes, wm_ext = self._apply_watermark(contents, ext)
            out_bytes, out_ext = self._compress_for_free(wm_bytes, wm_ext)
            _, processed_url = self._save_bytes(out_bytes, out_ext)

        photo = Photo(
            title=title,
            category=category,
            tags=tags or "",
            price=price or 0.0,
            watermark=(plan == "free"),
            url=processed_url,
            processed_url=processed_url,
            original_url=original_url,
            bytes_size=(orig_size if plan == "premium" else 0),
            user_id=(user.id if user else None),
        )
        self.db.add(photo)
        # Update storage usage for premium
        if plan == "premium":
            user.storage_used = (getattr(user, "storage_used", 0) or 0) + orig_size
            self.db.add(user)
        self.db.commit()
        self.db.refresh(photo)
        return PhotoOut.from_orm(photo)

    def export_photo_url(self, photo_id: int, user: User | None) -> str:
        """Return a URL to download/export: free -> processed (web), premium -> original if available."""
        plan = get_plan(user)
        photo = self.get_photo(photo_id)
        if not photo:
            raise ValueError("Photo not found")
        if plan == "premium" and photo.original_url:
            return photo.original_url
        # Fallback to processed/web version
        return photo.processed_url or photo.url or ""

    def list_photos(self, page: int, size: int, filters: PhotoFilter) -> List[PhotoOut]:
        q = self.db.query(Photo)
        if filters.category:
            q = q.filter(Photo.category == filters.category)
        items = q.order_by(Photo.id.desc()).offset((page - 1) * size).limit(size).all()
        results: List[PhotoOut] = []
        # preload profiles for efficiency
        user_ids = {x.user_id for x in items if x.user_id}
        profiles = {}
        if user_ids:
            for p in self.db.query(Profile).filter(Profile.user_id.in_(list(user_ids))).all():
                profiles[p.user_id] = p
        for x in items:
            base = PhotoOut.from_orm(x)
            prof = profiles.get(x.user_id)
            if prof:
                data = base.model_dump()
                data.update({
                    "owner_name": prof.name or "",
                    "owner_avatar_url": prof.avatar_url or "",
                })
                base = PhotoOut(**data)
            results.append(base)
        return results

    def list_my_photos(self, user_id: int, page: int, size: int) -> List[PhotoOut]:
        q = self.db.query(Photo).filter(Photo.user_id == user_id)
        items = q.order_by(Photo.id.desc()).offset((page - 1) * size).limit(size).all()
        results: List[PhotoOut] = []
        prof = self.db.query(Profile).filter(Profile.user_id == user_id).first()
        for x in items:
            base = PhotoOut.from_orm(x)
            if prof:
                data = base.model_dump()
                data.update({
                    "owner_name": prof.name or "",
                    "owner_avatar_url": prof.avatar_url or "",
                })
                base = PhotoOut(**data)
            results.append(base)
        return results

    def get_photo(self, photo_id: int) -> Photo | None:
        return self.db.query(Photo).filter(Photo.id == photo_id).first()

    def update_photo(self, photo_id: int, payload: PhotoUpdate) -> PhotoOut:
        photo = self.get_photo(photo_id)
        if not photo:
            raise ValueError("Photo not found")
        for field, value in payload.model_dump(exclude_none=True).items():
            setattr(photo, field, value)
        self.db.commit()
        self.db.refresh(photo)
        return PhotoOut.from_orm(photo)

    def delete_photo(self, photo_id: int) -> None:
        photo = self.get_photo(photo_id)
        if not photo:
            raise ValueError("Photo not found")
        # Adjust storage for premium owner
        if photo.user_id:
            user = self.db.query(User).filter(User.id == photo.user_id).first()
            if user and get_plan(user) == "premium":
                try:
                    user.storage_used = max(0, (user.storage_used or 0) - (photo.bytes_size or 0))
                    self.db.add(user)
                except Exception:
                    pass
        self.db.delete(photo)
        self.db.commit()
