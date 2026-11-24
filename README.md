# EduPulse

Full-stack online education platform for Indian competitive and school exams (JEE, NEET, UPSC, SSC, Banking, GATE, CUET, CBSE, Foundation). Students learn from recorded lectures, study materials, timed tests and scheduled live classes; educators manage courses and tests; administrators approve educators and audit the platform.

This is a working application, not a UI prototype. Every dashboard number, chart and list is served by the API from the SQLite database. When an optional third-party integration is not configured, the product says so explicitly instead of faking a success screen.

## Stack

| Layer | Choice |
| --- | --- |
| Client | React 19, Vite 6, TypeScript (strict), Tailwind CSS 4, React Router 7, TanStack Query 5, lucide-react |
| Server | Node.js + Express 4 (ES modules), Zod validation, `node:sqlite`, JWT in an httpOnly cookie, server-side sessions |
| Database | SQLite (`server/data/edupulse.db`), schema in `server/config/schema.sql` |
| Auth | bcrypt password hashes, JWT cookie, DB-backed sessions with revocation, CSRF origin guard, rate limiting |
| Uploads | Local disk under `server/uploads` (S3-compatible storage is optional and not configured) |

Requires Node.js 22.5+ (uses `node:sqlite`); developed and tested on Node 24.

## Quick start

```bash
npm install          # installs both workspaces (client, server)
npm run seed         # creates + seeds server/data/edupulse.db (development only)
npm run dev          # API on :4100, Vite dev server on :5173 (proxies /api -> :4100)
```

Open http://localhost:5173. If port 5173 is taken, Vite picks the next free port automatically; in development the API accepts any `localhost`/`127.0.0.1` origin.

### Demo accounts (development only)

Seeded by `npm run seed`. Do not use these as production accounts.

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@edupulse.demo` | `Student@123` |
| Teacher | `teacher@edupulse.demo` | `Teacher@123` |
| Admin | `admin@edupulse.demo` | `Admin@123` |

There is also a seeded pending educator (`karan.bhatt@edupulse.demo` / `Teacher@123`) used to exercise the admin approval flow.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Runs API (`--watch`) and Vite together |
| `npm run seed` | Recreates the development database and sample catalogue |
| `npm test` | Server API test suite (`node:test` + supertest, isolated temp DB) |
| `npm run build` | Type-checks and builds the client into `client/dist` |
| `npm start` | Starts the API; also serves `client/dist` when it exists |

API documentation is available at http://localhost:4100/api/docs (OpenAPI at `/api/openapi.json`).

## Configuration

Copy `.env.example` to `.env` (repo root) or `server/.env`; server values in `server/.env` win. All integrations are optional — the app is fully usable without them.

| Variable | Effect |
| --- | --- |
| `PORT` | API port (default `4100`) |
| `CLIENT_ORIGIN` | Production client origin used by CORS / origin checks (default `http://localhost:5173`) |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Session token signing (defaults are development-only) |
| `DB_PATH` | SQLite file, relative to `server/` |
| `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | Enables in-app live streaming (Stage 2; not implemented — Join reports "not configured") |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Paid checkout (Stage 2; not implemented — checkout returns 503 `NOT_CONFIGURED`) |
| `LLM_API_BASE` / `LLM_API_KEY` / `LLM_MODEL` | AI tutor (Stage 2; UI reports module status, never canned answers) |
| `SMTP_*`, `MAIL_FROM` | Transactional email (password-reset delivery is admin-assisted until configured) |
| `S3_*` | S3-compatible object storage (defaults to local disk uploads) |

Settings can be inspected at runtime at `GET /api/content/config` and in the admin **Integrations** page.

## What is real vs. not configured

| Feature | Behaviour |
| --- | --- |
| Courses, curriculum, lectures | Live data; enrollment-gated playback with resume positions |
| Study materials | Inline PDF preview, download counters, bookmarks; premium PDFs require active enrollment |
| Test engine | Server owns the clock, scores answers, enforces expiry, returns solutions only after submit. Rank/percentile computed only from genuine submitted attempts (percentile withheld for a single attempt) |
| Live classes | Real schedules and attendance from the DB; LIVE badge only when the session window is current. Join returns `NOT_CONFIGURED` when LiveKit is absent |
| Payments | Paid enrollment returns `402 PAYMENT_REQUIRED`; admin probe returns `503 NOT_CONFIGURED`. Access is never granted from client-side success |
| AI tutor | Reports LLM configuration state from the server; no simulated answers |
| Email | In-app notifications are real; email delivery reports "not configured" |
| Analytics | Computed from attempts/results (subject and chapter breakdown), not static charts |

## Project layout

```
client/
  src/
    components/        design system (ui.tsx, cards, layout)
    context/           auth, theme, data providers
    pages/             public, student, teacher, admin pages
    lib/               api client, types, formatting
server/
  config/              env, SQLite connection, schema.sql
  controllers/         route handlers (Zod schemas included)
  middleware/          auth/RBAC, CSRF origin guard, validation, rate limits, uploads
  models/              serializers
  routes/              REST routers (/api/*)
  services/            attempt engine, access checks, analytics, notifications
  seed/                deterministic sample data + media generation
  test/                API tests
  uploads/             local media storage (seed output included)
```

### API conventions

- Success: `{ "data": ... }`; errors: `{ "error": { "code", "message", "details"? } }`
- Lists are paginated: `{ items, page, limit, total, totalPages }`
- Honest non-success codes: `402 PAYMENT_REQUIRED`, `503 NOT_CONFIGURED`, `409 ATTEMPT_CLOSED` / `ATTEMPT_EXPIRED`, `403 TEACHER_PENDING`

### Test engine rules

- `POST /api/tests/:id/attempts` starts or resumes an attempt; questions are returned without correct answers.
- `PATCH /api/tests/attempts/:id` autosaves answers (`clearResponse: true` clears an answer server-side).
- `POST /api/tests/attempts/:id/submit` is idempotent (`alreadySubmitted`, `resultId`); re-submitting returns the same result.
- The server auto-submits expired attempts and refuses edits afterwards.

## Testing

```bash
npm test
```

The suite seeds an isolated temporary database, imports the Express app and exercises:

- health and integration status endpoints
- login, session cookie, wrong-password rejection, unauthenticated access
- CSRF origin guard and role-based access control
- paid enrollment refusal (402, no access) and free-course enrollment
- admin checkout probe (503 `NOT_CONFIGURED`)
- attempt lifecycle: start, autosave, clear response, server-side scoring with negative marking, post-submit lock, idempotent resubmit, expiry auto-submit
- educator approval flow and the admin publish guard (course needs at least one lecture)

## Security notes

- Passwords hashed with bcrypt; JWT delivered only in an httpOnly, SameSite cookie; sessions stored server-side and revocable (Settings → Active sessions, admin Sessions page).
- Mutating requests are origin-checked; untrusted origins receive `403 CSRF_BLOCKED`.
- RBAC middleware guards student/teacher/admin areas; unapproved educators can complete their profile but cannot publish.
- Rate limiting on auth, registration, attempts and public forms (skipped in tests).
- Uploads are validated and served through authenticated API routes; media paths are not directory-listable.
- Secrets are read from the server environment only and never serialized to the client. `/api/content/config` exposes booleans, not keys.

## Reset / production

```bash
rm server/data/edupulse.db   # optional reset (Windows PowerShell: Remove-Item)
npm run seed
npm run build
npm start                    # serves API + client/dist on PORT
```

Set a strong `JWT_SECRET`, `NODE_ENV=production` and `CLIENT_ORIGIN` before deploying. Use the seed script only for development; create real accounts through the admin user management UI.
