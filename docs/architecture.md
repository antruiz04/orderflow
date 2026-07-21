# OrderFlow — Architecture

## Why microservices here?

We split the system by **business capability**, not by technical layer:

| Service       | Owns                         | Database   |
|---------------|------------------------------|------------|
| Auth          | Users, login, JWT            | `auth_db`  |
| Catalog       | Products, categories, stock  | `catalog_db` |
| Orders        | Orders lifecycle             | `orders_db` |
| Inventory     | Stock reservations           | `inventory_db` |
| Notifications | Email/SMS side effects       | none (stateless consumer) |

Each service has its **own database**. Services never read another service's DB directly — they communicate via **HTTP** (sync) or **Kafka events** (async).

## Event flow (target)

```
1. Client creates order          → Orders Service
2. Orders publishes order.created → Kafka
3. Inventory consumes event       → reserves stock
4. Inventory publishes inventory.reserved OR inventory.failed
5. Orders updates status
6. Notifications sends confirmation email (Mailhog in dev)
```

## Why Redpanda instead of Kafka + Zookeeper?

Redpanda speaks the Kafka protocol but runs as a **single lightweight process**. For a portfolio project on a laptop, that's enough and recruiters still see "Kafka" in the README.

## Redpanda: two listeners (Docker vs host)

Kafka clients connect, then the broker replies with an **advertised** address for later traffic.

- Inside Docker: use `redpanda:9092` (PLAINTEXT listener).
- On your machine (`npm run start:dev`): use `localhost:19092` (OUTSIDE listener).

If you only advertise `redpanda:9092`, host clients connect to `localhost:9092` once, then fail because they cannot resolve the hostname `redpanda`.

## Why one PostgreSQL container with 4 databases?

In production you'd often use separate DB instances. Locally, one Postgres with 4 databases keeps the **database-per-service idea** without eating RAM. Each microservice still connects only to its own DB name.

## Schema changes (Auth / NestJS)

In local development Auth uses TypeORM `synchronize: true` so tables follow the entities when the app starts. That is convenient, but **not for production** — changing an entity could alter or drop columns with real data. The planned upgrade is explicit TypeORM migrations (`migration:generate` / `migration:run`).

Auth `/health` also runs `SELECT 1` against Postgres. If the DB is down, you get **503**, not a fake OK.
