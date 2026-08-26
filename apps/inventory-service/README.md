# Inventory Service

Escucha `order.created`, reserva stock en `inventory_db` y publica:

- `inventory.reserved` → Orders pone el pedido en `confirmed`
- `inventory.failed` → Orders lo cancela

El stock de acá es el de reservas. El `stock` de Catalog es más bien de vitrina; para demos cargás cantidad con `POST /stock`.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Postgres + Kafka |
| GET | `/stock` | listar stock |
| POST | `/stock` | upsert `{ productId, quantity }` |

## Run

```bash
cp .env.example .env
npm install
npm run start:dev
```

http://localhost:3003

## Flujo demo

1. En Catalog creás un producto (anotá el `id`)
2. `POST /stock` con ese `productId` y cantidad
3. Creás un pedido en Orders
4. Inventory descuenta y Orders pasa a `confirmed` (o `cancelled` si no alcanza)

## Notas

- idempotencia: tabla `processed_orders` para no descontar dos veces el mismo pedido
- reserva all-or-nothing (si falla un ítem, no descuenta nada)
