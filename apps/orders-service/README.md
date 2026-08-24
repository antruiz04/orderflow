# Orders Service

Pedidos + evento `order.created` a Kafka.

Al crear un pedido:

1. pide el precio a Catalog (HTTP)
2. calcula totales con decimal.js
3. guarda en `orders_db` como `pending`
4. publica en Redpanda
5. Inventory (después) va a confirmar o cancelar según stock

## Endpoints

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/health` | no (Postgres + Kafka) |
| POST | `/orders` | JWT |
| GET | `/orders` | JWT (los tuyos) |
| GET | `/orders/:id` | JWT (solo dueño) |

## Body

```json
{
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}
```

No mandes `unitPrice`. Si lo mandas, el pipe lo rechaza. El precio sale de Catalog.

## Run

Hace falta Auth (:3001), Catalog (:8000) y Docker (Postgres + Redpanda).

```bash
cp .env.example .env
# mismo JWT_SECRET que Auth
npm install
npm run start:dev
```

http://localhost:3002

## Notas

- precio lo saca Catalog, no el cliente
- plata con `decimal.js`
- stock no se valida acá → Kafka → Inventory
- hoy: save DB y después publish (si Kafka falla, el pedido puede quedar colgado en `pending`). Quiero meter outbox después — [events.md](../../docs/events.md)
- los GET a Catalog van en serie; con carritos grandes se puede paralelizar

Más: [events.md](../../docs/events.md), [jwt-contract.md](../../docs/jwt-contract.md)
