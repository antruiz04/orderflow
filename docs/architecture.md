# Architecture

Cada servicio tiene su propia base. No se cruzan tablas entre servicios: hablan por HTTP o por Kafka.

| Service       | Qué maneja              | DB |
|---------------|-------------------------|----|
| Auth          | users, login, JWT       | `auth_db` |
| Catalog       | products, categories    | `catalog_db` |
| Orders        | pedidos                 | `orders_db` |
| Inventory     | reservas de stock       | `inventory_db` |
| Notifications | emails (side effects)   | — |

## Flujo objetivo

```
1. Cliente crea pedido            → Orders
2. Orders publica order.created   → Kafka
3. Inventory reserva stock
4. Inventory publica reserved / failed
5. Orders actualiza status
6. Notifications manda mail (Mailhog en local)
```

## Redpanda

Uso Redpanda porque habla el protocolo de Kafka y es más liviano que Kafka + Zookeeper en la laptop.

Dos listeners:

- Dentro de Docker: `redpanda:9092`
- Desde el PC (`npm run start:dev`): `localhost:19092`

Si solo publicas `redpanda:9092`, desde el host se rompe porque ese hostname no existe fuera de la red de Docker.

## Postgres

En prod normalmente cada servicio tendría su instancia. Acá uso un solo contenedor con 4 databases para no comer tanta RAM. Cada app solo se conecta a la suya.

## Auth / TypeORM

En local `synchronize: true` para no pelearme con migraciones mientras armo el servicio. En prod eso no va: puede romper columnas. Pendiente pasar a migraciones.

`/health` hace `SELECT 1`. Si Postgres está caído → 503.

## Catalog + JWT

Catalog no tiene usuarios propios. Para escribir valida el JWT de Auth con el mismo `JWT_SECRET`. Solo `admin` puede crear/editar. Lectura pública.

Detalle del payload: [jwt-contract.md](jwt-contract.md).
