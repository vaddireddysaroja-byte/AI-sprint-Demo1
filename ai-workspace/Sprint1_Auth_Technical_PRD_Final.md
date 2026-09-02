Date created: [25/08/2026]

Date last modified: [01/09/2026 — server-side /question-bank session protection]



# Sprint 1 Auth - Technical PRD

In Scope

User registration (create account) with username, email, password, and confirm password

User login (authenticate existing account)

Password confirmation field with cross-validation on registration

Persistent user storage in a D1 database (not browser storage)

Backend API endpoints to support registration and login

Session handling after successful login

Redirect to /question-bank after successful login (existing behavior, keep as-is)

Basic authentication test cases

====

Out of Scope



Password reset / forgot password flow

Email verification

Social login (Google, GitHub, etc.)

MCQ/quiz question type (Sprint 2 scope, not this sprint)

Admin or user management dashboard

Rate limiting / brute-force protection (note as a known limitation, not built this sprint)

====

User Flow

User visits the homepage (/) and sees a login/registration form

New user clicks "Register", enters username, email, password, and confirm password

Frontend validates username (required), email format, password minimum length, and that password and confirm password match before submitting

On submit, frontend calls the backend registration API

Backend validates input, checks for existing username or email, hashes the password, and stores the new user in the D1 database

On success, user is logged in and redirected to /question-bank

Returning user clicks "Login", enters email/username and password

Frontend calls the backend login API

Backend verifies credentials against the database

On success, a session is created and user is redirected to /question-bank

On failure (wrong password, user not found, invalid input), a clear error message is shown — no redirect

=====

Technical Requirements

Database Schema



Table: users

| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER (Primary Key, Autoincrement) | |
| username | TEXT (Unique, Not Null) | Display/login identifier; must be unique |
| email | TEXT (Unique, Not Null) | Valid email format; must be unique |
| password_hash | TEXT (Not Null) | Never store plain text passwords |
| created_at | TEXT (Not Null) | ISO timestamp |

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```



Session storage decision: Using a signed session cookie (not a separate sessions table) for simplicity within this sprint's scope. No sessions table will be created unless server-side session persistence becomes a requirement later.



API Endpoints

Endpoint	Method	Purpose

/api/register	POST	Accepts username, email, password, confirmPassword. Validates, hashes password, creates user record.

/api/login	POST	Accepts email, password. Verifies credentials, creates session.

/api/logout	POST	Clears session (if applicable)

/api/session	GET	Returns current logged-in user status (used to protect /question-bank)

#### POST /api/register

**Request Body:**

```json
{
  "username": "string",
  "email": "user@example.com",
  "password": "string",
  "confirmPassword": "string"
}
```

**Response:**

- Success (200): { "ok": true, "userId": "number" } (session cookie set; user redirected to /question-bank)
- Error (400): Validation error — e.g. passwords don't match, invalid email format, username already taken, email already registered
- Error (500): Server error

#### POST /api/login

**Request Body:**

```json

{

  "email": "user@example.com",

  "password": "string"

}

```



**Response:**

- Success (200): { "ok": true }  (session cookie set)

- Error (400): "Invalid email or password" (generic, does not reveal which field was wrong)

- Error (500): Server error

#### POST /api/logout

**Request Body:** none (uses session cookie)



**Response:**

- Success (200): { "ok": true }

#### GET /api/session

**Request Body:** none (uses session cookie)



**Response:**

- Success (200): { "ok": true, "user": { "id": "number", "username": "string", "email": "string" } }

- Error (401): { "ok": false } — no valid session

User Interface Requirements

#### Login/Register Page (/)

- Toggle between Login and Register views

- Register view fields: username, email, password, confirm password
- Login view fields: email, password
- Client-side validation: username required; valid email format; password minimum 8 characters; confirm password must match password
- Server-side validation errors displayed inline (e.g. "username already taken", "email already registered", "invalid credentials")

- On successful login/register, redirect to /question-bank



#### Question Bank Landing Page (/question-bank)

- Only accessible to authenticated users (redirect to / if no valid session)

- Placeholder content confirming successful login (detailed question bank features are out of scope for this sprint)

Validation Rules

Username must be provided, non-empty, and unique in the database

Email must be a valid email format and unique in the database

Password must be at least 8 characters

Confirm password must exactly match password on registration — block submission otherwise with a clear inline error

Login must return a generic error on failure (e.g. "Invalid email or password") — do not reveal whether the email exists, for basic security hygiene

Implementation Phases

Phase 1: Database Schema - COMPLETED



Objective: Set up persistent user storage to replace browser-storage-only auth.



Tasks:



Create the users table migration exactly as specified above

Run migration locally and verify the table exists

Confirm indexes are applied



Deliverables:



Migration file created

Table verified in local D1 instance

Phase 2: Backend APIs - COMPLETED



Objective: Build real authentication APIs backed by the database.



Tasks:



Build /api/register with password hashing and confirm-password validation

Build /api/login with credential verification and session cookie creation

Build /api/logout and /api/session

Test each endpoint manually (curl/Postman) before connecting the UI



Deliverables:



Working, tested API endpoints

Manual test results documented

Phase 3: Frontend Updates - COMPLETED



Objective: Connect existing login/register UI to the real backend APIs, and add confirm-password field.



Tasks:



Add username and confirm-password fields to registration form with cross-validation

Replace localStorage/sessionStorage calls with real API calls

Display server-side validation errors inline

Confirm redirect to /question-bank works with real session data

Confirm /question-bank redirects unauthenticated users back to /



Deliverables:



Updated auth form connected to real APIs

Confirm-password and username validation working

Phase 4: Testing - COMPLETED



Objective: Verify the full authentication flow works correctly.



Tasks:



Run all test cases listed in the Test Plan section below

Document pass/fail results

Fix any failures with targeted, scoped fixes



Deliverables:



Test cases executed and passing

Documented results

Phase 5: Final Review & Deploy - COMPLETED



Objective: Deploy the corrected authentication feature and finalize documentation.



Tasks:



Deploy after each phase (not just once at the end) — see Deployment Checkpoints

Run final smoke test on the deployed URL

Update this PRD's Current Status and Known Limitations sections



Deliverables:



Deployed authentication app on Cloudflare Workers (live URL below)

Updated PRD reflecting final state

**Deployed URL:** `https://ai-sprint-demo1.saroja-vaddireddy-dev.workers.dev`

**Production auth prerequisites (owner action required):**

1. Apply remote D1 migration: `npx wrangler d1 migrations apply ai-sprint-demo1-db --remote`
2. Set production secret: `npx wrangler secret put SESSION_SECRET`
3. Re-test register/login on the live URL after both steps



Status Markers: COMPLETED - Phase is done | IN PROGRESS - Currently working on this | PLANNED - Not started yet



Technical Implementation Details

### Routes

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Static page | Login/Register form (`AuthForm`) |
| `/question-bank` | Server page | Post-login landing; server-side session guard via `getSessionUser()` |
| `/api/register` | Dynamic API | Create user in D1, set session cookie |
| `/api/login` | Dynamic API | Verify credentials, set session cookie |
| `/api/logout` | Dynamic API | Clear session cookie |
| `/api/session` | Dynamic API | Return current user or 401 |

No `/quiz` route exists (removed; out of scope).

### Key Files

**Frontend**

- `src/app/page.tsx` — Homepage; renders `AuthForm`
- `src/app/question-bank/page.tsx` — Server component; validates session and redirects before render
- `src/components/auth/auth-form.tsx` — Login/Register toggle, client validation, API calls
- `src/components/auth/auth-form.test.tsx` — Form validation and submit behavior tests
- `src/components/question-bank/question-bank-landing.tsx` — Welcome UI and logout (receives username from server)
- `src/components/question-bank/question-bank-landing.test.tsx` — Authenticated landing UI test
- `src/lib/auth-client.ts` — Fetch wrappers for auth APIs (`credentials: "include"`)

**Backend / auth library**

- `src/app/api/register/route.ts` — Registration handler
- `src/app/api/register/route.test.ts` — Register API tests (validation, duplicates, hashing)
- `src/app/api/login/route.ts` — Login handler
- `src/app/api/login/route.test.ts` — Login API tests (success, wrong password, unknown email)
- `src/app/api/logout/route.ts` — Logout handler
- `src/app/api/session/route.ts` — Session read handler
- `src/lib/auth/schemas.ts` — Zod schemas (register/login, confirm-password refine)
- `src/lib/auth/password.ts` — PBKDF2-SHA256 hash and verify (`pbkdf2-sha256$...` format)
- `src/lib/auth/session.ts` — Signed httpOnly `auth_session` cookie (7-day expiry); requires `SESSION_SECRET`
- `src/lib/auth/server-session.ts` — Server-side session lookup (`cookies()` + D1 user load)
- `src/lib/auth/server-session.test.ts` — Server session guard tests (no cookie, invalid token, valid user)
- `src/lib/auth/api-response.ts` — JSON response + Set-Cookie helpers
- `src/lib/services/users.ts` — D1 user queries via `getCloudflareContext().env.DB`
- `src/lib/cloudflare-env.ts` — Typed Cloudflare env including `SESSION_SECRET`

**Database & config**

- `migrations/0001_create_users_table.sql` — `users` table + indexes
- `wrangler.jsonc` — Worker name `ai-sprint-demo1`, D1 binding `DB` → `ai-sprint-demo1-db`
- `.dev.vars` — Local `SESSION_SECRET` (gitignored)
- `.dev.vars.example` — Placeholder for required secrets

**Testing & scripts**

- `vitest.config.ts` — Vitest config
- `src/test/setup.ts` — Test setup (jsdom, mocks)
- `scripts/test-auth-api.ps1` — Manual API smoke-test script for local preview

### Implementation Notes

- **Password hashing:** Web Crypto PBKDF2-SHA256 with per-user salt; stored as `pbkdf2-sha256$<iterations>$<salt>$<hash>`.
- **Session:** HMAC-signed payload in an httpOnly, `SameSite=Lax`, `Secure` (production) cookie — no sessions table.
- **Register flow:** Validates `SESSION_SECRET` is configured *before* inserting a user row (prevents orphan users on session failure).
- **Login:** Email + password only (username is stored but not accepted for login).
- **Question bank protection:** Server-side — `src/app/question-bank/page.tsx` calls `getSessionUser()` and `redirect("/")` before rendering any client content. Unauthenticated users never see the landing page.
- **Error handling:** Generic "Invalid email or password." on login failure; specific messages for registration validation (duplicate username/email, password mismatch).
- **Dependencies added:** `zod`; Vitest + `@testing-library/react` + `jsdom` (dev).

### Build Output (31/08/2026)

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/login
├ ƒ /api/logout
├ ƒ /api/register
├ ƒ /api/session
└ ○ /question-bank
```

`npm run build` — succeeded  
`npm test` — 11/11 passed (4 files)  
`npm run deploy` — succeeded (Version ID: `2677d00c-b8d2-4ad4-a999-551f9b8ab640`)



Acceptance Criteria (Definition of Done)

Reviewed 01/09/2026 against implemented code, local D1, automated tests, and production deploy.

- [x] Registration creates a real row in the D1 users table (verified by querying the database directly)
  - Verified locally and on remote D1
- [x] Passwords are stored hashed, never in plain text
  - PBKDF2-SHA256 at 100k iterations (Cloudflare Workers limit) in `src/lib/auth/password.ts`
- [x] Registration form includes username, email, password, and confirm password fields
- [x] Registration form blocks submission if password and confirm password don't match
  - Client-side block + Zod `refine` on server
- [x] Login successfully authenticates against the database record (not browser storage)
  - No localStorage/sessionStorage auth; all calls go to `/api/login` + D1
- [x] Invalid login attempts show a clear error and do not redirect
  - Generic "Invalid email or password." message
- [x] Successful login redirects to /question-bank
  - Also redirects after successful registration
- [x] /quiz route remains removed (out of Sprint 1/2 scope per prior feedback)
  - Confirmed absent from build output
- [x] `/question-bank` is protected server-side for unauthenticated users
  - `getSessionUser()` in server component; redirect before render; covered by `server-session.test.ts`
- [x] All test cases below pass
  - `npm test` — 15/15 passed (5 files, as of 01/09/2026)

Success Metrics



Metric	Target	How Measured

Registration success rate	100% for valid, unique inputs	Manual test pass/fail

Password mismatch blocked	100% blocked client-side before API call	Manual test pass/fail

Invalid login rejected	100% of bad credentials rejected with generic error	Manual test pass/fail

Unauthorized access blocked	100% of unauthenticated /question-bank visits redirected	Manual test pass/fail

Test Plan

| # | Test Case | Expected Result | Result | Automated Test |
|---|-----------|-------------------|--------|----------------|
| 1 | Register with valid, unique username + unique email + matching passwords | Account created, user redirected to /question-bank | **PASS** | `src/app/api/register/route.test.ts`, `src/components/auth/auth-form.test.tsx` |
| 2 | Register with mismatched password/confirm password | Blocked with inline error, no API call made | **PASS** | `src/app/api/register/route.test.ts`, `src/components/auth/auth-form.test.tsx` |
| 3 | Register with an email that already exists | Backend returns error, shown to user | **PASS** | `src/app/api/register/route.test.ts` |
| 4 | Login with correct credentials | User authenticated, redirected to /question-bank | **PASS** | `src/app/api/login/route.test.ts`, `src/components/auth/auth-form.test.tsx` |
| 5 | Login with invalid credentials (wrong password or unknown email) | Clear error shown, no redirect | **PASS** | `src/app/api/login/route.test.ts`, `src/components/auth/auth-form.test.tsx` |
| 6 | Access /question-bank without being logged in | Redirected to login / blocked before page renders | **PASS** | `src/lib/auth/server-session.test.ts` |

**Test run:** `npm test` — 5 files, 15 tests, all passed (01/09/2026)

Additional test plan coverage (also passing):

| Test Case | Expected Result | Result |
|-----------|-----------------|--------|
| Register with a username that already exists | Backend returns error, shown to user | **PASS** |
| Login with incorrect password | Clear error shown, no redirect | **PASS** |
| Login with non-existent email | Clear error shown, no redirect | **PASS** |

Dependencies



External Dependencies

Cloudflare D1 - persistent storage for user records

Internal Dependencies

shadcn/ui components - form UI consistency

Existing Next.js routing - / and /question-bank pages

Risks and Mitigation

Technical Risks

Risk: Storing plaintext passwords

Mitigation: Hash passwords server-side before storing (e.g. using a standard hashing library) — never store or log raw passwords

Risk: Session token vulnerable to XSS if stored insecurely

Mitigation: Use an httpOnly, signed session cookie rather than exposing tokens to client-side JS

User Experience Risks

Risk: Vague or overly technical error messages confuse users

Mitigation: Return specific, plain-language error messages from the API (e.g. "Passwords do not match", "Invalid email or password") and display them inline near the relevant field

Deployment Checkpoints

- [x] **Checkpoint 1:** D1 schema/migration deployed and verified remotely
- [x] **Checkpoint 2:** Backend APIs deployed and smoke-tested on production
  - Worker live at `https://ai-sprint-demo1.saroja-vaddireddy-dev.workers.dev`
- [x] **Checkpoint 3:** Frontend deployed (auth form with username + confirm password)
- [x] **Final Checkpoint:** Full end-to-end register/login on live URL verified (after PBKDF2 iteration fix)

Troubleshooting Guide

TypeScript error on auth result type



Problem: Build fails with "Property 'identifier' does not exist on type..." Cause: Code referenced a field not present in the actual result type returned by the auth function Solution: Align the result type definition with the actual API response shape, or correct the property being accessed Code Reference: src/components/auth/auth-form.tsx:98



Registration returns 500 but user appears on retry as "email already registered"

**Problem:** First registration returns 500 with no UI message; second attempt says email exists.

**Cause:** User row was created in D1, but session cookie creation failed because `SESSION_SECRET` was missing or empty in `.dev.vars`.

**Solution:** Set a non-empty `SESSION_SECRET` in `.dev.vars`, restart preview, and log in with the existing account (or delete the test row locally).

**Code Reference:** `src/lib/auth/session.ts`, `src/app/api/register/route.ts`

---

Known Limitations / Notes

- **Password reset, email verification, and social login** are out of scope for Sprint 1.
- **Rate limiting / brute-force protection** is not implemented.
- **Login uses email + password only** — username cannot be used to log in (PRD user flow still mentions "email/username" for login; implementation is email-only).
- **Session storage** uses a signed httpOnly cookie (no sessions table). Sessions expire after 7 days.
- **`SESSION_SECRET` is required** in `.dev.vars` for local preview and via `wrangler secret put SESSION_SECRET` for production.
- **OpenNext on Windows** may have file-lock issues during build/deploy; stop `npm run preview` before deploying. WSL is recommended.
- **Automated tests** use Vitest with mocked D1/API boundaries; full manual flow verified on `npm run preview` and production.

---

Current Status

**Last Updated**: 01/09/2026

**Current Phase**: All phases complete (Phase 5 — Final Review & Deploy)

**Status**: COMPLETED — live auth working on production

**Live URL:** https://ai-sprint-demo1.saroja-vaddireddy-dev.workers.dev

**Completed:**

- Phase 1: Database Schema — local and remote migrations applied
- Phase 2: Backend APIs — register, login, logout, session
- Phase 3: Frontend Updates — auth form wired to real APIs
- Phase 4: Testing — 15/15 automated tests passing
- Phase 5: Final Review & Deploy — PRD updated, build succeeded, deployed to Cloudflare Workers
- **Post-sprint fix (01/09/2026):** Server-side session protection on `/question-bank` via `getSessionUser()` in page server component



Instructions for AI: When working with this PRD:



Start by reading the Problem/Hypothesis and In Scope / Out of Scope sections to understand intent and boundaries — do not build out-of-scope items

Update phase status markers as work progresses

Add implementation details under "Technical Implementation Details" as code is written

Mark acceptance criteria as complete only when verified working, not just written

Add troubleshooting entries when bugs are found and fixed

Keep all sections current — remove outdated information

Use code references format: filepath:line-number when citing code

Notes for AI Agents
