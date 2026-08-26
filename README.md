# OrderFlow

Pedido + inventario con microservicios. NestJS, Django, Postgres, JWT y Kafka (Redpanda).

## Arquitectura

```
Client
  └── API Gateway (NestJS) — pendiente
        ├── Auth (NestJS + Postgres + JWT)
        ├── Catalog (Django + Postgres)
        ├── Orders (NestJS + Postgres + Kafka producer/consumer)
        ├── Inventory (NestJS + Postgres + Kafka consumer/producer)
        └── Notifications (Python consumer) — pendiente
```

## Infra local

| Servicio   | Para qué              | URL |
|------------|-----------------------|-----|
| PostgreSQL | una DB por servicio   | `localhost:5433` |
| Redpanda   | Kafka-compatible      | `localhost:19092` (PC) / `redpanda:9092` (Docker) |
| Redis      | cache / tokens (más adelante) | `localhost:6379` |
| Mailhog    | emails fake           | http://localhost:8025 |

```bash
cp .env.example .env
docker compose up -d
docker compose ps
```

## Estructura

```
orderflow/
├── apps/
├── docker/
├── docs/
├── docker-compose.yml
└── README.md
```

## Docs

- [architecture.md](docs/architecture.md)
- [jwt-contract.md](docs/jwt-contract.md) — payload del JWT entre servicios
- [events.md](docs/events.md) — eventos Kafka

## Roadmap

- [x] Infra (Docker Compose)
- [x] Auth
- [x] Catalog
- [x] Orders + producer Kafka + consumer inventory.*
- [x] Inventory (consumer order.created → reserved/failed)
- [ ] Notifications
- [ ] API Gateway

### Pendiente Auth

- [ ] Migraciones TypeORM (sacar `synchronize: true`)
- [x] `/health` chequea Postgres
- [x] Puerto vía ConfigService

### Pendiente Orders

- [ ] Outbox: ahora hago save en Postgres y luego publish a Kafka. Si Kafka falla a mitad, el pedido queda `pending` sin evento. Quiero guardar el evento en la misma transacción y publicarlo después.
- [ ] Pedir precios a Catalog en paralelo (`Promise.all`) y no repetir el mismo `productId`
- [x] Precio desde Catalog (no confío en lo que manda el cliente)
- [x] Totales con `decimal.js`

## Correr Auth

```bash
cd apps/auth-service
cp .env.example .env
npm install
npm run start:dev
```

http://localhost:3001

## Correr Catalog

```bash
cd apps/catalog-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver 8000
```

http://localhost:8000 — mismo `JWT_SECRET` que Auth. Escritura solo con `role: admin`.

## Correr Orders

```bash
cd apps/orders-service
cp .env.example .env
npm install
npm run start:dev
```

http://localhost:3002 — publica `order.created` y escucha `inventory.reserved` / `inventory.failed`.

## Correr Inventory

```bash
cd apps/inventory-service
cp .env.example .env
npm install
npm run start:dev
```

http://localhost:3003 — carga stock con `POST /stock` (`productId` de Catalog + `quantity`).

## License

MIT
