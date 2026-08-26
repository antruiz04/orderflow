# Eventos Kafka

Broker local: `localhost:19092` desde el PC, `redpanda:9092` dentro de Docker.

## Flujo

```
Orders → order.created
         ↓
Inventory reserva stock
         ↓
   ┌─────┴─────┐
   ↓           ↓
inventory.reserved   inventory.failed
   ↓           ↓
Orders → confirmed   Orders → cancelled
```

## `order.created`

Producer: Orders  
Consumer: Inventory

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

## `inventory.reserved`

Producer: Inventory  
Consumer: Orders → status `confirmed`

```json
{
  "event": "inventory.reserved",
  "orderId": "uuid",
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}
```

## `inventory.failed`

Producer: Inventory  
Consumer: Orders → status `cancelled`

```json
{
  "event": "inventory.failed",
  "orderId": "uuid",
  "reason": "insufficient_stock productId=1 need=5 have=2"
}
```

Si cambio el shape de un evento, lo actualizo acá (igual que el JWT).

## Limitación actual: dual-write

Hoy el flujo es:

1. `save()` en Postgres  
2. `publish` a Kafka  

Son dos sistemas distintos. Si el 1 funciona y el 2 falla, el pedido queda en `pending` y Inventory nunca se entera.

La idea para arreglarlo después es un **outbox**: guardar el evento en la misma transacción del pedido y que un worker lo publique a Kafka cuando pueda.
