# Aivacol — Fleet Management Platform

Fullstack vehicle lifecycle management system built with **NestJS** (backend) and **Angular** (frontend).

---

## Requirements

- Node.js 18+
- Docker and Docker Compose
- npm 9+

---

## First-time Setup

Follow these steps in order the first time you clone the repository.

### 1. Start the database

```bash
docker-compose up -d
```

This starts PostgreSQL on port `5432`.

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` to match the credentials in `docker-compose.yml`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASS=<password from docker-compose.yml>
```

### 3. Install backend dependencies

```bash
cd backend && npm install
```

### 4. Run database migrations

```bash
npm run migration:run
```

This creates all tables (`brands`, `models`, `vehicles`, `users`).

### 5. Seed initial data

```bash
npm run seed
```

Loads `seed_vehicles.json` into the database (5 brands, 10 models, 12 vehicles). Safe to run multiple times.

### 6. Install frontend dependencies

```bash
cd ../frontend && npm install
```

---

## Running the Project

After the first-time setup is complete, use these commands day-to-day.

### Backend

```bash
cd backend

# Development (watch mode)
npm run start:dev

# Production
npm run start:prod
```

API runs at `http://localhost:3000`.

### Frontend

```bash
cd frontend

npm start
```

App runs at `http://localhost:4200`.

### Full environment (Docker)

```bash
docker-compose up --build
```

---

## Database

### Migrations

```bash
cd backend

# Apply all pending migrations
npm run migration:run

# Generate a new migration from entity changes
npm run migration:generate --name=MigrationName

# Revert the last migration
npm run migration:revert

# List applied migrations
npm run migration:show
```

### Seed

```bash
cd backend

npm run seed
```

---

## Tests

```bash
cd backend

# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# e2e tests
npm run test:e2e
```

---

## Project Structure

```
fleet-management/
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── auth/             # JWT authentication
│   │   ├── brands/           # Brands CRUD
│   │   ├── models/           # Models CRUD
│   │   ├── vehicles/         # Vehicles CRUD + Redis cache
│   │   └── database/         # DataSource, migrations, seed
│   └── seed_vehicles.json    # Initial dataset
└── frontend/                 # Angular SPA
    └── src/
        ├── app/auth/         # Login + JWT guard
        └── app/vehicles/     # Vehicle list and form
```

---

## Default Credentials

| Field    | Value     |
|----------|-----------|
| User     | `aivacol` |
| Password | `aivacol` |
