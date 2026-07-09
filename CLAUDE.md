# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fleet management platform (**Aivacol**) — a technical assessment implementing the vehicle lifecycle module for a rental company. This is a **Fullstack** project: NestJS backend + Angular frontend.

See `requirements.md` for the full specification.

---

## Current Implementation Status

### Backend — what is done
- [x] Database module with custom TypeORM `DataSource` provider (SQL Server / `mssql`)
- [x] `brands` module — full CRUD with soft delete (`active` flag), `updated_by` field
- [x] `models` module — full CRUD with soft delete, linked to brand via `brand_id`
- [x] `vehicles` module — full CRUD with soft delete, linked to model via `model_id`; Redis cache on reads, invalidated on mutations; `status` field (`disponivel` | `alugado` | `manutencao` | `inativo`, default `disponivel`); `PATCH /vehicles/:id/status` (changeStatus); `GET /vehicles/:id/status-history`; `vehicle_status_history` table tracks every transition
- [x] `users` entity and table — `id`, `nickname`, `name`, `email`, `password`
- [x] `auth` module — JWT authentication:
  - `POST /auth/login` — returns `access_token` (15 min) + `refresh_token` (7 days)
  - `POST /auth/refresh` — exchanges refresh token for a new access token
  - `POST /auth/logout` — revokes refresh token in Redis
  - `POST /auth/forgot-password` — generates reset token (UUID, 1 h TTL in Redis), logs to console
  - `POST /auth/reset-password` — validates token, updates password hash
- [x] JWT guard — global `APP_GUARD`; `@Public()` decorator exempts open routes
- [x] Redis module — `@keyv/redis` via `@nestjs/cache-manager`, global TTL configurable
- [x] TypeORM migrations — 6 migrations applied (`src/database/migrations/`)
- [x] Seed scripts — `npm run seed` loads `seed_users.json` + `seed_vehicles.json`; uses `IDENTITY_INSERT ON/OFF` for SQL Server
- [x] `db:init` script — creates `fleet_management` database in SQL Server if it doesn't exist
- [x] `db:reset` — drops schema, runs all migrations, seeds data
- [x] Input validation — `class-validator` + `ValidationPipe` (currently applied to all `auth` DTOs; brands/models/vehicles DTOs still need decorators)
- [x] **Mensageria + Auditoria (bônus)** — RabbitMQ (`@nestjs/microservices`, AMQP transport) + MongoDB (`@nestjs/mongoose`):
  - Toda mutação em brands/models/vehicles publica evento `fleet.audit` via `ClientProxy.emit()` (fire-and-forget)
  - `AuditConsumer` (`@EventPattern('fleet.audit')`) persiste documentos na coleção `audit_logs` do MongoDB
  - App roda como hybrid (HTTP + microservice) via `connectMicroservice()` + `startAllMicroservices()` em `main.ts`

### Backend — what is pending
- [x] **Input validation on feature DTOs** — `CreateBrandDto`, `UpdateBrandDto`, `CreateModelDto`, `UpdateModelDto`, `CreateVehicleDto`, `UpdateVehicleDto` com `class-validator`; controllers usam DTOs tipados
- [x] **`created_by` / `updated_by` from JWT** — controllers extract `req.user.nickname` via `@Request()` and pass to service methods; no longer hardcoded
- [x] **Unit and integration tests** — Jest; 162 tests across 16 spec files: service unit tests (brands, models, vehicles, auth, users, audit), controller integration tests (brands, vehicles), consumer test (audit.consumer), DTO validation tests (auth DTOs + ChangeStatusDto), global exception filter test
- [x] **Cache on brands and models** — same pattern as `vehicles`: Redis cache on `findAll`/`findOne`, invalidated on `create`/`update`/`remove`

### Frontend — what is done
- [x] Angular project scaffolded (minimal — only `app.ts`, `app.routes.ts`, `app.config.ts`)

### Frontend — what is pending
- [ ] Login page with JWT guard
- [ ] Vehicle list (table/cards: `license_plate`, `brand`, `model`, `year`)
- [ ] Vehicle create/edit form with brand/model dropdowns
- [ ] HTTP interceptor to attach JWT `Authorization: Bearer` header to every request

---

## Architecture

### Backend (`/backend`)

NestJS with **custom provider DI pattern** — does NOT use `@InjectRepository` from `@nestjs/typeorm`. Instead:

1. `DatabaseModule` exposes a `DATA_SOURCE` token (a live `DataSource` instance)
2. Each feature module declares its own `*_REPOSITORY` provider injected from `DATA_SOURCE`
3. Services inject the repository via `@Inject('BRAND_REPOSITORY')` etc.

```
AppModule
├── RedisModule           → configures CacheModule (isGlobal: true) with @keyv/redis
├── DatabaseModule        → provides DATA_SOURCE (SQL Server DataSource)
├── AuthModule            → JwtStrategy, JwtAuthGuard (global), AuthService, AuthController
│   └── UsersModule       → USER_REPOSITORY → UsersService (findById, findByNicknameOrEmail, ...)
├── BrandsModule          → BRAND_REPOSITORY → BrandsService → BrandsController
├── ModelsModule          → MODEL_REPOSITORY → ModelsService → ModelsController
├── VehiclesModule        → VEHICLE_REPOSITORY → VehiclesService (+ Redis cache) → VehiclesController
├── MessagingModule       → provides RABBITMQ_CLIENT token (ClientProxy, AMQP transport)
└── AuditModule           → MongoModule + AuditLog schema + AuditService + AuditConsumer
```

Key files:
- `src/database/database.providers.ts` — creates and initializes the `DataSource`
- `src/database/database.modules.ts` — wraps providers, exported to feature modules
- `src/database/data-source.ts` — standalone `DataSource` for the TypeORM CLI (reads `.env`)
- `src/messaging/messaging.providers.ts` — `RABBITMQ_CLIENT` provider (ClientProxyFactory pattern)
- `src/messaging/messaging.module.ts` — exports `RABBITMQ_CLIENT`; imported by feature modules
- `src/mongo/mongo.module.ts` — `MongooseModule.forRoot()` connection to `fleet_audit` DB
- `src/audit/audit.schema.ts` — Mongoose `AuditLog` schema (`audit_logs` collection)
- `src/audit/audit.service.ts` — single `create(event)` method; writes to MongoDB
- `src/audit/audit.consumer.ts` — `@EventPattern('fleet.audit')` microservice listener
- `src/audit/audit.module.ts` — wires Mongoose feature + AuditService + AuditConsumer
- `src/common/interfaces/audit-event.interface.ts` — shared `AuditEvent` type
- `src/database/init-db.ts` — connects to `master`, creates `fleet_management` DB if absent
- `src/database/seed.ts` — seed entry point; handles SQL Server `IDENTITY_INSERT`
- `src/database/seeds_data/seed_users.json` — default `aivacol` user (password hashed at seed time)
- `src/database/seeds_data/seed_vehicles.json` — 5 brands, 10 models, 12 vehicles
- `src/redis/redis.module.ts` — configures `@nestjs/cache-manager` with Redis
- `src/auth/guards/jwt-auth.guard.ts` — global guard; skips routes decorated with `@Public()`
- `src/auth/decorators/public.decorator.ts` — `@Public()` metadata decorator

### Frontend (`/frontend`)

Angular 19 standalone components. Currently only the shell exists. All feature modules are pending.

---

## Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Runtime    | Node.js 18+                             |
| Framework  | NestJS 11                               |
| ORM        | TypeORM 1.0.0                           |
| Database   | **SQL Server 2022** (via Docker, `mssql` driver) |
| Cache      | Redis 7 (via Docker, `@keyv/redis`)     |
| Mensageria | **RabbitMQ 3** (via Docker, `@nestjs/microservices` AMQP) |
| Auditoria  | **MongoDB 7** (via Docker, `@nestjs/mongoose`) |
| Auth       | JWT — `@nestjs/jwt` + `passport-jwt`    |
| Validation | `class-validator` + `class-transformer` |
| Tests      | Jest — 162 tests, 16 suites, all passing |
| Frontend   | Angular 19, TypeScript, RxJS            |

---

## Database Schema

```
users
  id (INT IDENTITY PK), nickname (unique), name, email (unique), password,
  created_at, updated_at

brands
  id (INT IDENTITY PK), name (unique), active (bit, default 1),
  created_at, updated_at, created_by, updated_by (nullable)

models
  id (INT IDENTITY PK), name, brand_id (FK → brands), active (bit, default 1),
  created_at, updated_at, created_by, updated_by (nullable)

vehicles
  id (INT IDENTITY PK), license_plate (unique), chassis (unique), renavam (unique),
  year, model_id (FK → models), status (nvarchar, default 'disponivel'),
  active (bit, default 1), created_at, updated_at, created_by, updated_by (nullable)

vehicle_status_history
  id (INT IDENTITY PK), vehicle_id (FK → vehicles), from_status (nullable),
  to_status, changed_by, changed_at (DATETIME2 DEFAULT GETDATE()), notes (nullable)
```

FK rules: `models.brand_id`, `vehicles.model_id`, and `vehicle_status_history.vehicle_id` use `ON DELETE NO ACTION`.

Vehicle `status` values: `disponivel` | `alugado` | `manutencao` | `inativo`.
`DELETE /vehicles/:id` sets `active = 0` and forces `status = 'inativo'`.
`PATCH /vehicles/:id/status` — transitions status, inserts history record, emits audit event.
`GET /vehicles/:id/status-history` — returns full history ordered by `changed_at DESC`.

All entities use **soft delete** — `DELETE` endpoints set `active = 0` and `updated_by`; records are never physically removed. `findAll` and `findOne` always filter `WHERE active = 1`.

Migrations in `src/database/migrations/`:
| File | Description |
|------|-------------|
| `1782782118922-InitialSchema` | Creates `brands`, `models`, `vehicles` |
| `1782900000000-CreateUsersTable` | Creates `users` |
| `1782900100000-AddActiveToBrands` | Adds `active` to `brands` |
| `1782900200000-AddUpdatedByToBrands` | Adds `updated_by` to `brands` |
| `1782900300000-AddActiveAndUpdatedByToModels` | Adds `active` + `updated_by` to `models` |
| `1782900400000-AddActiveAndUpdatedByToVehicles` | Adds `active` + `updated_by` to `vehicles` |
| `1782900500000-AddStatusToVehicles` | Adds `status` (default `'disponivel'`) to `vehicles` |
| `1782900600000-CreateVehicleStatusHistory` | Creates `vehicle_status_history` with FK to `vehicles` |

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

# Database
npm run db:init          # create fleet_management DB in SQL Server (safe to re-run)
npm run db:reset         # db:init + schema:drop + migration:run + seed

# Migrations
npm run migration:run          # apply pending
npm run migration:revert       # undo last
npm run migration:generate --name=DescriptiveName   # generate from entity diff
npm run migration:create --name=DescriptiveName     # blank migration
npm run migration:show         # list applied

# Seed
npm run seed             # idempotent; uses IDENTITY_INSERT ON/OFF + DBCC CHECKIDENT
```

### Frontend (run from `frontend/`)

```bash
npm install
npm start       # dev server at http://localhost:4200
npm test
```

### Docker

```bash
docker-compose up -d     # start SQL Server + Redis + RabbitMQ + MongoDB
```

Services exposed:
| Service    | Port  |
|------------|-------|
| SQL Server | 1433  |
| Redis      | 6379  |
| RabbitMQ   | 5672 (AMQP) · 15672 (Management UI) |
| MongoDB    | 27017 |

---

## Environment Variables

File: `backend/.env`

```env
# SERVER
SERVER_PORT=3000

# DATABASE (SQL Server)
DB_HOST=localhost
DB_PORT=1433
DB_NAME=fleet_management
DB_USER=sa
DB_PASS=Aivacol@2026

# JWT
JWT_SECRET=aivacol_jwt_secret_key_2026
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=aivacol_refresh_secret_key_2026
JWT_REFRESH_EXPIRES_IN=7d

# REDIS
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_TTL=60

# RABBITMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# MONGODB
MONGODB_URL=mongodb://localhost:27017/fleet_audit
```

---

## Conventions to Follow

- **Repository injection**: always use the `*_REPOSITORY` / `DATA_SOURCE` custom token pattern — do not introduce `TypeOrmModule.forFeature()` or `@InjectRepository()`.
- **Entities**: use `@PrimaryGeneratedColumn()` (INT IDENTITY), `@CreateDateColumn`, `@UpdateDateColumn`. Snake-case column names via `{ name: 'snake_case' }`. Union types (`string | null`) require explicit `type: 'nvarchar'` in `@Column` for SQL Server.
- **Migrations**: never use `synchronize: true`. All schema changes go through a migration. Write T-SQL (not PostgreSQL SQL).
- **Soft delete**: never use hard DELETE. Set `active = false` + `updatedBy`. Filter `WHERE active = 1` in all queries.
- **created_by / updated_by**: `string` columns. Controllers extract `req.user.nickname` from the JWT payload and pass it as the `nickname` parameter to service methods (`create`, `update`, `remove`).
- **Module structure**: each feature has `*.entity.ts`, `*.providers.ts`, `*.module.ts`, `*.service.ts`, `*.controller.ts`.
- **Auth**: use `@Public()` on any route that must be accessible without a JWT. All other routes are protected by the global `JwtAuthGuard`.
- **Redis cache keys**: `vehicles:all`/`vehicles:{id}`, `brands:all`/`brands:{id}`, `models:all`/`models:{id}`. Mutating operations (`create`, `update`, `changeStatus`, `remove`) delete both the `:all` and `:{id}` keys for that entity. Note: `Model.brand` and `Vehicle.model` are `eager: true` relations, so a brand/model rename can leave a denormalized name cached in a *different* entity's cache entry for up to `CACHE_TTL` (60s) — accepted, bounded staleness, not cross-invalidated.
- **Audit events**: every mutating operation in brands, models, and vehicles emits `fleet.audit` via `ClientProxy.emit()` (fire-and-forget, non-blocking). The `AuditConsumer` picks it up from RabbitMQ and persists to MongoDB `audit_logs`. Do not await the emit — use `.subscribe({ error: ... })`.
- **Vehicle status**: `changeStatus(id, newStatus, nickname, notes?)` throws `BadRequestException` if `vehicle.status === newStatus`. Always writes a `vehicle_status_history` row on create, changeStatus, and remove. `remove` forces `status = 'inativo'` alongside `active = false`.

---

## Seed Data

`src/database/seeds_data/seed_users.json` — 1 default user (`aivacol`, password hashed with bcrypt at seed time).
`src/database/seeds_data/seed_vehicles.json` — 5 brands, 10 models, 12 vehicles with sequential integer IDs.

Seed uses `SET IDENTITY_INSERT [table] ON/OFF` to insert explicit IDs. After seeding, calls `DBCC CHECKIDENT` on each table to resync the identity counter. Safe to run multiple times (duplicate key errors are silently ignored).

---

## Tests

Run from `backend/` with `npm run test`. All 162 tests pass with no external dependencies (fully mocked).

| Spec file | What it covers |
|---|---|
| `src/brands/brands.service.spec.ts` | Cache hit/miss; invalidação de cache; findAll (active filter), findOne (NotFoundException), create (createdBy), update (updatedBy), remove (soft delete); verifica emissão de `fleet.audit` em cada mutação |
| `src/models/models.service.spec.ts` | Mesmas regras para models, incluindo cache hit/miss e invalidação; verifica emissão de `fleet.audit` |
| `src/vehicles/vehicles.service.spec.ts` | Cache hit/miss; invalidação de cache; create (grava status history inicial); update; changeStatus (BadRequestException p/ status igual, grava history, emite audit); remove (status→inativo, grava history); getStatusHistory |
| `src/auth/auth.service.spec.ts` | login (valid creds, wrong user, wrong password, token em cache); refresh (valid, invalid signature, revoked); logout; forgotPassword; resetPassword |
| `src/users/users.service.spec.ts` | findById, findByNicknameOrEmail (QueryBuilder OR), findByEmail, updatePassword |
| `src/audit/audit.service.spec.ts` | AuditService.create persiste no MongoDB; cobre todos action/entity types |
| `src/audit/audit.consumer.spec.ts` | AuditConsumer.handleAuditEvent delega para AuditService; não lança para nenhum action type |
| `src/brands/brands.controller.spec.ts` | Controller delega para BrandsService; passa `req.user.nickname` em rotas mutantes |
| `src/vehicles/vehicles.controller.spec.ts` | Controller delega para VehiclesService; cobre findAll, findOne, getStatusHistory, create, update, changeStatus, remove |
| `src/auth/dto/auth.dto.spec.ts` | LoginDto, ForgotPasswordDto (IsEmail), ResetPasswordDto (MinLength 6), RefreshTokenDto |
| `src/vehicles/dto/change-status.dto.spec.ts` | ChangeStatusDto: todos os status válidos passam; status inválido/ausente falha; notes opcional, MaxLength 500 |

### Mocking conventions used in tests

- Repositories: `{ provide: 'X_REPOSITORY', useValue: mockRepo }` com jest.fn() por método
- CACHE_MANAGER: `{ get, set, del }` jest.fn() via `{ provide: CACHE_MANAGER, useValue: cache }`
- RABBITMQ_CLIENT: `{ emit: jest.fn().mockReturnValue({ subscribe: jest.fn() }) }` — simula o Observable retornado por `ClientProxy.emit()`
- MongoDB model: `{ provide: getModelToken(AuditLog.name), useValue: { create: jest.fn() } }`
- `bcryptjs`: `jest.mock('bcryptjs')` + `jest.mocked(compare/hash)` nos testes de AuthService
- Services em controller tests: mock completo via `{ provide: XService, useValue: mockService }`

---

## Git Commits

Never add `Co-Authored-By: Claude` or any Claude/Anthropic authorship line to commit messages.
