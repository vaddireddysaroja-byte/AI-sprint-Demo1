Date created: [03/09/2026]

Date last modified: [03/09/2026 — Phase 1 database schema complete]



# Sprint 2 MCQ - Technical PRD

In Scope

Create, read, update, and delete multiple choice questions (MCQs)

Persistent MCQ, choice, and attempt storage in the D1 database

Backend API endpoints for MCQ CRUD and recording attempts

MCQ service layer in `src/lib/services/` (same pattern as `users.ts`)

Question Bank landing page (`/question-bank`) replaced with an MCQ table listing all questions for the signed-in user

Create / edit MCQ page with Save and Cancel actions

Row actions via a vertical-ellipsis dropdown: Edit, Preview, Delete

Preview of an MCQ (read-only student view)

Recording attempts against an MCQ (selected choice + correct/incorrect)

Test-driven development: Vitest unit tests for services, API routes, and key UI components

shadcn/ui components: `table`, `button`, and additional components as needed (e.g. `dropdown-menu`, `dialog` for delete confirmation)

Authentication required for all MCQ pages and APIs (reuse existing session from Sprint 1)

====

Out of Scope

Non–multiple-choice question types (true/false, short answer, essay, etc.)

Sharing MCQs between users or a public question bank

Attempt analytics dashboard or reporting UI

Bulk import/export of questions

Question categories, tags, or folders

Timer-based quizzes or multi-question quiz sessions

Rate limiting on attempt recording

Admin role or cross-user MCQ management

====

User Flow

User logs in (existing Sprint 1 flow) and is redirected to `/question-bank`

Question Bank page shows a table of all MCQs created by the signed-in user, with columns: **Name**, **Question**, and **Actions**

User clicks **Create question** and is taken to `/question-bank/mcq/new`

On the create/edit page, user enters:
- **Name** — short identifier for the table (e.g. "Photosynthesis basics")
- **Question** — the full question prompt shown to the student
- **Choices** — two choices shown by default; user may add up to six total; exactly one choice must be marked as correct

User clicks **Save** — frontend validates, calls the API, and returns to `/question-bank` on success

User clicks **Cancel** — returns to `/question-bank` without saving

From the table row **Actions** menu (vertical ellipsis):
- **Edit** — navigates to `/question-bank/mcq/[id]/edit` with the form pre-filled
- **Preview** — navigates to `/question-bank/mcq/[id]/preview` (read-only student view; user can select a choice and submit an attempt)
- **Delete** — confirms deletion, calls delete API, removes the row from the table

On Preview, user selects a choice and submits; the app records an attempt (choice selected, correct/incorrect) via the attempts API

=====

Technical Requirements

Database Schema

Table: `mcqs`

| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER (Primary Key, Autoincrement) | |
| name | TEXT (Not Null) | Short display name for the table |
| question | TEXT (Not Null) | Full question prompt |
| created_by | INTEGER (Not Null) | FK → `users.id`; owner of the MCQ |
| created_at | TEXT (Not Null) | ISO timestamp |
| updated_at | TEXT (Not Null) | ISO timestamp; updated on every save |

```sql
CREATE TABLE mcqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  question TEXT NOT NULL,
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_mcqs_created_by ON mcqs(created_by);
```

Table: `mcq_choices`

| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER (Primary Key, Autoincrement) | |
| mcq_id | INTEGER (Not Null) | FK → `mcqs.id` ON DELETE CASCADE |
| choice_text | TEXT (Not Null) | Display text for this option |
| is_correct | INTEGER (Not Null) | 0 or 1; exactly one choice per MCQ must be correct |
| sort_order | INTEGER (Not Null) | Display order (0-based) |

```sql
CREATE TABLE mcq_choices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mcq_id INTEGER NOT NULL,
  choice_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL,
  FOREIGN KEY (mcq_id) REFERENCES mcqs(id) ON DELETE CASCADE
);

CREATE INDEX idx_mcq_choices_mcq_id ON mcq_choices(mcq_id);
```

Table: `mcq_attempts`

| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER (Primary Key, Autoincrement) | |
| mcq_id | INTEGER (Not Null) | FK → `mcqs.id` |
| user_id | INTEGER (Not Null) | FK → `users.id`; who made the attempt |
| choice_id | INTEGER (Not Null) | FK → `mcq_choices.id`; selected choice |
| is_correct | INTEGER (Not Null) | 0 or 1; derived from the selected choice at attempt time |
| created_at | TEXT (Not Null) | ISO timestamp |

```sql
CREATE TABLE mcq_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mcq_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  choice_id INTEGER NOT NULL,
  is_correct INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (mcq_id) REFERENCES mcqs(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (choice_id) REFERENCES mcq_choices(id)
);

CREATE INDEX idx_mcq_attempts_mcq_id ON mcq_attempts(mcq_id);
CREATE INDEX idx_mcq_attempts_user_id ON mcq_attempts(user_id);
```

**Ownership rule:** Users may only list, read, update, and delete MCQs where `created_by` matches their session user ID. Attempt recording is allowed on any MCQ the user can read (own MCQs for this sprint).

**Cascade:** Deleting an MCQ deletes its choices (CASCADE). Attempts are retained for audit purposes (no CASCADE on attempts).

API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/mcqs` | GET | List all MCQs for the signed-in user (id, name, question, created_at, updated_at) |
| `/api/mcqs` | POST | Create a new MCQ with choices |
| `/api/mcqs/[id]` | GET | Get a single MCQ with its choices |
| `/api/mcqs/[id]` | PUT | Update an MCQ and replace its choices |
| `/api/mcqs/[id]` | DELETE | Delete an MCQ (and choices via CASCADE) |
| `/api/mcqs/[id]/attempts` | POST | Record an attempt (selected choice_id) |

All endpoints require a valid session (401 if unauthenticated). Mutations on MCQs require ownership (403 if `created_by` does not match session user).

#### GET /api/mcqs

**Request:** session cookie

**Response:**

- Success (200): `{ "ok": true, "mcqs": [{ "id": number, "name": string, "question": string, "createdAt": string, "updatedAt": string }] }`
- Error (401): `{ "ok": false }`

#### POST /api/mcqs

**Request Body:**

```json
{
  "name": "string",
  "question": "string",
  "choices": [
    { "choiceText": "string", "isCorrect": true },
    { "choiceText": "string", "isCorrect": false }
  ]
}
```

**Response:**

- Success (201): `{ "ok": true, "mcqId": number }`
- Error (400): Validation error (missing fields, fewer than 2 choices, more than 6 choices, zero or multiple correct answers, empty choice text)
- Error (401): Not authenticated
- Error (500): Server error

#### GET /api/mcqs/[id]

**Response:**

- Success (200): `{ "ok": true, "mcq": { "id", "name", "question", "createdAt", "updatedAt", "choices": [{ "id", "choiceText", "isCorrect", "sortOrder" }] } }`
- Error (401): Not authenticated
- Error (403): MCQ belongs to another user
- Error (404): MCQ not found

#### PUT /api/mcqs/[id]

**Request Body:** same shape as POST

**Response:**

- Success (200): `{ "ok": true }`
- Error (400): Validation error
- Error (401): Not authenticated
- Error (403): MCQ belongs to another user
- Error (404): MCQ not found

#### DELETE /api/mcqs/[id]

**Response:**

- Success (200): `{ "ok": true }`
- Error (401): Not authenticated
- Error (403): MCQ belongs to another user
- Error (404): MCQ not found

#### POST /api/mcqs/[id]/attempts

**Request Body:**

```json
{
  "choiceId": number
}
```

**Response:**

- Success (201): `{ "ok": true, "isCorrect": boolean }`
- Error (400): Invalid or missing choiceId; choice does not belong to this MCQ
- Error (401): Not authenticated
- Error (403): MCQ belongs to another user
- Error (404): MCQ not found

User Interface Requirements

#### Question Bank Page (`/question-bank`)

- Server-side session guard (existing `getSessionUser()` pattern)
- Header with welcome message, **Create question** button, and **Log out** button
- shadcn `Table` listing MCQs for the signed-in user
- Columns: **Name**, **Question** (truncated if long), **Actions**
- **Actions** column: vertical-ellipsis (`MoreVertical` icon) opening a shadcn `DropdownMenu` with **Edit**, **Preview**, **Delete**
- Empty state when no MCQs exist, with prompt to create the first question
- Delete uses a confirmation `Dialog` before calling the API

#### Create / Edit MCQ Page (`/question-bank/mcq/new`, `/question-bank/mcq/[id]/edit`)

- Server-side session guard
- Form fields: **Name** (input), **Question** (textarea or multi-line input)
- **Choices** section:
  - Two choice rows shown by default on create
  - Each row: choice text input, radio button (or single-select) to mark as correct, remove button (disabled when only two choices remain)
  - **Add choice** button (disabled at six choices)
- **Save** — validates client-side, submits to POST or PUT API, redirects to `/question-bank` on success; inline errors on failure
- **Cancel** — navigates back to `/question-bank` without saving
- Edit page loads existing MCQ data from GET `/api/mcqs/[id]` (or server-fetched in page component)

#### Preview Page (`/question-bank/mcq/[id]/preview`)

- Server-side session guard
- Read-only display of question name and prompt
- Lists choices as selectable options (radio group)
- **Submit answer** button records attempt via POST `/api/mcqs/[id]/attempts`
- Shows feedback after submit: correct or incorrect (no answer reveal beyond feedback for this sprint)
- **Back** link to `/question-bank`

Validation Rules

| Rule | Where enforced |
|------|----------------|
| Name is required, non-empty (trimmed) | Client + server (Zod) |
| Question is required, non-empty (trimmed) | Client + server (Zod) |
| Minimum 2 choices, maximum 6 choices | Client + server (Zod) |
| Each choice text is required, non-empty (trimmed) | Client + server (Zod) |
| Exactly one choice must be marked correct | Client + server (Zod) |
| Session required for all MCQ pages and APIs | Server |
| User may only mutate MCQs they created (`created_by`) | Server (service + route) |
| `choiceId` on attempt must belong to the specified MCQ | Server |
| Delete requires confirmation in UI | Client |

Implementation Phases

Phase 1: Database Schema — COMPLETED

Objective: Add MCQ, choice, and attempt tables to D1.

Tasks:

- Create migration `0002_create_mcq_tables.sql` with all three tables and indexes
- Apply migration locally and verify tables exist
- Confirm foreign keys and CASCADE behavior

Deliverables:

- Migration file created (`migrations/0002_create_mcq_tables.sql`)
- Tables verified in local D1 instance (`mcqs`, `mcq_choices`, `mcq_attempts`)
- Indexes verified: `idx_mcqs_created_by`, `idx_mcq_choices_mcq_id`, `idx_mcq_attempts_mcq_id`, `idx_mcq_attempts_user_id`
- CASCADE verified: deleting an MCQ removes its choices; attempts block MCQ delete via FK (by design — service layer must delete attempts first or handle constraint in Phase 2)

Phase 2: MCQ Service Layer — COMPLETED

Objective: Centralize D1 queries for MCQs, choices, and attempts.

Tasks:

- Create `src/lib/services/mcqs.ts` following `users.ts` patterns (`getDb()`, prepared statements, numbered placeholders)
- Implement: `listMcqsByUser`, `findMcqById`, `createMcqWithChoices`, `updateMcqWithChoices`, `deleteMcq`, `recordAttempt`
- Write Vitest tests for service functions (mock D1)

Deliverables:

- `src/lib/services/mcqs.ts`
- `src/lib/services/mcqs.test.ts` — 14 tests passing
- `src/lib/services/mcqs.test-helpers.ts` — in-memory D1 mock for service tests

Phase 3: Backend APIs — COMPLETED

Objective: Build REST endpoints backed by the MCQ service.

Tasks:

- Create Zod schemas in `src/lib/mcq/schemas.ts`
- Build route handlers under `src/app/api/mcqs/`
- Enforce session and ownership on every handler
- Write Vitest tests for each endpoint (validation, auth, ownership, success paths)

Deliverables:

- `src/lib/mcq/schemas.ts`, `serializers.ts`, `require-session.ts`, `access.ts`
- `src/app/api/mcqs/route.ts` — GET list, POST create
- `src/app/api/mcqs/[id]/route.ts` — GET, PUT, DELETE
- `src/app/api/mcqs/[id]/attempts/route.ts` — POST attempt
- API route tests — 12 tests passing across 3 test files

Phase 4: Frontend — Question Bank Table — COMPLETED

Objective: Replace placeholder landing page with MCQ table and actions.

Tasks:

- Add shadcn `dropdown-menu` component (`npx shadcn@latest add @shadcn/dropdown-menu`)
- Create `McqTable` component with table, create button, row actions dropdown, delete confirmation dialog
- Update `/question-bank` page to render the table (server-fetch MCQs via `listMcqsByUser`)
- Write component tests for table rendering, empty state, and action menu

Deliverables:

- `src/components/ui/dropdown-menu.tsx` — shadcn dropdown
- `src/components/question-bank/mcq-table.tsx` + `mcq-table.test.tsx`
- `src/lib/mcq-client.ts` — client fetch helpers for list/delete
- Updated `question-bank/page.tsx` and `question-bank-landing.tsx`
- Component tests passing (4 tests across 2 files)

Phase 5: Frontend — Create / Edit / Preview — PLANNED

Objective: Build MCQ form and preview pages.

Tasks:

- Create `/question-bank/mcq/new` and `/question-bank/mcq/[id]/edit` pages with shared `McqForm` component
- Create `/question-bank/mcq/[id]/preview` page with attempt submission
- Wire Save/Cancel, add/remove choices, correct-answer selection
- Write form validation and submit tests

Deliverables:

- Create, edit, and preview pages working end-to-end
- Component tests passing

Phase 6: Integration Testing & Deploy — PLANNED

Objective: Verify full MCQ flow and deploy.

Tasks:

- Run full test suite (`npm test`)
- Run `npm run lint` and `npm run build`
- Manual end-to-end test: create → list → edit → preview (attempt) → delete
- Deploy and smoke-test on production (owner applies remote migration)

Deliverables:

- All tests passing
- Build succeeded
- PRD status updated

Status Markers: COMPLETED — Phase is done | IN PROGRESS — Currently working on this | PLANNED — Not started yet

Technical Implementation Details

### Routes

| Route | Type | Purpose |
|-------|------|---------|
| `/question-bank` | Server page | MCQ table; session guard |
| `/question-bank/mcq/new` | Server page | Create MCQ form |
| `/question-bank/mcq/[id]/edit` | Server page | Edit MCQ form |
| `/question-bank/mcq/[id]/preview` | Server page | Preview MCQ and record attempts |
| `/api/mcqs` | Dynamic API | List (GET) and create (POST) |
| `/api/mcqs/[id]` | Dynamic API | Read (GET), update (PUT), delete (DELETE) |
| `/api/mcqs/[id]/attempts` | Dynamic API | Record attempt (POST) |

### Key Files (planned)

**Frontend**

- `src/app/question-bank/page.tsx` — Session guard; renders MCQ table
- `src/app/question-bank/mcq/new/page.tsx` — Create MCQ page
- `src/app/question-bank/mcq/[id]/edit/page.tsx` — Edit MCQ page
- `src/app/question-bank/mcq/[id]/preview/page.tsx` — Preview / attempt page
- `src/components/question-bank/mcq-table.tsx` — Table, dropdown actions, delete dialog
- `src/components/question-bank/mcq-table.test.tsx`
- `src/components/question-bank/mcq-form.tsx` — Shared create/edit form
- `src/components/question-bank/mcq-form.test.tsx`
- `src/components/question-bank/mcq-preview.tsx` — Preview and attempt UI
- `src/components/question-bank/mcq-preview.test.tsx`
- `src/lib/mcq-client.ts` — Fetch wrappers for MCQ APIs (`credentials: "include"`)

**Backend / service layer**

- `src/lib/services/mcqs.ts` — D1 MCQ queries
- `src/lib/services/mcqs.test.ts`
- `src/lib/mcq/schemas.ts` — Zod schemas for MCQ create/update/attempt
- `src/app/api/mcqs/route.ts` — GET list, POST create
- `src/app/api/mcqs/route.test.ts`
- `src/app/api/mcqs/[id]/route.ts` — GET, PUT, DELETE
- `src/app/api/mcqs/[id]/route.test.ts`
- `src/app/api/mcqs/[id]/attempts/route.ts` — POST attempt
- `src/app/api/mcqs/[id]/attempts/route.test.ts`

**Database & config**

- `migrations/0002_create_mcq_tables.sql` — `mcqs`, `mcq_choices`, `mcq_attempts` tables

**shadcn components to add**

- `dropdown-menu` — row actions (Edit, Preview, Delete)
- Consider `textarea` if not using a styled `<textarea>` with existing `input` styles

### Implementation Notes

- **Service pattern:** Follow `src/lib/services/users.ts` — `getDb()` from `getCloudflareContext()`, prepared statements with `?1` placeholders, `all()` + `results[0]`.
- **Choice replacement on update:** Delete existing choices for the MCQ and re-insert (within a batch/transaction if D1 supports it; otherwise sequential deletes + inserts with ownership check first).
- **Correct answer:** Enforced as exactly one `is_correct = 1` per MCQ at validation time.
- **Auth reuse:** Use `getSessionUser()` in server pages and session cookie validation in API routes (same as Sprint 1).
- **TDD:** Write failing tests first for each phase; implement until green.
- **No new state library:** Use React state and URL routing; no Redux/Zustand.

Acceptance Criteria (Definition of Done)

- [x] Migration creates `mcqs`, `mcq_choices`, and `mcq_attempts` tables locally
- [x] MCQ service layer covers list, create, read, update, delete, and record attempt
- [x] All API endpoints enforce authentication and ownership
- [x] `/question-bank` shows a table of the signed-in user's MCQs with Name, Question, and Actions columns
- [x] Create button navigates to `/question-bank/mcq/new`
- [x] Row dropdown offers Edit, Preview, and Delete
- [ ] Create/edit form shows 2 choices by default; supports 2–6 choices; exactly one correct answer required
- [ ] Save persists to D1 and returns to question bank; Cancel returns without saving
- [ ] Preview displays the question and records an attempt with correct/incorrect result
- [x] Delete removes the MCQ (and choices) after confirmation
- [x] Unauthenticated users cannot access MCQ pages or APIs
- [x] All automated tests pass (`npm test`) — 46/46 as of 03/09/2026
- [x] `npm run lint` and `npm run build` succeed

Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| MCQ CRUD success | 100% for valid input | Manual + automated tests |
| Validation blocks bad input | 100% (wrong choice count, no correct answer, empty fields) | Automated API + form tests |
| Ownership enforced | 100% of cross-user mutations rejected | API tests |
| Unauthorized access blocked | 100% of unauthenticated requests return 401 | API + server page tests |

Test Plan

| # | Test Case | Expected Result | Result | Automated Test |
|---|-----------|-----------------|--------|----------------|
| 1 | Create MCQ with valid name, question, 2 choices, one correct | MCQ and choices saved; redirect to question bank | | `mcqs.test.ts`, `route.test.ts`, `mcq-form.test.tsx` |
| 2 | Create MCQ with only one choice | Blocked with validation error | | `route.test.ts`, `mcq-form.test.tsx` |
| 3 | Create MCQ with seven choices | Blocked with validation error | | `route.test.ts`, `mcq-form.test.tsx` |
| 4 | Create MCQ with zero correct answers | Blocked with validation error | | `route.test.ts`, `mcq-form.test.tsx` |
| 5 | Create MCQ with two correct answers | Blocked with validation error | | `route.test.ts`, `mcq-form.test.tsx` |
| 6 | List MCQs returns only current user's questions | Other users' MCQs not included | | `mcqs.test.ts`, `route.test.ts` |
| 7 | Edit MCQ updates name, question, and choices | Changes persisted | | `mcqs.test.ts`, `route.test.ts` |
| 8 | Delete MCQ removes question and choices | Row gone from table; choices CASCADE deleted | | `mcqs.test.ts`, `route.test.ts` |
| 9 | Delete another user's MCQ | 403 Forbidden | | `route.test.ts` |
| 10 | Preview: submit correct choice | Attempt recorded; `isCorrect: true` returned | | `route.test.ts`, `mcq-preview.test.tsx` |
| 11 | Preview: submit incorrect choice | Attempt recorded; `isCorrect: false` returned | | `route.test.ts`, `mcq-preview.test.tsx` |
| 12 | Access `/question-bank` without session | Redirected to login | | Existing `server-session.test.ts` |
| 13 | Call MCQ API without session | 401 response | | `route.test.ts` |
| 14 | Table shows empty state when no MCQs | Helpful message and create prompt | | `mcq-table.test.tsx` |
| 15 | Row actions dropdown shows Edit, Preview, Delete | All three options visible | | `mcq-table.test.tsx` |

Dependencies

External Dependencies

- Cloudflare D1 — persistent storage for MCQs, choices, and attempts
- Sprint 1 auth — session cookie, `users` table, `getSessionUser()`

Internal Dependencies

- shadcn/ui — `table`, `button`, `dialog`, `dropdown-menu`, `field`, `input`, `label`
- Existing Next.js App Router and `/question-bank` route
- Vitest + Testing Library (installed in Sprint 1)
- Zod (installed in Sprint 1)

Risks and Mitigation

Technical Risks

| Risk | Mitigation |
|------|------------|
| Orphan choices if update/delete is partial | Check ownership first; use CASCADE on `mcq_choices`; replace choices atomically where possible |
| User edits MCQ while another tab has stale data | Acceptable for sprint; `updated_at` available for future optimistic locking |
| Attempt references deleted choice | Validate `choice_id` belongs to `mcq_id` at attempt time; do not delete choices that have attempts without a strategy — for this sprint, choice replacement on edit deletes old rows (attempts keep historical `choice_id`; may reference deleted choice — acceptable for audit) |

User Experience Risks

| Risk | Mitigation |
|------|------------|
| Accidental delete | Confirmation dialog before delete |
| Unclear which choice is correct on edit | Radio button with label "Correct answer" per row |
| Long question text breaks table layout | Truncate question column with tooltip or max-width |

Deployment Checkpoints

- [x] **Checkpoint 1:** D1 MCQ migration applied locally and verified
- [ ] **Checkpoint 2:** MCQ APIs deployed and smoke-tested (owner applies remote migration)
- [ ] **Checkpoint 3:** Frontend deployed with table, create/edit, preview
- [ ] **Final Checkpoint:** Full end-to-end MCQ flow on live URL

Troubleshooting Guide

_(Add entries here as bugs are found and fixed during implementation.)_

Known Limitations / Notes

- **MCQs are private to the creating user** — no sharing or public bank in this sprint.
- **Preview is owner-only** — the signed-in creator previews their own question; student-facing quiz flow is out of scope.
- **Attempt history UI** — attempts are stored but not displayed in a dashboard this sprint.
- **Remote migrations** — apply with `npx wrangler d1 migrations apply ai-sprint-demo1-db --remote` (owner action, same as Sprint 1).
- **Automated tests** use Vitest with mocked D1/service boundaries; verify full flow with `npm run preview`.

Current Status

**Last Updated**: 03/09/2026

**Current Phase**: Phase 5 — Frontend Create / Edit / Preview (PLANNED)

**Branch**: `feature/mcq-crud`

**Status**: IN PROGRESS — Phases 3 and 4 complete

**Completed:**

- Sprint 1 auth (login, logout, session, `/question-bank` session guard)
- Phase 1: Database Schema — migration `0002_create_mcq_tables.sql` applied locally; tables and indexes verified
- Phase 2: MCQ Service Layer — `src/lib/services/mcqs.ts` with 14 passing service tests
- Phase 3: Backend APIs — `/api/mcqs` routes with auth, ownership, validation, and 12 API tests
- Phase 4: Question Bank Table — `McqTable` with dropdown actions, delete dialog, server-fetched list

Instructions for AI: When working with this PRD:

Start by reading the In Scope / Out of Scope sections to understand intent and boundaries — do not build out-of-scope items

Update phase status markers as work progresses

Add implementation details under "Technical Implementation Details" as code is written

Mark acceptance criteria as complete only when verified working, not just written

Add troubleshooting entries when bugs are found and fixed

Keep all sections current — remove outdated information

Use code references format: filepath:line-number when citing code

Follow TDD: write failing tests first, then implement

Notes for AI Agents

- Reuse `src/lib/services/users.ts` as the service-layer template.
- Add shadcn components via `npx shadcn@latest add @shadcn/<component>` — always use the `@shadcn/` namespace.
- Do not apply remote D1 migrations; local only per project rules.
- All MCQ routes and APIs require authentication.
