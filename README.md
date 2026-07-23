# OrderFlow

Event-driven order management platform built with microservices, Apache Kafka (Redpanda), NestJS, Django, PostgreSQL, JWT and Docker.

## Architecture (planned)

```
Client
  └── API Gateway (NestJS) — later
        ├── Auth Service (NestJS + PostgreSQL + JWT)
        ├── Catalog Service (Django + PostgreSQL)
        ├── Orders Service (NestJS + PostgreSQL + Kafka producer)
        ├── Inventory Service (NestJS + PostgreSQL + Kafka consumer)
        └── Notifications Service (Python + Kafka consumer)
```

## Infrastructure (Step 1 — done)

| Service    | Purpose                          | Local URL        |
|-----------|-----------------------------------|------------------|
| PostgreSQL | 4 databases (database-per-service) | `localhost:5433` |
| Redpanda   | Kafka-compatible message broker   | `localhost:19092` (host) / `redpanda:9092` (Docker) |
| Redis      | Cache / token blacklist           | `localhost:6379` |
| Mailhog    | Fake SMTP for notification demos  | http://localhost:8025 |

## Quick start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start infrastructure
docker compose up -d

# 3. Check services
docker compose ps
```

## Project structure

```
orderflow/
├── apps/                 # Microservices (added step by step)
├── docker/               # Init scripts, configs
├── docs/                 # Architecture notes + JWT contract
├── docker-compose.yml
└── README.md
```

## Docs

- [Architecture](docs/architecture.md) — why microservices, Kafka listeners, DB-per-service
- [JWT contract](docs/jwt-contract.md) — payload shared by Auth (Nest) and Catalog (Django)
## Development roadmap

- [x] Step 1: Infrastructure (Docker Compose)
- [x] Step 2: Auth Service (NestJS + JWT + PostgreSQL)
- [x] Step 3: Catalog Service (Django + admin)
- [ ] Step 4: Orders Service + Kafka producer
- [ ] Step 5: Inventory Service + Kafka consumer
- [ ] Step 6: Notifications Service (Python)
- [ ] Step 7: API Gateway + documentation

### Auth improvements (later)

- [ ] Replace TypeORM `synchronize: true` with explicit migrations (production-safe schema changes)
- [x] Health check verifies Postgres, not only that the Node process is up
- [x] Read `PORT` via ConfigService (same style as the rest of the app)

## Auth Service (local)

```bash
cd apps/auth-service
cp .env.example .env
npm install
npm run start:dev
```

Runs on http://localhost:3001 — see `apps/auth-service/README.md`.

## Catalog Service (local)

```bash
cd apps/catalog-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver 8000
```

Runs on http://localhost:8000 — see `apps/catalog-service/README.md`.
Use the same `JWT_SECRET` as Auth. Write endpoints need `role: admin`.
## License

MIT
