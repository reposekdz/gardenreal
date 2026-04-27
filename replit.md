# Garden TVET School

Full-stack web application for Garden TVET School.

## Stack
- **Frontend**: React 19 + Vite 7 (with Tailwind, i18next, React Router) — served on port 5000
- **Backend**: Node.js / Express 5 + MySQL2 — served on port 8080
- **Database**: MySQL 8 (bundled from Nix store; data dir at `.data/mysql`)

## Project Layout
- `frontend/` — Vite React app (dev server runs on `0.0.0.0:5000`, allows all hosts for Replit's iframe proxy)
- `backend/` — Express API (`server.js`), DB layer (`db.js`), routes/, controllers/, middleware/, utils/, scripts/
- `start-dev.sh` — Boots MySQL, then backend, then Vite dev server
- `RENDER_DEPLOYMENT.md` — Original Render deployment notes

## Replit Setup
- Workflow `Start application` runs `bash start-dev.sh` and waits for port 5000 (webview).
- The Vite dev server proxies `/api` and `/uploads` to the backend at `http://localhost:8080`.
- MySQL listens on 127.0.0.1:3306 via a Unix socket; on first run the DB is initialized and `backend/garden_tvet.sql` is imported.
- Backend reads `DATABASE_URL` if present (for hosted MySQL like Aiven), otherwise falls back to `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME` env vars (set by `start-dev.sh`).

## Deployment
- Configured for `vm` deployment running `bash start-dev.sh`.
- For production, a hosted MySQL via `DATABASE_URL` is recommended (the backend already supports it with SSL).

## Academic Year, Cohort Engine & Graduates Yearbook (April 2026)
A real (no mocks) academic year management module is wired end-to-end.

### Cohort Engine (`backend/controllers/academicYearController.js`)
- `autoCohortPromotion(students)` — handles **Automobile Technology** with mixed split-cohort logic:
  - L3 → alternating split into **L4a/L4b** (sorted by last_name/first_name/id for deterministic output).
  - L4a + L4b → combined and re-split into **L5a/L5b** (mixing students across original cohorts).
  - L5a + L5b → graduated. Each promotion row carries a `cohort` label like `Auto L4a → L5b`.
- `buildPromotionPlan(fromYearId, executor)` — runs SOD/BDC linear ladder + AUTO cohort engine, accepts a transaction connection so `closeYear` locks rows and uses the same plan.
- `previewClose` returns `cohort_breakdown` (per-target-level counts) so the UI shows the engine's plan before confirming.
- `closeYear` is fully transactional, applies admin overrides on top of the engine's plan, and stores the cohort label in `student_promotions.notes`.
- `listGraduates` (`GET /api/academic-years/graduates`) returns graduates grouped by year → trade with filter metadata; supports `year_id`, `trade`, `search`.

### Graduates Yearbook (`frontend/src/pages/Graduates.jsx`, route `/graduates`)
- Yearbook UI grouped by academic year and trade with collapsible sections.
- Photo grid with initials fallback (uses new `students.photo_url` column added via idempotent migration in `backend/db.js`).
- Filters: year, trade, search; stat cards for totals.
- Detail modal with reg number, contact, address, guardian, cohort path, graduation date.
- Print PDF roster via `window.print()` + `@media print` styles in a popup window (no extra deps).
- "Send to Employers" button opens `SendRosterModal` carrying current filters.
- Nav item gated to admin/director/registrar/dod/accountant in `frontend/src/layouts/Layout.jsx`.

### Employer Directory & Outreach (April 2026)
Production-grade module to recruit graduates into partner companies, end-to-end:
- **DB**: `employers`, `employer_outreach`, `email_log` tables (idempotent in `backend/db.js`).
- **Email service** (`backend/utils/emailService.js`) — Nodemailer over SMTP (env vars `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`). NO mock fallback — endpoints return 503 when unconfigured. All sends are persisted in `email_log`.
- **PDF service** (`backend/utils/pdfRosterService.js`) — server-side PDF generation with `pdfkit`, paginated table by year+trade.
- **Controller/routes**: `backend/controllers/employerController.js`, `backend/routes/employerRoutes.js` mounted at `/api/employers`. CRUD + `POST /send-roster` (builds PDF, sends per-employer email, logs each result) + `GET /outreach` (cross-employer audit log) + `GET /email/status`.
- **Frontend**:
  - `frontend/src/pages/Employers.jsx` (route `/employers`, nav-gated to admin/director/registrar): full CRUD with search/sector/status filters, stats cards, detail panel with per-employer outreach history, system-wide outreach log modal.
  - `frontend/src/components/SendRosterModal.jsx`: reusable modal mounted on both Graduates and Employers pages — multi-select employer picker (sector filter, search, select-all), subject + custom message, PDF attach toggle, per-recipient send results with success/failure pills.
- Email service is configured via environment secrets only — never hardcoded.

### Original module (still active)

### Database (idempotent migrations in `backend/db.js`)
- `academic_years(id, name, start/end_date, status[planning|active|closed], is_current, closed_at, closed_by)`
- `academic_terms(id, academic_year_id, term_number, name, start/end_date, status[upcoming|active|ended])`
- `student_promotions(id, student_id, academic_year_id, from_trade, from_level, to_level, action[promoted|graduated|retained|enrolled], notes, created_by, created_at)`
- `students` extended with `academic_year_id`, `graduation_status`, `application_id`; `current_status` enum extended with `graduated|on_leave|expelled`; `student_type` enum widened to `private|public|government|bursary|sponsored`.
- `applications` extended with `enrolled_student_id`, `enrolled_at`, `enrolled_trade`, `enrolled_level`, `enrolled_academic_year_id`.

### Backend (`/api/academic-years`, admin/director only for writes)
- `GET /` list, `POST /` create year + 3 terms (transactional)
- `GET /current`, `POST /:id/set-current`, `GET /:id`
- `POST /:id/terms/:termId/end` ends a term
- `GET /:id/preview-close` returns promotion plan + intake count
- `POST /:id/close` closes the year, transactionally promotes / graduates per `LEVEL_LADDER`
  (Software Dev/Building: L3→L4→L5→graduated; Automobile: L3→L4a→L4b→L5a→L5b→graduated),
  optionally creates the next year and intakes any not-yet-enrolled approved applicants.
- `GET /promotions?year_id=&limit=` history log.
- `POST /api/applications/:id/enroll` admin enrollment with full overrides
  (academic_year_id, trade, level, reg_number, student fields). Auto-generates `2026/SOF/001`-style
  reg numbers when omitted, marks the application enrolled, logs a `student_promotions` row, sends SMS.

### Frontend
- `frontend/src/pages/AcademicYear.jsx` (route `/academic-year`, nav-gated to admin/director):
  year tabs, terms timeline with end-term buttons, year-create wizard, recent promotion history,
  and a **Bulk Promote / Close Year** modal containing the new `BulkPromoteTable` component:
  per-student dropdowns for action (Promote / Retain / Graduate) and override level (filtered by the
  trade ladder fetched from `/api/academic-years/ladder`), Promote-all / Retain-all / Reset bulk
  buttons, search, sticky header, amber row highlight for overridden rows, live summary pills, and
  a required confirmation checkbox. Submit posts `{confirm:true, overrides:[…], next_year?}`.
- `frontend/src/pages/Students.jsx` Add Student modal now includes Student Type
  (private/government/bursary/sponsored), Academic Year selector (defaults to current), guardian
  fields, and an optional reg-number override. Same `student_type` and `academic_year_id` are
  passed through the create payload.
- `frontend/src/pages/Applications.jsx` Enroll modal lets admins override trade/level/academic
  year and edit student details before creating the student record.
