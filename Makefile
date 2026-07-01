.PHONY: help setup infra-up infra-down start-dev back-start-dev front-start-dev \
        docker-up docker-down docker-logs db-reset

help:
	@echo "make setup        - first-time setup (env, infra services, install, db init/migrate/seed)"
	@echo "make start-dev    - start infra services + backend + frontend in dev mode (no Docker for the apps)"
	@echo "make infra-up     - start only sqlserver/redis/rabbitmq/mongodb containers"
	@echo "make infra-down   - stop the infra containers"
	@echo "make db-reset     - drop schema, re-run migrations and reseed the database"
	@echo "make docker-up    - build and start the full stack in Docker (backend + frontend + infra)"
	@echo "make docker-down  - stop the full Docker stack"
	@echo "make docker-logs  - tail logs from the full Docker stack"

setup:
	./scripts/setup.sh

infra-up:
	docker compose up -d sqlserver redis rabbitmq mongodb

infra-down:
	docker compose stop sqlserver redis rabbitmq mongodb

db-reset:
	cd backend && npm run db:reset

start-dev: infra-up
	trap 'kill 0' INT TERM EXIT; make back-start-dev & make front-start-dev; wait

back-start-dev:
	cd backend && npm run start:dev

front-start-dev:
	cd frontend && npm run start

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f
