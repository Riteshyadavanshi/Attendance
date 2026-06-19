# Notifications Module

## Overview

Push notifications for employees and HR via FCM (Android) and APNs (iOS). Scheduled reminders via background workers.

## Push Providers

| Platform | Provider |
|----------|----------|
| Android | Firebase Cloud Messaging (FCM) |
| iOS | Apple Push Notification service (APNs) |

## Token Registration

On app launch (after login):

```
POST /notifications/register
{
  "token": "fcm_or_apns_token",
  "platform": "android" | "ios"
}
```

Stored in `notification_tokens`. One user may have multiple devices.

## Notification Types

### Employee Notifications

| Type | Trigger | Message Example |
|------|---------|-----------------|
| `checkin_reminder` | Weekday 08:45, not checked in | "Good morning! Don't forget to check in." |
| `checkout_reminder` | Weekday 18:00, checked in no checkout | "Please check out before leaving." |
| `training_reminder` | 1 hour before session | "Training 'Safety 101' starts in 1 hour." |
| `feedback_request` | 30 min after session complete | "Share your feedback for today's training." |
| `leave_approved` | On HR approval | "Your leave request has been approved." |
| `leave_rejected` | On HR rejection | "Your leave request was rejected." |
| `correction_approved` | On correction approval | "Your attendance correction was approved." |

### HR Notifications

| Type | Trigger | Message Example |
|------|---------|-----------------|
| `attendance_alert` | Employee late > 30 min | "5 employees haven't checked in yet." |
| `missing_attendance` | End of day, no checkout | "12 employees haven't checked out." |
| `feedback_alert` | Low session rating | "Training session received low feedback (2.1/5)." |
| `correction_pending` | New correction request | "New attendance correction pending review." |
| `high_risk_employee` | Risk score > 60 | "Employee John Doe flagged as high risk." |

## Scheduled Jobs

| Job | Schedule | Action |
|-----|----------|--------|
| `checkin_reminder` | Weekdays 08:45 org TZ | Notify non-checked-in employees |
| `checkout_reminder` | Weekdays 18:00 org TZ | Notify checked-in without checkout |
| `training_reminder` | 1h before each session | Notify participants |
| `missing_attendance_alert` | Weekdays 10:00 | Alert HR of missing check-ins |
| `eod_checkout_alert` | Weekdays 19:00 | Alert HR of missing check-outs |

## Payload Format

```json
{
  "notification": {
    "title": "Check-In Reminder",
    "body": "Good morning! Don't forget to check in."
  },
  "data": {
    "type": "checkin_reminder",
    "screen": "Home",
    "organization_id": "uuid"
  }
}
```

Mobile app reads `data.screen` for deep linking.

## Implementation

### Backend

```python
class NotificationService:
    async def send_push(self, user_ids: list[UUID], title: str, body: str, data: dict):
        tokens = await self.get_tokens(user_ids)
        for token in tokens:
            if token.platform == "android":
                await fcm_client.send(token.token, title, body, data)
            else:
                await apns_client.send(token.token, title, body, data)
```

### Mobile

- Request permission on first launch
- Register token after login
- Handle foreground/background notifications
- Deep link to relevant screen on tap

## In-App Notification Center

`GET /notifications` — paginated history stored in `notifications` table (V1 optional, recommended).

## Rate Limiting

- Max 10 push notifications per user per day (excluding critical alerts)
- Batch HR alerts (one summary instead of per-employee)

## Opt-Out

- Employees cannot opt out of check-in reminders (business requirement)
- HR can configure reminder times per org (V2)

## Environment Variables

See [ENVIRONMENT.md](../ENVIRONMENT.md): `FCM_SERVER_KEY`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID`
