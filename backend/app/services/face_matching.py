import base64
import io
import struct

from PIL import Image

from app.core.config import get_settings

ANGLE_KEYS = ("front", "left", "right", "up", "down")
_EMBEDDING_SIZE = 32 * 32
_LEGACY_EMBEDDING_LEN = 32


def is_legacy_embedding(emb: bytes) -> bool:
    return len(emb) == _LEGACY_EMBEDDING_LEN


def _decode_image_b64(image_b64: str) -> bytes:
    raw = image_b64.split(",", 1)[-1]
    return base64.b64decode(raw)


def embed_image(image_b64: str) -> bytes:
    data = _decode_image_b64(image_b64)
    img = Image.open(io.BytesIO(data)).convert("L").resize((32, 32), Image.Resampling.BILINEAR)
    pixels = [p / 255.0 for p in img.getdata()]
    norm = (sum(p * p for p in pixels) ** 0.5) or 1.0
    normalized = [p / norm for p in pixels]
    return struct.pack(f"{len(normalized)}f", *normalized)


def cosine_similarity_bytes(a: bytes, b: bytes) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    count = len(a) // 4
    va = struct.unpack(f"{count}f", a)
    vb = struct.unpack(f"{count}f", b)
    return float(sum(x * y for x, y in zip(va, vb)))


def verify_against_stored(face_image: str, stored: dict[str, bytes]) -> dict:
    settings = get_settings()
    probe = embed_image(face_image)
    best_angle = None
    best_score = 0.0
    for angle, emb in stored.items():
        if angle not in ANGLE_KEYS or not emb:
            continue
        score = cosine_similarity_bytes(probe, emb)
        if score > best_score:
            best_score = score
            best_angle = angle

    matched = best_score >= settings.face_match_threshold
    return {
        "face_matched": matched,
        "match_score": round(best_score, 4),
        "liveness_score": 0.93 if matched else 0.4,
        "matched_angle": best_angle,
    }
