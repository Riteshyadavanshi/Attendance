# Face Recognition Module

## Overview

Face enrollment stores encrypted embeddings for 5 angles. Check-in/out verifies live capture against stored embeddings with liveness anti-spoofing.

## Enrollment

### Required Angles

| Angle | Instruction to User |
|-------|---------------------|
| Front | Look straight at camera |
| Left | Turn head ~30° left |
| Right | Turn head ~30° right |
| Up | Tilt head slightly up |
| Down | Tilt head slightly down |

### Processing Pipeline

```
Image Upload → Face Detection (MTCNN/MediaPipe)
            → Alignment & Normalization
            → Embedding Extraction (FaceNet 512-dim vector)
            → AES-256 Encryption
            → Store in face_profiles table
```

### Image Requirements

| Parameter | Value |
|-----------|-------|
| Min resolution | 640×480 |
| Max file size | 5 MB |
| Format | JPEG, PNG |
| Faces per image | Exactly 1 |
| Min face size | 80×80 pixels |

## Verification (Check-In)

### Pipeline

```
Live Selfie → Liveness Detection
           → Face Detection + Embedding
           → Compare vs stored embeddings (all 5 angles)
           → Best match score vs threshold
           → Pass/Fail
```

### Matching Algorithm

- Extract embedding from live capture
- Decrypt stored embeddings
- Compute cosine similarity against each stored angle
- Use **max similarity** across angles as match score
- Pass if `match_score >= FACE_MATCH_THRESHOLD` (default 0.6)

```python
def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
```

## Liveness Detection

### Checks (V1)

| Check | Method | Weight |
|-------|--------|--------|
| Blink detection | Eye aspect ratio (EAR) over 3-second window | 30% |
| Head movement | Pose change between frames | 25% |
| Texture analysis | Detect print/screen artifacts (LBP) | 25% |
| Depth estimation | Monocular depth heuristic | 20% |

### Anti-Spoofing Targets

| Attack | Mitigation |
|--------|------------|
| Printed photo | Texture + liveness model |
| Screen replay | Moiré pattern detection, brightness analysis |
| Video replay | Random challenge (blink/turn) |
| Deepfake | Liveness model + challenge-response |

### Challenge-Response Flow

1. App shows random instruction: "Blink twice" or "Turn head left"
2. Capture 3-second video clip (or burst of frames)
3. Server validates challenge completion + liveness score
4. Proceed to face match only if liveness passes

### Thresholds

| Parameter | Default | Env Var |
|-----------|---------|---------|
| Liveness pass score | ≥ 0.85 | `LIVENESS_THRESHOLD` |
| Face match score | ≥ 0.60 | `FACE_MATCH_THRESHOLD` |

## AI Service API

### POST `/enroll`

```json
{
  "employee_id": "uuid",
  "images": {
    "front": "base64...",
    "left": "base64...",
    "right": "base64...",
    "up": "base64...",
    "down": "base64..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "embeddings_extracted": 5
}
```

### POST `/verify`

```json
{
  "employee_id": "uuid",
  "image": "base64...",
  "challenge_type": "blink",
  "frames": ["base64...", "..."]
}
```

**Response:**
```json
{
  "face_matched": true,
  "match_score": 0.91,
  "liveness_score": 0.93,
  "matched_angle": "front"
}
```

## Data Security

- Embeddings encrypted with AES-256-GCM before DB storage
- Raw images deleted after embedding extraction (default)
- Optional retention: max 7 days in encrypted S3 for audit
- No embedding exposed to client — all inference server-side

## Model Files

```
ai/face_service/models/
├── facenet.pb              # or facenet.onnx
├── mtcnn/                  # Face detection weights
└── liveness/
    └── model.onnx          # Liveness classifier
```

## Performance Targets

| Metric | Target |
|--------|--------|
| Enrollment (5 images) | < 5 seconds |
| Verification | < 2 seconds |
| Concurrent verifications | 50/sec per worker |

## Error Codes

| Code | Description |
|------|-------------|
| `NO_FACE_DETECTED` | No face in image |
| `MULTIPLE_FACES` | More than one face |
| `LOW_QUALITY` | Image too blurry/dark |
| `LIVENESS_FAILED` | Anti-spoofing failed |
| `FACE_NOT_MATCHED` | Below match threshold |

## Re-Enrollment

- Employee or HR can trigger re-enrollment
- Increments `face_profiles.version`
- Old embeddings overwritten after successful new enrollment
