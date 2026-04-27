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
