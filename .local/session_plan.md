# Objective
Add real, functional Academic Year management (3 terms → close → auto-promote / graduate / open intake) and real Application enrollment that lets admins enroll an applied student into ANY trade/level (or honor the applied one), wired to real APIs and MySQL.

# Tasks

### T001: Database schema (idempotent on boot)
- Add `academic_years`, `academic_terms`, `student_promotions` tables.
- Extend `students.current_status` enum to include `'graduated'`.
- Add `students.academic_year_id`, `students.graduation_status`, `students.application_id`.
- Add `applications.enrolled_student_id`, `enrolled_at`, `enrolled_trade`, `enrolled_level`, `enrolled_academic_year_id`.

### T002: Backend controller + routes
- `academicYearController.js`: list, create with 3 terms, get current, set current, update term dates, end term, preview-close, close year (promotion/graduation/new-year creation transactional).
- Extend `applicationController.enrollApplicant` for overrides (trade/level/academic year + edit student details).
- Mount routes in `server.js`.

### T003: Frontend — AcademicYear page
- Admin-only page: list years; create year with 3 terms; advance/end terms; preview closure; execute closure with intake of pending/approved applicants for the new year.

### T004: Frontend — enhanced Applications enrollment
- Replace `Add Student` with an Enroll modal: pick academic year, override trade/level, edit fields, submit, see student created.

### T005: Wire-up + verify
- Add nav link, update `replit.md`, restart workflow, smoke-test API + UI.
