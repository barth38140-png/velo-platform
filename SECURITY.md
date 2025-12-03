# Security Improvements - Vélo Platform

## Overview
This document outlines the security and robustness enhancements applied to the Vélo Platform backend.

## Applied Protections

### 1. Rate Limiting
- **Auth endpoints** (`/api/users/register`, `/api/users/login`): 10 requests per 15 minutes per IP
- **Admin operations** (`/api/brands/seed`, `/api/brands/normalize`): 5 requests per minute per IP
- Prevents brute force attacks and abuse of expensive operations

### 2. CORS (Cross-Origin Resource Sharing)
- **Strict origin whitelist** in production (configurable via `ALLOWED_ORIGINS` env var)
- **Development fallback**: allows localhost origins for local dev
- **Credentials support**: enabled for cookie-based auth if needed

### 3. Security Headers (Helmet)
- Content Security Policy (CSP)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- Strict-Transport-Security (HTTPS enforcement)
- Referrer-Policy

### 4. Input Validation
- **Express-validator** on all user-facing endpoints
- Brand names: 1-50 chars, trimmed
- Auth fields: email format, password min 8 chars, role whitelist
- Repair/message/location: type/range/length constraints

### 5. Authentication & Authorization
- **JWT-based auth**: tokens signed with `JWT_SECRET` (must be strong in production)
- **Role-based access control**:
  - `client`, `repairer`: standard users
  - `admin`: elevated privileges for seed/normalize operations
- **Admin elevation endpoint** (`POST /api/users/elevate-admin`):
  - Dev-only (disabled in production)
  - Requires valid JWT + `x-admin-secret` header
  - Returns new token with `admin` role

### 6. Error Handling
- **Centralized error middleware**: consistent error responses with `error`, `code`, `stack` (dev only)
- **No sensitive info leakage**: generic errors in production
- **Structured logging**: console errors include stack traces for debugging

### 7. Request Body Limits
- **10MB limit** on JSON/URL-encoded bodies to prevent DoS via large payloads

### 8. Production Safeguards
- **JWT_SECRET validation**: server refuses to start if using default secret in production
- **Admin operations**: seed/normalize restricted to admins only; elevation endpoint disabled in prod

## Environment Variables

```env
# Required in production
JWT_SECRET=<strong-random-secret>
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional
ADMIN_ELEVATE_SECRET=<dev-only-secret>  # for local admin elevation
PORT=5000
```

## Testing Rate Limits

### Auth endpoints (10 req / 15 min)
```powershell
1..12 | ForEach-Object {
  Invoke-WebRequest -Uri "http://localhost:5000/api/users/login" `
    -Method POST -ContentType "application/json" `
    -Body '{"email":"test@test.com","password":"test"}' `
    -UseBasicParsing
}
```
Expected: first 10 succeed or fail auth; 11th+ return 429 Too Many Requests.

### Admin endpoints (5 req / min)
```powershell
$headers = @{ Authorization = "Bearer <ADMIN_TOKEN>" }
1..6 | ForEach-Object {
  Invoke-WebRequest -Uri "http://localhost:5000/api/brands/seed" `
    -Method POST -Headers $headers -ContentType "application/json" `
    -Body '{"brands":["Test"]}' -UseBasicParsing
}
```
Expected: first 5 succeed; 6th returns 429.

## Creating an Admin User (Dev)

1. Register a normal user:
```powershell
$body = @{ email = "admin@example.com"; password = "SecurePass123!"; name = "Admin"; role = "client" } | ConvertTo-Json
$r = Invoke-WebRequest -Uri "http://localhost:5000/api/users/register" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
$token = ($r.Content | ConvertFrom-Json).token
```

2. Elevate to admin:
```powershell
$headers = @{ Authorization = "Bearer $token"; "x-admin-secret" = "dev-elevate" }
$r = Invoke-WebRequest -Uri "http://localhost:5000/api/users/elevate-admin" -Method POST -Headers $headers -UseBasicParsing
$adminToken = ($r.Content | ConvertFrom-Json).token
```

3. Use admin token for privileged operations:
```powershell
$headers = @{ Authorization = "Bearer $adminToken" }
Invoke-WebRequest -Uri "http://localhost:5000/api/brands/seed" -Method POST -Headers $headers -ContentType "application/json" -Body '{"brands":["BMC","Orbea","Fuji"]}' -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:5000/api/brands/normalize" -Method POST -Headers $headers -UseBasicParsing
```

## Remaining Recommendations

### High Priority
- [ ] Run `npm audit fix` to address 3 vulnerabilities (2 moderate, 1 high)
- [ ] Add API request logging (morgan or custom middleware with correlation IDs)
- [ ] Implement refresh tokens (current tokens expire after 7 days; consider shorter expiry + refresh flow)
- [ ] Add CSRF protection if using cookie-based sessions
- [ ] Database connection pooling limits and timeouts
- [ ] Add health check improvements: DB connection test, memory usage, uptime

### Medium Priority
- [ ] Input sanitization (XSS protection on text fields rendered in frontend)
- [ ] SQL injection audit (currently using parameterized queries, good; verify all dynamic SQL)
- [ ] Rate limit `/api/brands` POST (non-admin brand additions) to prevent spam
- [ ] Add audit logging for admin actions (seed/normalize/elevate)
- [ ] Implement soft deletes for critical entities (users, bikes, repairs)
- [ ] Add pagination on list endpoints (`/api/users`, `/api/repairs`, etc.)

### Low Priority
- [ ] Implement API versioning (`/api/v1/...`)
- [ ] Add OpenAPI/Swagger documentation
- [ ] Implement webhook signing for external integrations
- [ ] Add monitoring/alerting (Sentry, Datadog, etc.)
- [ ] Implement feature flags for gradual rollouts

## Frontend Security Considerations
- Use `httpOnly` cookies for tokens if switching from localStorage
- Sanitize user-generated content before rendering (DOMPurify)
- Implement Content Security Policy in frontend build
- Ensure sensitive routes require authentication
- Add loading states and proper error boundaries
- Validate file uploads (size, type, content) if implementing photo uploads

## Deployment Checklist
- [ ] Set strong `JWT_SECRET` (32+ random chars)
- [ ] Configure `ALLOWED_ORIGINS` for production domain(s)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (TLS certificates via Let's Encrypt or cloud provider)
- [ ] Configure firewall rules (allow only necessary ports)
- [ ] Set up automated backups for PostgreSQL
- [ ] Configure log aggregation and monitoring
- [ ] Review and harden PostgreSQL permissions
- [ ] Disable unnecessary routes/features in production
- [ ] Test rate limits and error handling in staging environment

---

**Last Updated**: December 1, 2025  
**Maintainer**: Vélo Platform Team
