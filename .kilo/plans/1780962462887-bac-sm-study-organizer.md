# BAC SM Study Organizer — Implementation Plan

## Goal

Add a private, mobile-first study organizer for the 2 Bac Sciences Mathématiques year at `/student-management`, backed by a separate SQLite database (`backend/data/2bac-study.db`) and its own login. No link to it anywhere on the portfolio, and it must not be indexed.

Core loop: track every lesson/subtitle with a review status and note, capture questions for teachers with status/priority/response, and see what needs attention from a dashboard.

## Decisions (confirmed with the user)

| Topic | Decision |
|---|---|
| Auth | Dedicated single-user study login (`ahmedbouramdane` / `Ahmed2008`), own `study_users` + `study_sessions` tables, own cookie, PBKDF2 hash, rate-limited. Independent of portfolio accounts/admin. |
| Curriculum | Seed all 3 subjects / 41 lessons / 217 subtitles from `2bac_sm_curriculum_tracker.md` on first run. Settings is **read-only** for curriculum. |
| Status granularity | Per-subtitle status + note + `last_reviewed_at`; lesson status is a computed rollup with optional manual override and a lesson-level note. |
| Navigation | One `/student-management` page, 4 tabs, active tab synced to `?tab=` (refresh/deep-link/back-forward work). Desktop sidebar, mobile bottom bar. |
| Visual direction | Fresh light study theme (white/slate + indigo accent), Tailwind v4 utilities, strong status colour-coding and progress emphasis. Portfolio's cream/orange identity untouched. |
| Language | English UI, French curriculum titles preserved. |
| Extras in v1 | Priority (low/normal/urgent) + "needs attention" reminders; search + filters; PWA install manifest. |
| Settings | Password change + active session/sign-out only. No curriculum editing, no export/import. |

## Constraints & assumptions

- Next.js **16.4.2**, React 19, App Router, `cacheComponents: true`, Tailwind **v4** (no config file, `@import "tailwindcss"` in `globals.css`).
- FastAPI single `create_app()` factory; all current endpoints are closures in `backend/main.py` (2828 lines). SQLite + SQLAlchemy 2.0.
- Existing conventions to follow: `{ detail }` errors, `Cache-Control: no-store`, cookie sessions, route-handler proxies (`src/app/api/_backend.ts`, `src/app/api/dashboard/_lib.ts`), sonner toasts, lucide-react icons, Radix Dialog.
- `npm run lint` and `npx tsc --noEmit` are the frontend gates; `npm run build` must pass. Backend: `python -m pytest backend/test_main.py backend/test_study.py -q`.
- `logo.png` is 512×512 (usable as the PWA 512 icon); `icon.svg` is a 64×64 SVG.
- The study DB is separate from `portfolio.sqlite3`; portfolio data/behaviour must not change.

## Architecture

### Backend — new `backend/study/` package

Do **not** grow `main.py` further. Add an isolated package wired into `create_app()`:

```text
backend/
├── main.py                  # + study_database_url param, include_router, dispose study engine
├── study/
│   ├── __init__.py          # exports create_study_router, study engine helpers
│   ├── models.py            # StudyBase + 7 tables
│   ├── schemas.py           # Pydantic request/response models
│   ├── auth.py              # PBKDF2 hash/verify, session token helpers
│   ├── curriculum.py        # full seed data (3 subjects, 41 lessons, 217 subtitles)
│   ├── seed.py              # ensure user + idempotent curriculum seed
│   └── router.py            # create_study_router(engine, session_factory, secure_cookie)
└── test_study.py            # pytest suite for the study API
```

Integration in `create_app()` (after the existing engine/seed block, before `return app`):

1. Resolve `study_database_url`: new `study_database_url` arg → `STUDY_DATABASE_URL` env → `backend/data/2bac-study.db`.
2. `create_engine(..., connect_args={"check_same_thread": False}, pool_pre_ping=True)` + SQLite `PRAGMA foreign_keys=ON`, `busy_timeout=5000`, `journal_mode=WAL`.
3. `StudyBase.metadata.create_all(study_engine)`.
4. `seed_study_data(study_session_factory, username, password)` — user + curriculum.
5. `app.include_router(create_study_router(study_engine, study_session_factory, secure_cookie=secure_account_cookie))`.
6. `app.state.study_engine` / `app.state.study_session_factory` for tests.
7. Extend `lifespan` to dispose both engines.

New `create_app` parameters (testability): `study_database_url`, `study_username`, `study_password`, `study_session_days`.

### Frontend — new route segment

```text
src/app/
├── student-management/
│   ├── layout.tsx                    # metadata noindex + viewport theme colour
│   ├── page.tsx                      # renders client
│   ├── student-management-client.tsx # auth gate + tab shell
│   ├── components/
│   │   ├── app-shell.tsx             # sidebar / mobile header / bottom nav
│   │   ├── login-screen.tsx
│   │   ├── ui.tsx                    # Card, Button, Input, Select, Badge, ProgressBar, EmptyState, Skeleton, Dialog
│   │   ├── status.tsx                # status metadata maps (label, pill classes, dot, icon)
│   │   ├── question-card.tsx
│   │   ├── question-dialog.tsx       # create/edit (Radix Dialog, full-screen on mobile)
│   │   ├── lesson-list.tsx
│   │   └── subject-chips.tsx
│   ├── tabs/
│   │   ├── dashboard-tab.tsx
│   │   ├── lessons-tab.tsx
│   │   ├── questions-tab.tsx
│   │   └── settings-tab.tsx
│   └── lib/
│       ├── api.ts                    # typed fetch + StudyApiError + guards
│       └── format.ts                 # date/label/percent helpers
├── api/study/
│   ├── _lib.ts                       # origin check, JSON body, forwardStudyRequest
│   ├── login/route.ts
│   ├── logout/route.ts
│   ├── session/route.ts
│   ├── dashboard/route.ts
│   ├── subjects/route.ts
│   ├── lessons/route.ts
│   ├── lessons/[id]/route.ts         # GET, PATCH
│   ├── subtitles/[id]/route.ts       # PATCH
│   ├── questions/route.ts            # GET, POST
│   ├── questions/[id]/route.ts       # GET, PATCH, DELETE
│   ├── reminders/route.ts
│   └── password/route.ts
├── manifest.ts                       # PWA manifest
└── robots.ts                         # + disallow /student-management, /api/study
```

No changes to portfolio nav, footer, or `sitemap.ts`. No link anywhere.

## Data model (`backend/study/models.py`)

```python
class StudyBase(DeclarativeBase): ...

StudyUser(id PK, username VARCHAR(64) UNIQUE, password_hash VARCHAR(255),
          created_at, updated_at)

StudySession(id CHAR(64) PK,          # sha256(token) hex
             user_id FK -> study_users.id,
             expires_at INTEGER, created_at)

StudySubject(id PK, name VARCHAR(80), slug VARCHAR(80) UNIQUE,
             accent VARCHAR(20), sort_order INTEGER)

StudyLesson(id PK, subject_id FK -> study_subjects.id,
            title VARCHAR(200), chapter_number INTEGER, sort_order INTEGER,
            status_override VARCHAR(24) NULL, note TEXT,
            created_at, updated_at)

StudySubtitle(id PK, lesson_id FK -> study_lessons.id,
              title VARCHAR(200), sort_order INTEGER,
              status VARCHAR(24) DEFAULT 'not_studied',
              note TEXT, last_reviewed_at DATETIME NULL,
              created_at, updated_at)

StudyQuestion(id PK, subject_id FK -> study_subjects.id,
              lesson_id FK NULL, subtitle_id FK NULL,
              title VARCHAR(200), body TEXT,
              teacher VARCHAR(120) NULL,
              priority VARCHAR(10) DEFAULT 'normal',
              status VARCHAR(12) DEFAULT 'pending',
              response TEXT NULL, personal_note TEXT NULL,
              created_at, updated_at,
              asked_at DATETIME NULL, answered_at DATETIME NULL)

StudyMeta(key VARCHAR(64) PK, value TEXT)   # curriculum_version, seeded_at
```

Enums (validated in Pydantic, stored as TEXT):

- Subtitle / lesson-override status: `not_studied`, `understood`, `confusing`, `has_questions`, `needs_revision`.
- Question status: `pending`, `asked`, `answered`, `archived`.
- Priority: `low`, `normal`, `urgent`.

Indexes: `study_lessons(subject_id)`, `study_subtitles(lesson_id)`, `study_questions(status, subject_id)`, `study_questions(lesson_id)`, `study_questions(subtitle_id)`.

### Lesson rollup (backend helper, single source of truth)

1. Manual `status_override` wins.
2. Otherwise compute subtitle counts.
3. `status` = most frequent non-`not_studied` status; ties broken by severity `has_questions > confusing > needs_revision > understood > not_studied`; if all are `not_studied` → `not_studied`.
4. `attention` = true when any subtitle is `confusing` or `has_questions` (or the override is one of those).
5. Response includes `subtitle_stats` so the UI shows "4/10 understood" and per-status counts.

### Status transition rules (questions)

- `pending → asked`: set `asked_at = now`.
- `asked → answered`: `response` must be non-empty (existing or in the same PATCH); set `answered_at = now`.
- `answered → archived`, `pending/asked → archived`: allowed.
- `archived → pending`: clear `asked_at` and `answered_at`.
- Invalid transitions → `400 { detail }`.

## Curriculum seed (`backend/study/curriculum.py` + `seed.py`)

Transcribe `2bac_sm_curriculum_tracker.md` exactly:

| Subject | Slug | Lessons | Subtitles |
|---|---|---|---|
| Mathematics — Mathématiques | `mathematics` | 12 | 89 |
| Physique — Physique | `physics` | 16 | 69 |
| Chimie — Chimie | `chemistry` | 13 | 59 |
| **Total** | | **41** | **217** |

Data shape:

```python
CURRICULUM = [
    {
        "name": "Mathematics — Mathématiques",
        "slug": "mathematics",
        "accent": "indigo",
        "lessons": [
            {"chapter": 1, "title": "Limites et continuité",
             "subtitles": ["Limites des fonctions", ...]},
            ...
        ],
    },
    ...
]
```

Seed behaviour:

- `seed_study_user`: if no `study_users` row, create `ahmedbouramdane` with PBKDF2-SHA256 hash of `STUDY_PASSWORD` (default `Ahmed2008`). Log a warning when the default is used with `APP_ENV=production`.
- `seed_curriculum`: if `study_subjects` is empty, insert everything. If not empty, **upsert only missing rows** by natural key (`subject.slug`, `lesson.chapter_number`, `subtitle.sort_order`) — never delete or overwrite user notes/statuses. Write `study_meta.curriculum_version = 1`.
- Curriculum code edits therefore add missing items on next boot; renaming/deleting seeded items requires a manual DB change (Settings is read-only by decision).

## API surface

All under `/api/v1/study`, JSON only, `Cache-Control: no-store`, auth required except login/session.

| Method | Path | Purpose |
|---|---|---|
| POST | `/login` | `{username, password}` → `{user:{id,username}}` + session cookie. 401 invalid, 429 rate-limited. |
| POST | `/logout` | 204 + delete cookie. |
| GET | `/session` | `{user:{id,username}}` or 401. |
| GET | `/dashboard` | Totals, subtitle status counts, questions by status, subjects breakdown, attention lists, continue-learning suggestion. |
| GET | `/subjects` | Subjects with lesson/question/unresolved counts and progress. |
| GET | `/lessons` | All lessons with subtitles, rollup status, stats, notes (41 rows; no pagination). Optional `subject_id`, `status`, `q` filters. |
| GET | `/lessons/{id}` | Lesson + subtitles. |
| PATCH | `/lessons/{id}` | `{status_override?, note?}` (`null` override = auto). |
| PATCH | `/subtitles/{id}` | `{status?, note?}`; status change sets `last_reviewed_at`. |
| GET | `/questions` | Filters: `status`, `subject_id`, `lesson_id`, `subtitle_id`, `priority`, `teacher`, `q`, `limit` (default 100, max 1000), `offset`. |
| POST | `/questions` | Create. `subject_id` required; `lesson_id`/`subtitle_id` optional. |
| GET | `/questions/{id}` | Detail. |
| PATCH | `/questions/{id}` | Partial update + status transitions. |
| DELETE | `/questions/{id}` | 204. |
| GET | `/reminders` | `{overdue:[...], urgent:[...], confusing_lessons:[...]}` (asked > 7 days, urgent pending, confusing/has_questions lessons). |
| POST | `/password` | `{current_password, new_password}` → 204; deletes all other sessions. |

Conventions:

- Pydantic models with `ConfigDict(extra="forbid", str_strip_whitespace=True)` and length caps (title 200, body 20k, note 5k, teacher 120, response 20k).
- Positive-int path validation; 404 for missing rows; 400 for invalid transitions; 422 from FastAPI validation; 503 on DB failure.
- Search: case- and accent-insensitive (`unicodedata.normalize("NFKD")` + strip combining marks) over lesson/subtitle/question titles and bodies.
- Dates stored as UTC ISO strings; `asked_at` / `answered_at` / `last_reviewed_at` nullable.
- Joins add display fields: `subject_name`, `lesson_title`, `subtitle_title` to question payloads.

## Frontend UX

### App shell & tab sync

- `student-management-client.tsx` checks `GET /api/study/session` on mount:
  - 200 → app shell; 401 → login screen; other → error screen with retry.
- Tabs: `dashboard | lessons | questions | settings`.
- `useTabState()` hook: initial tab from `location.search`, `history.replaceState` on change, `popstate` listener. No `useSearchParams` (avoids Suspense/cacheComponents friction).
- Desktop (`lg+`): fixed 256px sidebar (brand, 4 nav items with icons, mini progress, user + sign out).
- Mobile: sticky top bar (brand, current title, avatar/sign-out) + fixed bottom tab bar with 4 items, `pb-[env(safe-area-inset-bottom)]`.
- Content: `mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12`.
- Active tab: `aria-current="page"`, indigo accent, subtle `bg-indigo-50`.
- Keyboard accessible tablist (arrow keys) with `role="tab"`/`role="tabpanel"`.

### Login screen

- Centered card on `bg-slate-50`; brand mark, "BAC SM Organizer", "Private study space".
- Username + password (show/hide), submit, inline error, disabled/loading state.
- Rate-limit message from backend (`429`) displayed verbatim.
- No registration link, no "back to portfolio" link.

### Dashboard tab

- Greeting (time-based) + localized date.
- 4 stat cards: total lessons, understood subtitles, confusing/has-questions, questions pending+asked.
- "Needs attention" card: confusing/has-questions lessons (top 5), overdue asked questions, urgent pending questions. Each row links to the relevant tab/filter via `?tab=questions&status=asked`.
- "Questions by status": horizontal bars with counts (pending/asked/answered/archived).
- "Subject organization": per subject — lessons, questions, unresolved, progress bar.
- "Continue studying": first `not_studied`/`confusing` lesson with a button to Lessons.
- Empty states when no data/questions.

### Lessons tab

- Header with overall subtitle progress (`understood / total`) and a progress bar.
- Subject chips (All / Mathematics / Physics / Chemistry) with counts.
- Search input + status select (All, Not studied, Understood, Confusing, Has questions, Needs revision).
- Lessons grouped by subject; each card: chapter badge, title, rollup status pill + attention dot, "x/y understood" progress, note preview, expand chevron.
- Expanded lesson: subtitle rows with status dot/pill + status select; note textarea; `last_reviewed_at`; status change PATCHes immediately (optimistic + rollback + toast on error) and sets `last_reviewed_at`.
- Lesson footer: override select (`Auto (from subtitles)` + 5 statuses) and lesson note with Save.
- "Ask a question" is **not** in v1 (not selected), but the Questions form can optionally reference subject/lesson/subtitle.

### Questions tab

- Header: total count + primary "New question" button (desktop) / FAB (mobile).
- Status chips with counts: All, Pending, Asked, Answered, Archived (archived excluded from "All" by default).
- Filters: search, subject select, priority select, teacher text (datalist of existing teachers). Clear-all.
- Cards: priority stripe, status pill, title, subject/chapter/teacher meta, created date, body excerpt (expand), teacher response block, personal note, action menu (Edit, Mark asked, Add response, Archive, Delete with confirm).
- Reminder banner when overdue/urgent items exist.
- New/Edit dialog (Radix Dialog; full-screen on mobile): title*, question*, subject*, lesson (filtered by subject), subtitle (filtered by lesson, optional), teacher, priority, status, response, personal note. Inline validation; server errors mapped to fields where possible.
- Status actions call PATCH with the transition; answered requires a response.

### Settings tab

- Account card: username (read-only), change password (current, new, confirm; min 8 chars, match check).
- Session card: "Signed in as …", sign out.
- Curriculum card (read-only): 3 subjects / 41 lessons / 217 subtitles, seed version, note that curriculum edits are code-level.
- Privacy card: private by design, not linked, not indexed, data in `2bac-study.db`.
- No export/import (explicitly out of scope).

## Design system (Tailwind v4, literal classes)

Root: `min-h-screen bg-slate-50 text-slate-900 antialiased`.

| Element | Classes / tokens |
|---|---|
| Card | `rounded-2xl border border-slate-200 bg-white shadow-sm` |
| Primary button | `min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50` |
| Secondary button | `min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50` |
| Input/select/textarea | `min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10` |
| Heading | `font-[var(--font-display)] text-2xl font-semibold tracking-tight` |
| Eyebrow | `font-[var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-slate-500` |
| Progress | `h-2 rounded-full bg-slate-100` + inner `bg-indigo-500` with inline width |
| Muted text | `text-slate-500` / `text-slate-600` |
| Divider | `border-slate-200` |

Status palette (literal class maps in `status.tsx` — no dynamic class names):

| Status | Pill | Dot |
|---|---|---|
| not_studied | `bg-slate-100 text-slate-600 border-slate-200` | `bg-slate-400` |
| understood | `bg-emerald-50 text-emerald-700 border-emerald-200` | `bg-emerald-500` |
| confusing | `bg-amber-50 text-amber-700 border-amber-200` | `bg-amber-500` |
| has_questions | `bg-rose-50 text-rose-700 border-rose-200` | `bg-rose-500` |
| needs_revision | `bg-violet-50 text-violet-700 border-violet-200` | `bg-violet-500` |

Question status: pending = amber, asked = sky, answered = emerald, archived = slate. Priority: low = slate, normal = indigo, urgent = rose with flag icon.

Mobile specifics:

- Bottom nav 4 items, icon + 11px label, active indigo.
- Cards full-width, 16px gutters; dialogs full-screen with sticky header/footer.
- Tap targets ≥44px; selects use native pickers on mobile.
- Safe-area padding for iOS; `100dvh` for full-screen dialogs.
- No horizontal scrolling; long titles wrap; subject chips scroll horizontally with hidden scrollbar.

## Security & privacy

- Dedicated auth: `study_users` + `study_sessions`; token = `secrets.token_urlsafe(32)`, stored as SHA-256 hex; 30-day expiry (`STUDY_SESSION_DAYS`).
- Cookie `portfolio_study_session`: `HttpOnly`, `SameSite=Strict`, `Secure` when `APP_ENV=production`, `Path=/api/study`, `Max-Age`.
- Login rate limit: 5 failures / 15 min per `username + client IP` (use `X-Forwarded-For` first hop when present), in-memory with `Lock`; `Retry-After` on 429.
- Password hashing: PBKDF2-SHA256, 310,000 iterations, format identical to existing accounts (local helper in `study/auth.py` to avoid a circular import with `main.py`).
- Password change requires the current password; deletes all other sessions.
- CSRF: `SameSite=Strict` + `rejectCrossOriginRequest` on all mutating Next routes + backend requires `application/json` for mutations.
- XSS: all user text rendered as plain text by React; no `dangerouslySetInnerHTML`.
- SQL: SQLAlchemy ORM only.
- Logs: never log passwords/tokens; log failed logins with username + IP.
- Indexing: `robots.ts` disallows `/student-management` and `/api/study`; nested `layout.tsx` sets `robots: { index: false, follow: false }`; no sitemap entry; no nav link.
- Database: `backend/data/2bac-study.db`, WAL + `busy_timeout=5000`; ensure the directory is writable/persistent on PythonAnywhere.

## Error handling, loading, empty states

- `StudyApiError(detail, status)`; 401 triggers the login screen; 403/400/404/422 show an inline alert + toast; 503 shows "service unavailable" with retry.
- Lists: skeleton rows (`animate-pulse`) while loading; optimistic updates for status changes with rollback.
- Empty states: icon + short explanation + primary action (e.g., "No questions yet" → New question; "No lessons match" → clear filters).
- Forms: inline field errors, disabled submit while saving, success toast.
- All mutations revalidate the affected list/dashboard (simple refetch, no cache layer).

## PWA & indexing

- `src/app/manifest.ts`: name "BAC SM Organizer", short_name "2 BAC SM", `start_url: "/student-management"`, `scope: "/student-management"`, `display: "standalone"`, `background_color: "#f8fafc"`, `theme_color: "#4f46e5"`, icons `/icon.svg` (any) + `/logo.png` (512×512).
- `src/app/student-management/layout.tsx`: metadata title + `robots: { index: false, follow: false }`; `viewport` theme colour `#4f46e5`.
- `robots.ts`: add `/student-management`, `/api/study` to `disallow`.
- No offline data sync (out of scope); the manifest only enables Add to Home Screen.

## Testing & verification

Backend (`backend/test_study.py`, mirroring `test_main.py` fixtures):

1. Login success/failure, cookie flags, session endpoint.
2. Login rate limit (6th attempt → 429 + `Retry-After`).
3. All protected endpoints return 401 without a cookie.
4. Curriculum seed: 3 subjects, 41 lessons, 217 subtitles; idempotent second boot.
5. Subtitle PATCH updates `last_reviewed_at` and lesson rollup (dominant status + attention).
6. Lesson override wins over rollup; `null` restores auto.
7. Question CRUD + valid/invalid transitions (answered requires response; archived→pending clears timestamps).
8. Question filters/search (status, subject, priority, teacher, accent-insensitive `q`).
9. Dashboard stats and reminders thresholds (asked > 7 days, urgent pending, confusing lessons).
10. Password change revokes other sessions; old password no longer works.
11. Validation: bad status/priority → 422; missing fields → 422; oversized body → 422.
12. Study DB isolation: portfolio endpoints still work; `portfolio.sqlite3` untouched.

Frontend gates:

- `npx tsc --noEmit` (no typecheck script exists).
- `npm run lint`.
- `npm run build`.
- Manual smoke with `next dev` + `uvicorn backend.main:app --reload`:
  - Login, refresh (session persists), sign out.
  - Tab deep-link (`?tab=questions`), back/forward.
  - Status change optimistic update + rollback on forced 500.
  - Question create/edit/transition/delete; filters.
  - Mobile viewport 390×844: bottom nav, dialogs, no horizontal scroll, tap targets.
  - Lighthouse/a11y sanity: labels, focus rings, contrast.

## Deployment & environment

Add to `.env.example` and `backend/README.md`:

```dotenv
# Study organizer (backend)
STUDY_DATABASE_URL=sqlite:///backend/data/2bac-study.db
STUDY_USERNAME=ahmedbouramdane
STUDY_PASSWORD=Ahmed2008
STUDY_SESSION_DAYS=30
```

- PythonAnywhere: deploy `backend/study/`, update `main.py`, ensure `backend/data/` is writable/persistent, reload the web app. `2bac-study.db` is created on first boot.
- Vercel: no new env; `/api/study/*` proxies to `PORTFOLIO_BACKEND_URL` like the existing routes.
- Change the password in Settings after first login; a production warning is logged while the default is in use.
- No portfolio DB migration is required.

## Ordered task list

1. **Backend foundation**: `backend/study/{models,schemas,auth}.py`; env config; `create_app` wiring (study engine, seed, router, lifespan disposal, `app.state`).
2. **Curriculum + seed**: transcribe all 217 subtitles into `curriculum.py`; implement user/curriculum seeding and the rollup helper.
3. **Study router**: auth routes (login/logout/session/password) + data routes (dashboard, subjects, lessons, subtitles, questions, reminders) with validation, rate limiting, errors.
4. **Backend tests**: `backend/test_study.py`; run `pytest backend/test_main.py backend/test_study.py`.
5. **Frontend proxy**: `src/app/api/study/_lib.ts` + all route handlers; verify 401/403/429/503 pass-through.
6. **Frontend foundation**: types, `api.ts`, `format.ts`, `status.tsx`, `ui.tsx` primitives, `useTabState`.
7. **Shell + login**: `layout.tsx`, `page.tsx`, `student-management-client.tsx`, `app-shell.tsx`, `login-screen.tsx`.
8. **Dashboard tab**: stats, attention, status bars, subjects, continue-learning.
9. **Lessons tab**: chips, search/status filters, grouped accordion, subtitle status/note editing, lesson override/note.
10. **Questions tab**: list, chips, filters, cards, actions, create/edit dialog, transitions, reminders.
11. **Settings tab**: password change, session/sign-out, read-only curriculum summary, privacy note.
12. **PWA & privacy**: `manifest.ts`, nested layout metadata/viewport, `robots.ts` disallow, confirm no nav links.
13. **Verification**: typecheck, lint, build, pytest, desktop + mobile smoke, a11y pass.
14. **Docs**: update `backend/README.md`, `.env.example`, and a short feature note in the repo README.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| 217-subtitle transcription errors | Seed from the markdown verbatim; add a test asserting counts (3/41/217); user proofreads titles. |
| SQLite write contention on PythonAnywhere | WAL + `busy_timeout=5000`; single worker; short transactions; no long-held sessions. |
| Next 16 `cacheComponents` / typed routes | Client-side fetching; no `useSearchParams` (history API); nested `LayoutProps<"/student-management">`; route handlers follow existing dynamic patterns (`params: Promise<...>`). |
| Tailwind v4 missing dynamic classes | Literal class strings in status maps; no `bg-${color}-500` interpolation. |
| Two engines / lifespan | Build both in `create_app`; dispose both; expose `app.state.study_engine` for tests. |
| Default password exposure | PBKDF2 hash at rest; Settings change; production warning; rate limiting. |
| Scope creep (curriculum CRUD/export/etc.) | Explicit out-of-scope list; read-only Settings. |
| Mobile keyboard obscuring dialogs | Full-screen Radix dialog with sticky header/footer and scrollable body; `100dvh`. |

## Out of scope

Curriculum CRUD, JSON export/import, quick-add from lesson, lesson↔question linkage view, extended subject statistics, streaks/heatmap, dark mode, keyboard shortcuts, multi-user, offline sync, native app, and any public link or sitemap entry.

## Further considerations

1. **Questions require a subject** but lesson/subtitle are optional; the form filters lessons by subject and subtitles by lesson.
2. **Archived questions** are hidden from the default list; the Archived chip shows them.
3. **Optimistic status updates**: subtitle status changes apply immediately and roll back with a toast on failure.
4. **Dates**: stored UTC, displayed with `toLocaleDateString(undefined, { dateStyle: "medium" })`; relative "x days waiting" in reminders.
5. **Teacher field**: free text with a datalist of previously used names.
6. **Search normalization**: accent-insensitive so "continuite" finds "continuité".
7. **Dashboard "continue studying"**: first lesson in curriculum order whose rollup is `not_studied` or `confusing`.
8. **Study DB backup**: out of scope, but Settings will state that the file is `backend/data/2bac-study.db` for manual backup.
9. **PWA icons**: `/logo.png` is exactly 512×512; `/icon.svg` covers `any`. If installability complains, add a 192×192 PNG derived from the logo.
10. **No changes to portfolio styling**: the study theme uses literal Tailwind utilities and does not touch `globals.css` tokens.