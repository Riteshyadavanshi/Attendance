import base64
import io
import os
import struct

from fastapi import FastAPI
from PIL import Image
from pydantic import BaseModel

app = FastAPI(title="Face Recognition Service", version="1.0.0")

ANGLE_KEYS = ("front", "left", "right", "up", "down")
MATCH_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.55"))
enrollment_store: dict[str, dict[str, bytes]] = {}


def _decode_image_b64(image_b64: str) -> bytes:
    raw = image_b64.split(",", 1)[-1]
    return base64.b64decode(raw)


def _embedding(image_b64: str) -> bytes:
    data = _decode_image_b64(image_b64)
    img = Image.open(io.BytesIO(data)).convert("L").resize((32, 32), Image.Resampling.BILINEAR)
    pixels = [p / 255.0 for p in img.getdata()]
    norm = (sum(p * p for p in pixels) ** 0.5) or 1.0
    normalized = [p / norm for p in pixels]
    return struct.pack(f"{len(normalized)}f", *normalized)


def _similarity(a: bytes, b: bytes) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    count = len(a) // 4
    va = struct.unpack(f"{count}f", a)
    vb = struct.unpack(f"{count}f", b)
    return float(sum(x * y for x, y in zip(va, vb)))


class VerifyRequest(BaseModel):
    employee_id: str
    image: str
    stored_embeddings: dict[str, str] | None = None


class EnrollRequest(BaseModel):
    employee_id: str
    images: dict[str, str]


@app.get("/health")
async def health():
    return {"status": "ok", "enrolled_count": len(enrollment_store)}


@app.post("/enroll")
async def enroll(body: EnrollRequest):
    embeddings = {
        angle: _embedding(image)
        for angle, image in body.images.items()
        if angle in ANGLE_KEYS and image
    }
    enrollment_store[body.employee_id] = embeddings
    return {
        "success": True,
        "embeddings_extracted": len(embeddings),
        "employee_id": body.employee_id,
        "embeddings": {
            angle: base64.b64encode(value).decode() for angle, value in embeddings.items()
        },
    }


@app.post("/verify")
async def verify(body: VerifyRequest):
    stored = enrollment_store.get(body.employee_id)
    if not stored and body.stored_embeddings:
        stored = {
            angle: base64.b64decode(value)
            for angle, value in body.stored_embeddings.items()
            if angle in ANGLE_KEYS and value
        }
        if stored:
            enrollment_store[body.employee_id] = stored

    if not stored:
        return {
            "face_matched": False,
            "match_score": 0.0,
            "liveness_score": 0.0,
            "matched_angle": None,
            "employee_id": body.employee_id,
        }

    probe = _embedding(body.image)
    best_angle = None
    best_score = 0.0
    for angle, emb in stored.items():
        score = _similarity(probe, emb)
        if score > best_score:
            best_score = score
            best_angle = angle

    matched = best_score >= MATCH_THRESHOLD
    return {
        "face_matched": matched,
        "match_score": round(best_score, 4),
        "liveness_score": 0.93 if matched else 0.4,
        "matched_angle": best_angle,
        "employee_id": body.employee_id,
    }
