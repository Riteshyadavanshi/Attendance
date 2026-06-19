# Security & Compliance

## Authentication

| Mechanism | Detail |
|-----------|--------|
| Password hashing | bcrypt, cost factor 12 |
| Access tokens | JWT, HS256, 30-min expiry |
| Refresh tokens | Opaque token in Redis, 7-day expiry |
| MFA | TOTP (pyotp), required for admin roles in production |
| Session invalidation | Logout deletes refresh token from Redis |

## Authorization

- RBAC enforced on every endpoint — see [RBAC.md](RBAC.md)
- Tenant isolation via `organization_id` on all queries
- Deny by default

## Data Encryption

| Data | At Rest | In Transit |
|------|---------|------------|
| Passwords | bcrypt hash | TLS 1.2+ |
| Face embeddings | AES-256-GCM | TLS 1.2+ |
| JWT secrets | Env / secrets manager | N/A |
| Reports | S3 server-side encryption | TLS |
| Database | PostgreSQL encryption (managed) | TLS |

### Face Embedding Encryption

```python
from cryptography.fernet import Fernet

def encrypt_embedding(embedding: bytes, key: bytes) -> bytes:
    return Fernet(key).encrypt(embedding)

def decrypt_embedding(encrypted: bytes, key: bytes) -> bytes:
    return Fernet(key).decrypt(encrypted)
```

Key stored in `ENCRYPTION_KEY` env var / secrets manager. Rotate annually.

## Biometric Data Policy

| Policy | Implementation |
|--------|----------------|
| Consent | Explicit consent screen before face enrollment |
| Purpose limitation | Used only for attendance verification |
| Minimization | Store embeddings, not raw images (default) |
| Retention | Embeddings deleted on employee deactivation + 30 days |
| Right to erasure | API endpoint to delete face profile on request |
| Access control | Only auth service + face service access embeddings |

## Audit Logging

All sensitive actions logged to `audit_logs`:

| Action | Logged Fields |
|--------|---------------|
| Login / logout | user_id, IP, timestamp |
| Face enrollment | user_id, employee_id, version |
| Check-in/out | user_id, employee_id, result |
| Admin CRUD | user_id, resource, before/after |
| Correction approval | reviewer, attendance_id, decision |
| Report generation | user_id, type, date range |

Retention: 2 years minimum.

## GDPR Readiness

| Requirement | Implementation |
|-------------|----------------|
| Lawful basis | Consent + legitimate interest (employment) |
| Data export | `GET /users/me/data-export` — JSON bundle |
| Right to erasure | `DELETE /users/me` — anonymize + delete biometrics |
| Data portability | Export includes attendance, leave, training |
| Privacy policy | In-app link, version tracked |
| DPO contact | Configurable per org |

## Indian DPDP Act Compliance

| Requirement | Implementation |
|-------------|----------------|
| Consent manager | Granular consent for biometric processing |
| Data localization | Deploy in India region (ap-south-1) for Indian orgs |
| Breach notification | Alert pipeline within 72 hours |
| Children's data | N/A (employment context) |
| Significant data fiduciary | Architecture supports enhanced obligations |

## API Security

| Control | Implementation |
|---------|----------------|
| Rate limiting | Redis sliding window per IP/user |
| Input validation | Pydantic schemas on all endpoints |
| SQL injection | SQLAlchemy parameterized queries |
| CORS | Restricted origins in production |
| HTTPS | Enforced, HSTS header |
| Security headers | X-Content-Type-Options, X-Frame-Options |

## Mobile Security

| Control | Implementation |
|---------|----------------|
| Token storage | react-native-mmkv (encrypted) |
| Certificate pinning | Recommended for production |
| Root/jailbreak detection | Optional warning (V2) |
| Screenshot prevention | On face capture screens |
| Biometric app lock | Optional device biometric |

## Infrastructure Security

- VPC with private subnets for DB/Redis
- No public DB access
- Secrets in AWS Secrets Manager / Azure Key Vault
- IAM least privilege for S3, FCM
- Regular dependency scanning (Dependabot)
- SAST in CI pipeline

## Incident Response

1. Detect via Sentry / CloudWatch alerts
2. Contain: rotate JWT secret, invalidate sessions
3. Assess: audit log review
4. Notify: affected orgs within 72 hours (DPDP)
5. Remediate and document

## Security Checklist (Pre-Production)

- [ ] MFA enforced for admin roles
- [ ] TLS on all endpoints
- [ ] Secrets not in code
- [ ] Rate limiting enabled
- [ ] Audit logging verified
- [ ] Face data encryption verified
- [ ] Penetration test completed
- [ ] Privacy policy published
- [ ] Consent flow tested
- [ ] Data export/erasure endpoints tested
