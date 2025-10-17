from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .auth import get_current_user
from ..models.user import User
from ..models.payment import Payment
from ..models.photo import Photo
from ..models.purchase import Purchase
from sqlalchemy import select

router = APIRouter()


def _ok(data=None, message: str = "OK"):
    return {"success": True, "message": message, "data": data}


def _err(message: str = "Error", status_code: int = 400):
    raise HTTPException(status_code=status_code, detail=message)


@router.post("/initiate")
def initiate_payment(photo_ids: List[int], db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Sum prices and create a pending payment row.
    if not photo_ids:
        _err("No items to purchase", 400)
    photos = db.scalars(select(Photo).where(Photo.id.in_(photo_ids))).all()
    if not photos:
        _err("Invalid items", 404)
    # Basic validation: skip non-sale items
    valid = [p for p in photos if p.for_sale and p.is_public]
    if not valid:
        _err("Items not available for purchase", 400)
    amount = float(sum((p.price or 0) for p in valid))
    if amount <= 0:
        _err("Invalid amount", 400)

    p = Payment(user_id=user.id, photo_ids=",".join([str(p.id) for p in valid]), amount=amount, status="pending")
    db.add(p)
    db.commit()
    db.refresh(p)

    # Stub gateway URL (replace with Razorpay/Easebuzz session URL creation)
    gateway_url = f"/payment/checkout/mock?payment_id={p.id}"
    return _ok({"payment_id": p.id, "amount": p.amount, "gateway_url": gateway_url})


@router.post("/verify")
def verify_payment(payment_id: int, txn_id: Optional[str] = None, status: Optional[str] = "success", db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # In a real flow, this is called by webhook/callback with signature verification.
    pay = db.get(Payment, payment_id)
    if not pay or pay.user_id != user.id:
        _err("Payment not found", 404)
    if pay.status == "success":
        return _ok({"payment_id": pay.id, "status": pay.status, "txn_id": pay.txn_id}, "Already verified")

    # Simulate verification outcome
    if status not in {"success", "failed"}:
        _err("Invalid status", 400)

    pay.status = status
    pay.txn_id = txn_id or pay.txn_id
    db.add(pay)

    # On success: grant ownership for all photo_ids
    granted = []
    if status == "success":
        try:
            ids = [int(x) for x in (pay.photo_ids or "").split(",") if x.strip()]
        except Exception:
            ids = []
        for pid in ids:
            # Avoid duplicates
            exists = db.scalars(select(Purchase).where(Purchase.user_id == user.id, Purchase.photo_id == pid)).first()
            if exists:
                continue
            own = Purchase(user_id=user.id, photo_id=pid)
            db.add(own)
            granted.append(pid)
    db.commit()

    return _ok({"payment_id": pay.id, "status": pay.status, "txn_id": pay.txn_id, "granted": granted}, "Payment updated")


@router.get("/purchases")
def list_purchases(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Return purchased photos for current user
    purchase_rows = db.scalars(select(Purchase).where(Purchase.user_id == user.id)).all()
    ids = [r.photo_id for r in purchase_rows]
    if not ids:
        return _ok({"items": []})
    photos = db.scalars(select(Photo).where(Photo.id.in_(ids))).all()
    # Lightweight projection
    items = [
        {
            "id": p.id,
            "title": p.title,
            "price": p.price,
            "processed_url": p.processed_url,
            "url": p.url,
            "original_url": p.original_url,
        }
        for p in photos
    ]
    return _ok({"items": items})
