# Objective
Make student-code login fully functional, give the teacher dashboard a real left
sidebar (matching other roles) with conduct-management, read-only student list,
and an engagement view that shows likes / comments / raised hands / questions on
the teacher's notes. Then rewrite README.md in pure Kinyarwanda covering every
feature.

# Tasks

### T001: Backend — student login + portal endpoints
- Add `password_hash`, `must_change_password`, `last_login` columns to the
  `students` table on init (idempotent ALTER).
- New `backend/routes/studentAuthRoutes.js`:
  - POST `/login`  → `{ code, password }` returns JWT (`role: 'student'`)
  - GET  `/me`     → full student profile + grades + fees + payments +
                    attendance + conduct records + notifications
  - POST `/change-password`
- Hook `studentController.createStudent` to set a default password
  (last 4 digits of phone, fallback `garden123`) and SMS the credentials.
- Wire routes into `backend/server.js`.
- Acceptance: Posting `{ code: '2026/SOF/001', password: '5735' }` returns a
  JWT and the GET `/me` returns the student record.

### T002: Backend — teacher endpoints
- New `backend/routes/teacherRoutes.js` (verifyToken + teacher/admin):
  - GET  `/students`         read-only list (filter trade/level/q)
  - POST `/conduct`          insert into discipline_records (deduct points)
  - GET  `/conduct`          list records the teacher entered
  - GET  `/engagement`       per-note aggregated likes / reactions /
                             comments / bookmarks / raised-hand questions for
                             the teacher's own notes
  - GET  `/notes/comments`   all recent comments on the teacher's notes
- Wire route into `backend/server.js`.

### T003: Frontend — student portal
- New `frontend/src/layouts/StudentLayout.jsx` (left sidebar like Layout.jsx)
- New `frontend/src/pages/StudentDashboard.jsx` with tabs: Overview, Grades,
  Fees, Attendance, Conduct, Notifications, Settings.
- Update `pages/Login.jsx` to detect a registration-code pattern (e.g.
  `2026/SOF/001`) and call `/api/student-auth/login`. Redirect students to
  `/student-dashboard`.

### T004: Frontend — teacher dashboard with sidebar
- New `frontend/src/layouts/TeacherLayout.jsx` (sidebar mirroring Layout.jsx
  with teacher menu).
- Split `TeacherDashboard.jsx` into:
  - `pages/teacher/TeacherOverview.jsx`
  - `pages/teacher/TeacherNotes.jsx`     (existing notes table + upload)
  - `pages/teacher/TeacherQuestions.jsx` (StudentQuestionsPanel)
  - `pages/teacher/TeacherStudents.jsx`  (read-only)
  - `pages/teacher/TeacherConduct.jsx`   (record + list)
  - `pages/teacher/TeacherEngagement.jsx`(likes / comments / raised hands)
- Update `App.jsx` routes.

### T005: README.md — pure Kinyarwanda rewrite
- Rewrite README.md fully in Kinyarwanda, covering every module (admin, dod,
  accountant, stock_manager, teacher, student, parent, public site, driving
  school, kwiga learning portal), endpoints, and tech stack.

### T006: Restart + smoke test
- Restart the workflow, check workflow logs for errors, then screenshot the
  student login flow + teacher sidebar.
