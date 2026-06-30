# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fleet management platform (**Aivacol**) — a technical assessment implementing the vehicle lifecycle module for a rental company. This is a **Fullstack** project: NestJS backend + Angular frontend.

See `requirements.md` for the full specification.

---

## Current Implementation Status

### Backend — what is done
- [x] Database module with custom TypeORM `DataSource` provider
- [x] `brands` module — full CRUD (`GET /brands`, `POST /brands`, `PUT /brands/:id`, `DELETE /brands/:id`)
- [x] `models` module — full CRUD, always linked to a brand via `brand_id`
- [x] `vehicles` module — full CRUD, always linked to a model via `model_id`
- [x] TypeORM migrations — initial schema applied (`src/database/migrations/`)
- [x] Seed script — `npm run seed` loads `seed_vehicles.json`

### Backend — what is pending
- [ ] `auth` module — JWT authentication, login endpoint, `aivacol` default user
- [ ] JWT guard — all routes must be protected
- [ ] `users` entity and table — `id`, `nickname`, `name`, `email`
- [ ] Redis cache — vehicle queries cached with configurable TTL, invalidated on mutations
- [ ] Input validation — DTOs with `class-validator`
- [ ] Unit and integration tests with Jest

### Frontend — what is done
- [x] Angular project scaffolded (minimal — only `app.ts`, `app.routes.ts`, `app.config.ts`)

### Frontend — what is pending
- [ ] Login page with JWT guard
- [ ] Vehicle list (table/cards: `license_plate`, `brand`, `model`, `year`)
- [ ] Vehicle create/edit form with brand/model dropdowns
- [ ] HTTP interceptor to attach JWT token to every request

---

## Architecture

### Backend (`/backend`)

NestJS with **custom provider DI pattern** — does NOT use `@InjectRepository` from `@nestjs/typeorm`. Instead:

1. `DatabaseModule` exposes a `DATA_SOURCE` token (a live `DataSource` instance)
2. Each feature module declares its own `*_REPOSITORY` provider injected from `DATA_SOURCE`
3. Services inject the repository via `@Inject('BRAND_REPOSITORY')` etc.

```
AppModule
├── DatabaseModule        → provides DATA_SOURCE (postgres DataSource)
├── BrandsModule          → BRAND_REPOSITORY → BrandsService → BrandsController
├── ModelsModule          → MODEL_REPOSITORY → ModelsService → ModelsController
└── VehiclesModule        → VEHICLE_REPOSITORY → VehiclesService → VehiclesController
```

Key files:
- `src/database/database.providers.ts` — creates and initializes the `DataSource`
- `src/database/database.modules.ts` — wraps providers, exported to feature modules
- `src/database/data-source.ts` — standalone `DataSource` for the TypeORM CLI (reads `.env`)
- `src/database/seed.ts` — seed script entry point

### Frontend (`/frontend`)

Angular 19 standalone components. Currently only the shell exists. All feature modules are pending.

---

## Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Runtime    | Node.js 18+                       |
| Framework  | NestJS 11                         |
| ORM        | TypeORM 1.0.0                     |
| Database   | PostgreSQL 16 (via Docker)        |
| Cache      | Redis (pending)                   |
| Auth       | JWT (pending)                     |
| Tests      | Jest                              |
| Frontend   | Angular 19, TypeScript, RxJS      |

> Note: requirements mention SQL Server but the project uses **PostgreSQL**.

---

## Database Schema

```
brands
  id (uuid PK), name (unique), created_at, updated_at, created_by

models
  id (uuid PK), name, brand_id (FK → brands), created_at, updated_at, created_by

vehicles
  id (uuid PK), license_plate (unique), chassis (unique), renavam (unique),
  year, model_id (FK → models), created_at, updated_at, created_by

users  ← PENDING (entity not yet created)
  id, nickname, name, email
```

FK rules: both `models.brand_id` and `vehicles.model_id` use `ON DELETE RESTRICT`.

All migration files live in `src/database/migrations/`. Applied migrations:
- `1782782118922-InitialSchema` — creates `brands`, `models`, `vehicles`

---

## Commands

### Backend (run from `backend/`)

```bash
# Install
npm install

# Development (watch)
npm run start:dev

# Tests
npm run test
npm run test -- --testPathPattern=vehicles.service   # single file
npm run test:e2e
npm run test:cov

# Migrations
npm run migration:run          # apply pending
npm run migration:revert       # undo last
npm run migration:generate --name=DescriptiveName   # generate from entity diff
npm run migration:create --name=DescriptiveName     # blank migration
npm run migration:show         # list applied

# Seed
npm run seed                   # loads seed_vehicles.json (idempotent)
```

### Frontend (run from `frontend/`)

```bash
npm install
npm start       # dev server at http://localhost:4200
npm test
```

### Docker

```bash
docker-compose up -d           # start PostgreSQL only
docker-compose up --build      # full environment
```

---

## Environment Variables

File: `backend/.env`

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASS=<see docker-compose.yml>
```

---

## Conventions to Follow

- **Repository injection**: always use the `*_REPOSITORY` / `DATA_SOURCE` custom token pattern — do not introduce `TypeOrmModule.forFeature()` or `@InjectRepository()`.
- **Entities**: use `@PrimaryGeneratedColumn('uuid')`, `@CreateDateColumn`, `@UpdateDateColumn`. Snake-case column names via `{ name: 'snake_case' }`.
- **Migrations**: never use `synchronize: true`. All schema changes go through a migration.
- **created_by**: always a `string` column (stores the username/nickname of who created the record).
- **Module structure**: each feature has `*.entity.ts`, `*.providers.ts`, `*.module.ts`, `*.service.ts`, `*.controller.ts`.

---

## Seed Data

`backend/seed_vehicles.json` — 5 brands, 10 models, 12 vehicles with fixed UUIDs.
Loaded via `npm run seed` (uses `.orIgnore()` — safe to run multiple times).
