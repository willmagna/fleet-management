# Aivacol — Fleet Management Platform

Fullstack vehicle lifecycle management system built with **NestJS** (backend) and **Angular** (frontend).

---

## About

Aivacol is a fleet management platform for rental companies. This repository implements the **vehicle lifecycle module**: managing brands, models and vehicles, and tracking a vehicle's operational status over time.

What it does:

- **Brands and models** — full CRUD, with models always linked to a brand. Soft delete only (`active` flag) — nothing is ever physically removed, preserving history.
- **Vehicles** — full CRUD (`license_plate`, `chassis`, `renavam`, `year`, linked model), with Redis-cached reads.
- **Status lifecycle** — a vehicle moves between `disponivel`, `alugado`, `manutencao` and `inativo`. Every transition is recorded in a status-history log, so you can see exactly when and why a vehicle's status changed.
- **Authentication** — JWT-based login with refresh tokens, password reset, and route guards on the frontend. Every write operation records who made it (`created_by` / `updated_by`).
- **Audit trail** — every mutation (brands, models, vehicles) is published as an event and persisted to MongoDB, independent of the relational database.
- **Frontend** — a login screen and a vehicle list/form UI (brand and model dropdowns, status changes) consuming the API.

---

## Requirements

- [Node.js](https://nodejs.org/) 22+ and npm
- [Docker](https://www.docker.com/) with Docker Compose v2 (`docker compose ...`)
- `bash` (used by `scripts/setup.sh`; ships by default on Linux/macOS, available via WSL/Git Bash on Windows)

No other tool is required locally — SQL Server, Redis, RabbitMQ and MongoDB run as Docker containers; Node/npm only need to be available on the host to run the backend and frontend in development mode.

---

## Clone the repository

```bash
git clone git@github.com:willmagna/fleet-management.git
cd fleet-management
```

---

## Development

The backend and frontend run **directly on the host** in development (`npm run start:dev` / `npm run start`) — they are **not** containerized for day-to-day development. Docker Compose is used only to provide the infrastructure services (SQL Server, Redis, RabbitMQ, MongoDB) that the apps connect to.

### First-time setup

Run the setup script once after cloning the repo:

```bash
make setup
```

It will, in order:

1. Check that Docker, Node and npm are available.
2. Create `backend/.env` from `backend/.env.example` (skipped if it already exists).
3. Start the infra containers (`sqlserver`, `redis`, `rabbitmq`, `mongodb`) and wait for SQL Server to report healthy.
4. Install backend dependencies, create the database, run migrations and seed initial data.
5. Install frontend dependencies.

The script is idempotent — safe to run again at any time (e.g. after pulling new migrations).

### Running the Project

```bash
make start-dev
```

This brings up the infra containers (if not already running) and starts the backend (`:3000`) and frontend (`:4200`) together, in watch mode. `Ctrl+C` stops both.

Other useful targets — run `make help` to see them all:

| Command                               | Description                                          |
| ------------------------------------- | ---------------------------------------------------- |
| `make setup`                          | Same as `./scripts/setup.sh`                         |
| `make start-dev`                      | Start infra + backend + frontend in dev mode         |
| `make infra-up` / `make infra-down`   | Start/stop only the infra containers                 |
| `make db-reset`                       | Drop schema, re-run migrations, reseed               |
| `make docker-up` / `make docker-down` | Run the full stack in Docker (see [Docker](#docker)) |

### Access details

| Service                | URL                                          |
| ---------------------- | -------------------------------------------- |
| Backend API            | http://localhost:3000                        |
| Swagger docs           | http://localhost:3000/api/docs               |
| Frontend               | http://localhost:4200                        |
| RabbitMQ management UI | http://localhost:15672 (`guest` / `guest`)   |
| MongoDB                | `mongodb://localhost:27017/fleet_audit`      |
| SQL Server             | `localhost:1433` (`sa` / see `backend/.env`) |

**Login credentials** (seeded user):

| Field          | Value                             |
| -------------- | --------------------------------- |
| Usuário/E-mail | `aivacol` / `aivacol@aivacol.com` |
| Senha          | `aivacol`                         |

---

## Docker

Docker here exists **only to simulate a production-like environment** — it is not used for day-to-day development (see [Development](#development) above). Use it to build and run the whole stack (backend + frontend + infra) as it would run in production.

```bash
make docker-up      # build images and start everything
make docker-down    # stop and remove containers
make docker-logs    # tail logs from all services
```

`docker-up` builds the backend and frontend images locally and starts the full stack with `docker-compose.yml`. The backend container bootstraps itself on every start (creates the database if missing, runs pending migrations, seeds data), so it works the same way on a totally fresh volume or on a reused one.

### Access details

Same ports as in development — the Docker stack publishes the same host ports:

| Service                | URL                                          |
| ---------------------- | -------------------------------------------- |
| Backend API            | http://localhost:3000                        |
| Swagger docs           | http://localhost:3000/api/docs               |
| Frontend               | http://localhost:4200                        |
| RabbitMQ management UI | http://localhost:15672 (`guest` / `guest`)   |
| MongoDB                | `mongodb://localhost:27017/fleet_audit`      |
| SQL Server             | `localhost:1433` (`sa` / see `backend/.env`) |

**Login credentials**: same seeded user as above — `aivacol` / `aivacol`.

---

## Swagger

The backend exposes interactive API documentation via **Swagger (OpenAPI)** at:

```
http://localhost:3000/api/docs
```

Use it to browse every endpoint, see request/response schemas, and try calls directly from the browser. Protected routes require a Bearer token: call `POST /auth/login` (e.g. with the seeded user above), copy the returned `access_token`, then click **Authorize** in the Swagger UI and paste it in.

Besides Swagger, a ready-to-use Postman collection is provided for testing — see below.

---

## Postman collection for testing

The file [`postman_collection.json`](./postman_collection.json) at the root of the repo contains a full collection covering `auth`, `brands`, `models` and `vehicles`.

**How to use it:**

1. Open Postman → **Import** → select `postman_collection.json`.
2. Run **auth → Login** (default body already uses the seeded user `aivacol` / `aivacol`).
3. Copy `access_token` from the response and set it as the collection variable `token` (collection → **Variables** tab, or the quick-edit panel after running Login).
4. All other requests use `{{token}}` as a Bearer token automatically.
5. After creating a brand/model/vehicle, copy the returned `id` into the corresponding collection variable (`brand_id`, `model_id`, `vehicle_id`) to use it in the following requests (`Get by Id`, `Update`, `Delete`, etc.).

---

## Project Structure

```
fleet-management/
├── docker-compose.yml         # SQL Server, Redis, RabbitMQ, MongoDB + backend/frontend (Docker simulation)
├── Makefile                   # make start-dev / docker-up / db-reset / ...
├── postman_collection.json    # Postman collection for manual API testing
├── scripts/
│   └── setup.sh               # first-time setup (env, infra, install, db init/migrate/seed)
│
├── backend/                   # NestJS API
│   ├── Dockerfile
│   ├── docker-entrypoint.sh   # bootstraps the DB on every container start
│   └── src/
│       ├── auth/              # JWT login/refresh/logout/forgot/reset-password
│       ├── brands/            # Brands CRUD (soft delete)
│       ├── models/            # Models CRUD (soft delete, linked to brand)
│       ├── vehicles/          # Vehicles CRUD + status history + Redis cache
│       ├── users/             # User entity/repository
│       ├── audit/             # MongoDB audit log (consumes fleet.audit events)
│       ├── messaging/         # RabbitMQ client provider
│       ├── mongo/             # Mongoose connection module
│       ├── redis/             # Cache module (Redis)
│       ├── common/            # Shared interfaces and exception filters
│       └── database/          # DataSource, migrations, seed scripts
│
└── frontend/                  # Angular SPA
    ├── Dockerfile
    ├── nginx.conf             # SPA fallback for the Docker-served build
    └── src/app/
        ├── core/               # Guards, interceptors, shared models
        ├── features/
        │   ├── auth/login/     # Login page
        │   └── vehicles/       # List, form, status-change dialog
        ├── services/           # HTTP services (auth, brand, model, vehicle)
        └── shared/layout/      # App shell (toolbar + router-outlet)
```
