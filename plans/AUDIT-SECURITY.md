# Security Audit Report -- Stokis Project

**Audit Date:** 2026-09-09
**Scope:** Full codebase at `/home/bradley/project/stokis-project`

## Summary

| Severity | Count |
|----------|-------|
| Critical | 6 |
| High | 6 |
| Medium | 8 |
| Low | 4 |
| Info | 4 |
| **Total** | **28** |

---

## CRITICAL

### C1. SHA-256 PIN Hashing Without Salt
**File:** `lib/domain/ids.ts:65-67`

SHA-256 without per-user salt. 6-digit PIN = 1M possibilities, trivially rainbow-tabled.

**Status:** RESOLVED (2026-09-14) -- PIN hashing feature was removed entirely by product decision; PINs are now stored and compared as plaintext. Session remains HMAC-signed. Brute-force exposure is addressed by **C3**.

**Fix (was):** Use bcrypt/scrypt/Argon2 with per-user random salt.

### C2. `.env.local` Contains Live Service Account Private Key
**File:** `.env.local:5,9`

Live private key, API key, and service account email in plaintext. While gitignored, if repo is shared, all secrets exposed.

**Fix:** Rotate keys if repo ever shared. Use Vercel env vars or secrets manager.

### C3. No Login Rate Limiting -- Brute Force
**File:** `app/api/auth/login/route.ts:5-38`

Zero rate limiting, lockout, or throttling. 6-digit PIN brute-forceable in minutes.

**Fix:** Implement rate limiting (5 attempts/minute), progressive lockout, CAPTCHA after 3 failures.

### C4. Public XLSX Endpoint Has No Authentication
**File:** `app/api/so/[laporanId]/xlsx-file/route.ts:41-143`

GET handler NOT wrapped with `withAuth`. Any unauthenticated user who knows a `laporanId` can download XLSX reports.

**Fix:** Wrap with `withAuth` and `assertCabangAccess`, or implement signed download tokens.

### C5. `assertCabangAccess` Bypass on Empty `cabangId`
**File:** `lib/auth.ts:69-70`

```ts
const reqCabang = (cabangId || '').trim().toUpperCase();
if (!reqCabang) return null;  // passes through without check
```

When `cabangId` is empty, guard returns `null` (access granted). Affected routes: `laporan/route.ts`, `laporan/[laporanId]/wa-link/route.ts`.

**Fix:** Return 400 when `cabangId` is empty.

### C6. `.env.production` Tracked in Git
**File:** `.env.production:1`

Contains Google Apps Script deployment URL. Tracked in git (commit `b7391dc`).

**Fix:** `git rm --cached .env.production`, add to `.gitignore`, rotate GAS deployment.

---

## HIGH

### H1. CSP Allows `unsafe-inline` and `unsafe-eval`
**File:** `next.config.ts:13`

```ts
"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
```

Completely negates CSP. Any XSS = full code execution.

**Fix:** Remove unsafe-inline/eval. Use nonce-based CSP.

### H2. No CORS Configuration
Zero CORS headers anywhere. No CSRF protection on state-changing endpoints.

**Fix:** Add explicit CORS headers for same-origin only.

### H3. Plaintext PIN Migration Path
**File:** `lib/domain/users-service.ts`

Login flow compares raw plaintext PIN as migration path. Unmigrated users have PIN stored in plaintext in Google Sheet.

**Status:** RESOLVED (2026-09-14) -- hashing removed by product decision; plaintext storage/comparison is now the intended behavior. `hashPin`/`secureKeyEqual`/`rehashPin` deleted.

**Fix (was):** Run migration script to hash all plaintext PINs. Remove migration code.

### H4. Debug Routes Exposed Without Production Guard
**Files:** `app/api/debug/route.ts`, `app/api/debug/test-drive/route.ts`, `app/api/debug/ping/route.ts`

Returns internal spreadsheet IDs, folder IDs to any authenticated user. No role restriction.

**Fix:** Delete before production. Add `NODE_ENV === 'development'` guard.

### H5. Sheets Formula Injection via `USER_ENTERED`
**File:** `lib/google/sheets.ts:95,163`

```ts
valueInputOption: 'USER_ENTERED',
```

Cell values starting with `=`, `+`, `-`, `@` interpreted as formulas. Attacker could inject `=IMPORTDATA(...)`.

**Fix:** Use `valueInputOption: 'RAW'` or sanitize values.

### H6. No CSRF Protection
No CSRF tokens on state-changing endpoints. SameSite=Strict helps but older browsers may not enforce.

**Fix:** Add CSRF token mechanism or require custom header on mutations.

---

## MEDIUM

### M1. Error Messages Leak Internal Details
**Files:** `app/api/auth/login/route.ts:33-36`, `app/api/so/previous/route.ts:42`, multiple debug routes.

Raw error messages returned to client.

**Fix:** Log server-side, return generic messages.

### M2. Content-Disposition Header Injection
**File:** `app/api/so/[laporanId]/xlsx/route.ts:156`, `xlsx-file/route.ts:139`

Filename from user-influenced values, incomplete sanitization.

**Fix:** Sanitize filename to alphanumeric/hyphens/underscores only.

### M3. Information Disclosure via Debug Route
**File:** `app/api/debug/route.ts:14-21`

Returns internal spreadsheet/folder IDs to any authenticated user.

### M4. Session Tokens Lack IP/User-Agent Binding
**File:** `lib/session.ts:24-35`

Stolen session usable from any device/location.

**Fix:** Include IP/UA fingerprint in signed token.

### M5. No Session Revocation Mechanism
Stateless JWT with 7-day expiry. Cannot revoke on password change, user deletion, or admin action.

**Fix:** Implement server-side session blocklist.

### M6. `cabangId` Not Validated for Petugas in Multiple Routes
**Files:** `app/api/laporan/route.ts:17,22`, `app/api/laporan/[laporanId]/wa-link/route.ts:18,20`

Combined with C5, petugas could bypass branch check.

### M7. `callAppsScript` Dispatcher -- Action Injection
**Files:** `app/api/petugas/route.ts:16`, `app/api/master-item/[itemId]/status/route.ts:9`

Petugas could send different `cabangId` in request body than authorized.

**Fix:** Always use session's `cabangId` for petugas.

### M8. `users/route.ts` GET Leaks All User Data
**File:** `app/api/users/route.ts:5-9`

No `requiredRole` restriction. Any authenticated user can list all users (usernames, hashed PINs, roles, branch assignments).

**Fix:** Add `requiredRole: 'admin'`.

---

## LOW

### L1. CSP Allows Image Loading from Any HTTPS Source
**File:** `next.config.ts:15` -- `img-src 'self' data: https: blob:`

### L2. `console.log`/`console.error` in Production
Multiple API routes log internal state to console.

### L3. No Input Length Validation on Most Fields
No max length on username, PIN, branch name, etc.

### L4. Missing Explicit `poweredByHeader: false`

---

## INFO

- **I1:** Session expiry is 7 days (acceptable but could be shorter)
- **I2:** `.gitignore` properly ignores `.env.local`
- **I3:** Google Drive XLSX reports made publicly readable (intentional for sharing)
- **I4:** `connect-src` correctly restricted to self + GAS endpoints

---

## TOP PRIORITY REMEDIATION ORDER

1. **C3** -- Rate limiting on login (immediate)
2. **C4** -- Auth on `/xlsx-file` route (immediate)
3. **C1** -- ~~Migrate to bcrypt for PIN hashing~~ RESOLVED: hashing removed
4. **C5** -- Fix assertCabangAccess empty cabangId bypass
5. **H5** -- Switch from USER_ENTERED to RAW
6. **H1** -- Remove unsafe-inline/eval from CSP
7. **H3** -- ~~Complete plaintext PIN migration~~ RESOLVED: hashing removed
8. **H4** -- Delete debug routes
9. **M7** -- Use session cabangId for petugas
10. **M8** -- Admin-only restriction on users GET
