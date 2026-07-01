# Aivacol — Fleet Management Platform

Fullstack vehicle lifecycle management system built with **NestJS** (backend) and **Angular** (frontend).

---

## Index

- [About](#about)
- [What the project contains](#what-the-project-contains)
- [Swagger](#swagger)
- [Postman collection for testing](#postman-collection-for-testing)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [How to Run — Step by Step (Development)](#how-to-run--step-by-step-development)
- [How to Run — Step by Step (Docker)](#how-to-run--step-by-step-docker)

---

## About

Aivacol is a fleet management platform for rental companies. This repository implements the **vehicle lifecycle module** (`requirements.md`, Fullstack track): managing brands, models and vehicles, and tracking a vehicle's operational status over time.

---

## What the project contains

### Backend (NestJS)

- **Brands and models** — full CRUD, with models always linked to a brand. Soft delete only (`active` flag) — nothing is ever physically removed, preserving history.
- **Vehicles** — full CRUD (`license_plate`, `chassis`, `renavam`, `year`, linked model), with Redis-cached reads.
- **Status lifecycle** — a vehicle moves between `disponivel`, `alugado`, `manutencao` and `inativo`. Every transition is recorded in a status-history log, so you can see exactly when and why a vehicle's status changed.
- **Authentication** — JWT-based login with refresh tokens, password reset, and route guards. Every write operation records who made it (`created_by` / `updated_by`).
- **Cache** — Redis on brands/models/vehicles reads, invalidated on every mutation, configurable TTL.
- **Audit trail (bonus)** — every mutation (brands, models, vehicles) is published as a RabbitMQ event and persisted to MongoDB, independent of the relational database.
- **Tests** — Jest unit and integration tests covering services, controllers and validations.
- **Docker** — multistage Dockerfile + `docker-entrypoint.sh` that bootstraps the database on every start.

### Frontend (Angular)

- **Login screen** — authenticates against the backend and stores the JWT; a route guard blocks access to internal pages without a valid session.
- **Vehicle list** — table showing `license_plate`, `brand`, `model` and `year`, fetched from the API.
- **Vehicle create/edit form** — validated form with brand/model dropdowns and status changes.
- **HTTP interceptor** — attaches the JWT `Authorization: Bearer` header to every outgoing request.

---

## Swagger

The backend exposes interactive API documentation via **Swagger (OpenAPI)** at:

```
http://localhost:3000/api/docs
```

Use it to browse every endpoint, see request/response schemas, and try calls directly from the browser. Protected routes require a Bearer token: call `POST /auth/login` (e.g. with the seeded user — see [Access details](#access-details)), copy the returned `access_token`, then click **Authorize** in the Swagger UI and paste it in.

Besides Swagger, a ready-to-use Postman collection is provided for testing — see below.

---

## Postman collection for testing

The file [`postman_collection.json`](./postman_collection.json) at the root of the repo contains a full collection covering `auth`, `brands`, `models` and `vehicles`. Just download it and import into Postman — no extra setup needed.

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

---

## Requirements

Before you start, make sure you have:

- [Node.js](https://nodejs.org/) 22+ and npm
- [Docker](https://www.docker.com/) with Docker Compose v2 (`docker compose ...`)
- `bash` (used by `scripts/setup.sh`; ships by default on Linux/macOS, available via WSL/Git Bash on Windows)

No other tool is required locally — SQL Server, Redis, RabbitMQ and MongoDB run as Docker containers; Node/npm only need to be available on the host to run the backend and frontend in development mode.

---

## How to Run — Step by Step (Development)

The backend and frontend run **directly on the host** in development (`npm run start:dev` / `npm run start`) — they are **not** containerized for day-to-day development. Docker Compose is used only to provide the infrastructure services (SQL Server, Redis, RabbitMQ, MongoDB) that the apps connect to.

**1. Clone the repository**

```bash
git clone git@github.com:willmagna/fleet-management.git
cd fleet-management
```

**2. Run the first-time setup script**

```bash
make setup
```

This is a one-time step (safe to re-run any time, e.g. after pulling new migrations). It will, in order:

1. Check that Docker, Node and npm are available.
2. Create `backend/.env` from `backend/.env.example` (skipped if it already exists).
3. Start the infra containers (`sqlserver`, `redis`, `rabbitmq`, `mongodb`) and wait for SQL Server to report healthy.
4. Install backend dependencies, create the database, run migrations and seed initial data.
5. Install frontend dependencies.

**3. Start the project**

```bash
make start-dev
```

This brings up the infra containers (if not already running) and starts the backend (`:3000`) and frontend (`:4200`) together, in watch mode. `Ctrl+C` stops both.

**4. Open the app**

- Frontend: http://localhost:4200
- Login with the seeded user (see [Access details](#access-details) below)

That's it — steps 1 and 2 only need to run once per machine; after that, step 3 is all you need to get back to work.

Other useful targets — run `make help` to see them all:

| Command                               | Description                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `make setup`                          | Same as `./scripts/setup.sh`                                                  |
| `make start-dev`                      | Start infra + backend + frontend in dev mode                                  |
| `make infra-up` / `make infra-down`   | Start/stop only the infra containers                                          |
| `make db-reset`                       | Drop schema, re-run migrations, reseed                                        |
| `make docker-up` / `make docker-down` | Run the full stack in Docker (see [Docker](#how-to-run--step-by-step-docker)) |

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

## How to Run — Step by Step (Docker)

Docker here exists **only to simulate a production-like environment** — it is not used for day-to-day development (see [Development](#how-to-run--step-by-step-development) above). Use it to build and run the whole stack (backend + frontend + infra) as it would run in production.

**1. Clone the repository** (skip if already done)

```bash
git clone git@github.com:willmagna/fleet-management.git
cd fleet-management
```

**2. Build the images and start the full stack**

```bash
make docker-up
```

The backend container bootstraps itself on every start (creates the database if missing, runs pending migrations, seeds data), so this works the same way on a totally fresh volume or on a reused one.

**3. Open the app**

- Frontend: http://localhost:4200
- Login with the seeded user (see [Access details](#access-details-1) below)

**4. Stop everything when done**

```bash
make docker-down
```

Other useful commands:

```bash
make docker-logs    # tail logs from all services
```

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
