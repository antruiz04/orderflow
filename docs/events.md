# Eventos Kafka

Por ahora solo Orders publica. Inventory y Notifications van a consumir después.

Broker local: `localhost:19092` desde el PC, `redpanda:9092` dentro de Docker.

## `order.created`

Producer: Orders  
Consumers (pendiente): Inventory, Notifications

```json
{
  "event": "order.created",
  "orderId": "uuid",
  "userId": "auth-user-uuid",
  "total": "199.98",
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "unitPrice": "99.99"
    }
  ],
  "createdAt": "2026-07-23T18:00:00.000Z"
}
```

- `orderId` también va como key del mensaje
- `userId` = `sub` del JWT
- `productId` = id de Catalog (sin FK cross-db)
- `unitPrice` = precio que Orders leyó de Catalog al crear el pedido

## Pendiente

| Topic | Dirección |
|-------|-----------|
| `inventory.reserved` | Inventory → Orders |
| `inventory.failed` | Inventory → Orders |
| update de status del pedido | Orders según respuesta de Inventory |

Si cambio el shape de un evento, lo actualizo acá (igual que el JWT).

## Limitación actual: dual-write

Hoy el flujo es:

1. `save()` en Postgres  
2. `publish` a Kafka  

Son dos sistemas distintos. Si el 1 funciona y el 2 falla, el pedido queda en `pending` y Inventory nunca se entera.

La idea para arreglarlo después es un **outbox**: guardar el evento en la misma transacción del pedido y que un worker lo publique a Kafka cuando pueda.
