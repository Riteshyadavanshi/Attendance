# Feedback Module

## Overview

After training sessions, employees submit feedback. Head HR views live aggregated scores and negative feedback alerts.

## Feedback Form

Triggered automatically when session status → `completed` (push notification to participants).

### Fields

| Field | Type | Required | Range |
|-------|------|----------|-------|
| `trainer_rating` | Integer | Yes | 1–5 stars |
| `content_rating` | Integer | Yes | 1–5 stars |
| `practical_rating` | Integer | Yes | 1–5 stars |
| `suggestions` | Text | No | Max 2000 chars |

### Validation

- One submission per employee per session
- Session must be `completed`
- Employee must be a participant

## API

| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/feedback` | Employee |
| GET | `/feedback/session/{session_id}` | HR+ |
| GET | `/feedback/dashboard` | Head HR |

### POST `/feedback`

```json
{
  "session_id": "uuid",
  "trainer_rating": 4,
  "content_rating": 5,
  "practical_rating": 4,
  "suggestions": "More hands-on exercises would help."
}
```

## Aggregations

### Session Level

```json
{
  "session_id": "uuid",
  "response_count": 25,
  "avg_trainer": 4.2,
  "avg_content": 4.5,
  "avg_practical": 3.8,
  "overall_avg": 4.17
}
```

### Organization Level (Head HR Dashboard)

| Widget | Description |
|--------|-------------|
| Overall satisfaction | Avg across all 3 ratings |
| Response rate | Submissions / participants |
| Trend chart | Weekly avg over last 3 months |
| Low score alerts | Sessions with avg < 3.0 |

## Negative Feedback Alerts

Trigger alert when:
- Any individual rating ≤ 2
- Session average < 3.0

Alert channels:
- Push to Head HR
- WebSocket event on `/ws/feedback/live`
- Entry in HR notification feed

## Real-Time Dashboard (Head HR)

`FeedbackAnalyticsScreen`:
- Live feed of incoming feedback (WebSocket)
- Star rating charts per dimension
- Filter by training, date range, trainer
- Tap to read `suggestions` text

## Mobile Screens

| Screen | Role |
|--------|------|
| `FeedbackFormScreen` | Employee — post-training form |
| `FeedbackReviewScreen` | HR — per-session list |
| `FeedbackAnalyticsScreen` | Head HR — aggregates + alerts |

## Report Integration

Training reports include:
- Per-session feedback averages
- Individual responses (HR/Head HR only)
- Export via [REPORTS.md](REPORTS.md)

## Privacy

- Employees cannot see others' feedback
- Suggestions text visible to HR+ only
- Anonymized aggregates for department-level views (V2)
