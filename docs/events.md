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
   ↓     ↓           ↓     ↓
Orders → confirmed   Orders → cancelled
Notifications → mail (Mailhog)
```

## `order.created`

Producer: Orders  
Consumer: Inventory

```json
{
  "event": "order.created",
  "orderId": "uuid",
  "userId": "auth-user-uuid",
  "userEmail": "user@example.com",
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
- `userEmail` = email del JWT (para que Notifications no tenga que pegarle a Auth)
- `productId` = id de Catalog (sin FK cross-db)
- `unitPrice` = precio que Orders leyó de Catalog al crear el pedido

### De dónde sale `userEmail`

Orders no lo inventa ni lo guarda en su DB. Lo saca del JWT del request:

1. Auth firma el token con `email` en el payload (`signToken` en auth-service)
2. El cliente manda `Authorization: Bearer ...` al crear el pedido
3. Orders valida el token localmente (`JwtStrategy`) y expone `user.email` vía `@CurrentUser()`
4. Ese valor va en `order.created`; Inventory lo reenvía tal cual en reserved/failed

Inventory no lo usa para reservar stock — solo lo pasa hacia Notifications.

## Datos "de paso" en los eventos

Inventory reenvía `userEmail` sin necesitarlo. Es el mensajero: recibe `order.created`, hace su trabajo de stock, y publica reserved/failed con los mismos campos que Notifications necesita.

**Por qué así:** la alternativa es que Notifications llame a Auth por HTTP para resolver el email a partir de `userId`. Eso reintroduce acoplamiento síncrono (Auth caído = sin mails) y otra dependencia en runtime.

**Trade-off:** cuanto más dato viaja "de paso" en los eventos, más grande y frágil se vuelve el contrato entre servicios. Si el usuario cambia de email en Auth, los eventos viejos en Kafka siguen con el email anterior hasta que se procesen. Para este demo está bien; en prod se podría mandar solo `userId` y que Notifications consulte Auth con cache, o usar un evento `user.email_changed` aparte.

## `inventory.reserved`

Producer: Inventory  
Consumers: Orders → `confirmed` · Notifications → mail

```json
{
  "event": "inventory.reserved",
  "orderId": "uuid",
  "userId": "auth-user-uuid",
  "userEmail": "user@example.com",
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}
```

## `inventory.failed`

Producer: Inventory  
Consumers: Orders → `cancelled` · Notifications → mail

```json
{
  "event": "inventory.failed",
  "orderId": "uuid",
  "userId": "auth-user-uuid",
  "userEmail": "user@example.com",
  "reason": "insufficient_stock productId=1 need=5 have=2"
}
```

Si cambio el shape de un evento, lo actualizo acá (igual que el JWT).

## Limitación actual: dual-write

Hoy el flujo es:

1. `save()` en Postgres  
2. `publish` a Kafka  

Si el 1 funciona y el 2 falla, el pedido queda en `pending` y Inventory nunca se entera. Más adelante: outbox.
