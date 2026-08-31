# Chat Log — Sprint 1 Auth Fix (Phase 0 → Deployment)

**Last saved:** August 31, 2026  
**Branch:** `2026-08-25-blq7`  
**PRD:** `ai-workspace/Sprint1_Auth_Technical_PRD_Final.md`  
**Live URL:** `https://ai-sprint-demo1.saroja-vaddireddy-dev.workers.dev`  
**Prior context:** See `ai-workspace/chat-log-quiz-feature.md` for Phase 0 (quiz removal, demo auth UI, question bank landing)

---

## Phase 0 — Starting point (before Sprint 1 auth)

The app already had:

| Route | Purpose |
|-------|---------|
| `/` | Login/Register UI (`AuthForm`) |
| `/question-bank` | Post-login landing with client-side session guard |

**Limitations at start of Sprint 1:**

- Auth was **browser-only** (localStorage users, sessionStorage session)
- No D1 database, no real API endpoints
- Register form lacked username and confirm-password fields
- `/quiz` already removed (out of scope)

---

## User request — PRD rename and review (Aug 31)

> Rename `TEMPLATE_TECHNICAL_PRD.md` → `Sprint1_Auth_Technical_PRD_Final.md`. Review for gaps/risks. Confirm phase plan. Do not write code yet.

### Agent response

- Renamed PRD file
- Identified gaps: confirm-password missing from current UI, no D1/API layer, client-only session protection, login field ambiguity (email vs username)
- Confirmed phase plan: **Database Schema → Backend APIs → Frontend Updates → Testing → Deploy**

---

## User request — Registration requirements update (Aug 31)

> Add username, email, password, confirm password to registration. Update PRD schema and `/api/register` body. Show updated schema before Phase 1.

### Agent response — Updated schema

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**POST /api/register body:**

```json
{
  "username": "string",
  "email": "user@example.com",
  "password": "string",
  "confirmPassword": "string"
}
```

**Decision:** Login stays **email + password only** (no username login).

---

## Phase 1 — Database Schema

### User request

> Proceed with Phase 1. Show migration file before running it.

### Delivered

**File:** `migrations/0001_create_users_table.sql`

- `users` table with `username`, `email`, `password_hash`, `created_at`
- Indexes on `username` and `email`

**Config:** `wrangler.jsonc` — D1 binding `DB` → `ai-sprint-demo1-db`

**Local apply:** `npx wrangler d1 migrations apply ai-sprint-demo1-db --local`

**Status:** COMPLETED

---

## Phase 2 — Backend APIs

### User request

> Build `/api/register`, `/api/login`, `/api/logout`, `/api/session` per PRD. Show code and local test commands.

### Delivered

| Endpoint | File | Notes |
|----------|------|-------|
| POST `/api/register` | `src/app/api/register/route.ts` | Zod validation, PBKDF2 hash, D1 insert, session cookie |
| POST `/api/login` | `src/app/api/login/route.ts` | Credential verify, generic error on failure |
| POST `/api/logout` | `src/app/api/logout/route.ts` | Clears session cookie |
| GET `/api/session` | `src/app/api/session/route.ts` | Returns user or 401 |

**Supporting library files:**

- `src/lib/auth/schemas.ts` — Zod schemas
- `src/lib/auth/password.ts` — PBKDF2-SHA256 hash/verify
- `src/lib/auth/session.ts` — Signed httpOnly `auth_session` cookie
- `src/lib/auth/api-response.ts` — JSON + Set-Cookie helpers
- `src/lib/services/users.ts` — D1 user queries
- `src/lib/cloudflare-env.ts` — Typed env including `SESSION_SECRET`
- `scripts/test-auth-api.ps1` — Manual API smoke-test script

**Dependencies added:** `zod`

**Status:** COMPLETED

---

## Phase 3 — Frontend Updates

### User request (with screenshots)

> Confirm password field not visible. Fix and restart preview.

### Issue

Register form still had old 2-field layout (identifier + password) from demo auth.

### Fix

Rewrote `src/components/auth/auth-form.tsx`:

- **Register:** username, email, password, confirm password
- **Login:** email, password
- Replaced localStorage auth with real API calls via `src/lib/auth-client.ts`
- Redirect to `/question-bank` on success
- Inline server error display

**Status:** COMPLETED

---

## Bug fix — Registration 500 + silent UI failure

### User report

1. First Register click → 500, **no UI error**
2. Second click → 400 "email already registered"

### Root cause

User row was created in D1, then session cookie creation failed because **`SESSION_SECRET` was missing/empty** in `.dev.vars`.

### Fixes applied

1. **`assertSessionConfigured()`** runs *before* DB insert in register route (prevents orphan users)
2. Clearer API error when session is misconfigured
3. Auth form always surfaces `result.error` from API — no silent failures
4. Added `SESSION_SECRET` placeholder to `.dev.vars.example`

### SESSION_SECRET setup

**Local (`.dev.vars`):**

```
NEXTJS_ENV=development
SESSION_SECRET=<non-empty secret>
```

**Production:**

```powershell
npx wrangler secret put SESSION_SECRET
```

**Status:** Fixed locally; production secret verified present before final deploy.

---

## Phase 4 — Testing

### User request

> Write and run tests for all 6 scenarios. Update PRD status and acceptance criteria.

### Test framework

- Vitest + Testing Library + jsdom
- `vitest.config.ts`, `src/test/setup.ts`

### Results — `npm test` (11/11 passed)

| # | Test Case | Result | Test File |
|---|-----------|--------|-----------|
| 1 | Register with valid input | **PASS** | `register/route.test.ts`, `auth-form.test.tsx` |
| 2 | Register with mismatched passwords | **PASS** | `register/route.test.ts`, `auth-form.test.tsx` |
| 3 | Register with duplicate email | **PASS** | `register/route.test.ts` |
| 4 | Login with valid credentials | **PASS** | `login/route.test.ts`, `auth-form.test.tsx` |
| 5 | Login with invalid credentials | **PASS** | `login/route.test.ts`, `auth-form.test.tsx` |
| 6 | Access `/question-bank` without session | **PASS** | `question-bank-landing.test.tsx` |

**Additional coverage (also passing):**

- Duplicate username → 400
- Wrong password → generic error, no redirect
- Non-existent email → generic error, no redirect

**Status:** COMPLETED

---

## Phase 5 — Final Review & Deploy (first attempt)

### User request

> Review against PRD acceptance criteria. Update PRD. Build and deploy. Return live URL.

### Build output

```
Route (app)
┌ ○ /
├ ƒ /api/login, /api/logout, /api/register, /api/session
└ ○ /question-bank
```

### First deploy

- **URL:** `https://ai-sprint-demo1.saroja-vaddireddy-dev.workers.dev`
- **Version ID:** `2677d00c-b8d2-4ad4-a999-551f9b8ab640`

### Production gaps found

| Item | Status |
|------|--------|
| Remote D1 migration | Later confirmed applied |
| `SESSION_SECRET` on Cloudflare | Later confirmed set |
| Live register API | **Failed** — see production fix below |

---

## Production bug — "Server error" on registration

### User report (Aug 31, with screenshot)

> Registering new user shows "Server error." repeatedly.

### Diagnosis (`wrangler tail`)

```
POST /api/register failed:
NotSupportedError: Pbkdf2 failed: iteration counts above 100000 are not supported (requested 600000).
```

### Root cause

Password hashing used **600,000 PBKDF2 iterations**. Cloudflare Workers Web Crypto **caps PBKDF2 at 100,000 iterations**.

Local `npm run preview` (Node crypto) allowed 600k; production Workers runtime rejected it.

### Fix

```typescript
// src/lib/auth/password.ts
const PBKDF2_ITERATIONS = 100_000;
```

### Redeploy

- **Version ID:** `85af6eab-0ec9-4a0f-ab69-22b8d12e052c`
- Tests re-run: **11/11 passed**

### Final production smoke test

| Scenario | HTTP | Response |
|----------|------|----------|
| Register new user | 200 | `{"ok":true,"userId":2}` + `auth_session` cookie |
| Login | 200 | `{"ok":true}` |
| Duplicate email register | 400 | `"Email already registered."` |

Smoke-test user row removed from remote D1 so user could register with their own password.

**Status:** COMPLETED

---

## Acceptance criteria — final review

| Criterion | Met? | Notes |
|-----------|------|-------|
| Registration creates D1 row | **Yes** | Local + remote verified after migration |
| Passwords stored hashed | **Yes** | PBKDF2-SHA256 at 100k iterations (Workers limit) |
| Register form: 4 fields | **Yes** | username, email, password, confirm password |
| Password mismatch blocked | **Yes** | Client + server |
| Login against DB (not browser storage) | **Yes** | Real APIs + D1 |
| Invalid login → error, no redirect | **Yes** | Generic message |
| Success → `/question-bank` | **Yes** | Register and login |
| `/quiz` removed | **Yes** | Not in build output |
| All test cases pass | **Yes** | 11/11 |

### Known limitations (unchanged)

- Login is **email-only** (not username)
- `/question-bank` guard is **client-side** (`useEffect` + `/api/session`)
- No rate limiting, password reset, email verification, or social login
- OpenNext on Windows: stop `npm run preview` before deploy to avoid `EBUSY`

---

## Final file structure (auth sprint)

```
src/
├── app/
│   ├── page.tsx                         # Auth homepage
│   ├── question-bank/page.tsx             # Post-login landing
│   └── api/
│       ├── register/route.ts (+ test)
│       ├── login/route.ts (+ test)
│       ├── logout/route.ts
│       └── session/route.ts
├── components/
│   ├── auth/auth-form.tsx (+ test)
│   └── question-bank/question-bank-landing.tsx (+ test)
└── lib/
    ├── auth-client.ts
    ├── cloudflare-env.ts
    ├── auth/
    │   ├── schemas.ts
    │   ├── password.ts
    │   ├── session.ts
    │   └── api-response.ts
    └── services/users.ts

migrations/0001_create_users_table.sql
scripts/test-auth-api.ps1
vitest.config.ts
wrangler.jsonc
.dev.vars.example
```

---

## Commands reference

```powershell
# Local D1 migration
npx wrangler d1 migrations apply ai-sprint-demo1-db --local

# Remote D1 migration (owner)
npx wrangler d1 migrations apply ai-sprint-demo1-db --remote

# Local Workers preview (uses D1 + .dev.vars)
npm run preview

# Tests
npm test

# Deploy
npm run deploy
```

---

## Git commit (Aug 31)

```
git add .
git commit -m "Sprint 1 fix: real D1-backed auth with username, confirm-password, session protection"
git push
```

---

## Troubleshooting summary

| Problem | Cause | Fix |
|---------|-------|-----|
| Register 500, silent UI | Missing `SESSION_SECRET` | Add to `.dev.vars`; `wrangler secret put` for prod |
| Register 500 on production | PBKDF2 600k iterations | Reduce to 100k in `password.ts` |
| Second register says email exists | Orphan user from failed first attempt | `assertSessionConfigured()` before insert |
| Deploy EBUSY | Preview locking `.open-next` | Stop preview, delete `.open-next`, redeploy |
| TS error `identifier` | Union type from register/login ternary | Split branches in `auth-form.tsx` |
