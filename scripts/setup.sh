#!/bin/bash
# First-time setup for local development (no Docker for the apps themselves —
# only the infra services run in containers: SQL Server, Redis, RabbitMQ, MongoDB).
# Safe to re-run.
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

info()  { echo "==> $1"; }
fail()  { echo "ERROR: $1" >&2; exit 1; }

command -v docker  >/dev/null 2>&1 || fail "Docker is required. Install it and try again."
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 is required (docker compose ...)."
command -v node     >/dev/null 2>&1 || fail "Node.js is required. Install Node 22+ and try again."
command -v npm      >/dev/null 2>&1 || fail "npm is required."

info "Node $(node -v) / npm $(npm -v) detected."

if [ ! -f backend/.env ]; then
  info "Creating backend/.env from backend/.env.example"
  cp backend/.env.example backend/.env
else
  info "backend/.env already exists, leaving it untouched."
fi

info "Starting infra services (sqlserver, redis, rabbitmq, mongodb)..."
docker compose up -d sqlserver redis rabbitmq mongodb

info "Waiting for SQL Server to become healthy..."
for i in $(seq 1 30); do
  status="$(docker inspect --format='{{.State.Health.Status}}' fleet_sqlserver 2>/dev/null || echo "starting")"
  if [ "$status" = "healthy" ]; then
    break
  fi
  sleep 2
done
[ "$status" = "healthy" ] || fail "SQL Server did not become healthy in time. Check: docker compose logs sqlserver"

info "Installing backend dependencies..."
(cd backend && npm install)

info "Creating database, running migrations and seeding data..."
(cd backend && npm run db:init && npm run migration:run && npm run seed)

info "Installing frontend dependencies..."
(cd frontend && npm install)

info "Setup complete. Run 'make start-dev' to start the application."
