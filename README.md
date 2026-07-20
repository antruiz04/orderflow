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
| PostgreSQL | 4 databases (database-per-service) | `localhost:5432` |
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
├── docs/                 # Architecture notes
├── docker-compose.yml
└── README.md
```

## Development roadmap

- [x] Step 1: Infrastructure (Docker Compose)
- [ ] Step 2: Auth Service (NestJS + JWT + PostgreSQL)
- [ ] Step 3: Catalog Service (Django + admin)
- [ ] Step 4: Orders Service + Kafka producer
- [ ] Step 5: Inventory Service + Kafka consumer
- [ ] Step 6: Notifications Service (Python)
- [ ] Step 7: API Gateway + documentation

## License

MIT
