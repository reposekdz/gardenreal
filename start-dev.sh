#!/bin/bash
# Boots MySQL, the Express backend, and the Vite dev server for Replit.
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
MYSQL_BASE="/nix/store/s2lbn1axpc79kwnc829k5idkwabfq459-mysql-8.0.42"
DATA_DIR="$ROOT/.data/mysql"
RUN_DIR="$ROOT/.data/mysql-run"
SOCK="$RUN_DIR/mysql.sock"

mkdir -p "$RUN_DIR"

# First-run init
if [ ! -d "$DATA_DIR/mysql" ]; then
  echo "[mysql] initializing data directory..."
  rm -rf "$DATA_DIR"
  mkdir -p "$DATA_DIR"
  "$MYSQL_BASE/bin/mysqld" --no-defaults --initialize-insecure \
    --datadir="$DATA_DIR" --basedir="$MYSQL_BASE" --user="$(whoami)" >/dev/null 2>&1
fi

cleanup() {
  echo "Shutting down..."
  kill $(jobs -p) 2>/dev/null || true
  if [ -S "$SOCK" ]; then
    "$MYSQL_BASE/bin/mysqladmin" --socket="$SOCK" -u root shutdown 2>/dev/null || true
  fi
  wait 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

echo "[mysql] starting..."
"$MYSQL_BASE/bin/mysqld" --no-defaults \
  --datadir="$DATA_DIR" \
  --basedir="$MYSQL_BASE" \
  --socket="$SOCK" \
  --pid-file="$RUN_DIR/mysql.pid" \
  --port=3306 \
  --bind-address=127.0.0.1 \
  --user="$(whoami)" \
  --skip-log-bin \
  --mysqlx=OFF \
  --innodb-buffer-pool-size=64M >"$RUN_DIR/mysqld.log" 2>&1 &
MYSQL_PID=$!

# Wait for mysql socket to be ready
for i in {1..30}; do
  if [ -S "$SOCK" ] && "$MYSQL_BASE/bin/mysqladmin" --socket="$SOCK" -u root ping >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done
echo "[mysql] ready on $SOCK"

# Ensure database exists and import schema if first run
if ! "$MYSQL_BASE/bin/mysql" --socket="$SOCK" -u root -e "USE garden_tvet" >/dev/null 2>&1; then
  echo "[mysql] creating garden_tvet database and importing schema..."
  "$MYSQL_BASE/bin/mysql" --socket="$SOCK" -u root -e "CREATE DATABASE garden_tvet CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
  "$MYSQL_BASE/bin/mysql" --socket="$SOCK" -u root garden_tvet < "$ROOT/backend/garden_tvet.sql" || true
fi

# Backend connects via TCP host=127.0.0.1 port=3306 (no password root)
# Unset Replit's auto-injected PostgreSQL DATABASE_URL — backend is MySQL-only.
unset DATABASE_URL
export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=
export DB_NAME=garden_tvet

echo "[backend] starting on port 8080..."
(cd backend && PORT=8080 node server.js) &
BACKEND_PID=$!

sleep 1

echo "[frontend] starting Vite on port 5000..."
(cd frontend && npm run dev -- --host 0.0.0.0 --port 5000) &
FRONTEND_PID=$!

wait $MYSQL_PID $BACKEND_PID $FRONTEND_PID
