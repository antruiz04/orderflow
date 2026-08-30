# API Gateway

Una sola puerta de entrada. El cliente habla con `:3000` y el gateway reenvía a cada servicio (incluye el header `Authorization`).

| Prefijo | Destino |
|---------|---------|
| `/auth` | Auth `:3001` |
| `/api` | Catalog `:8000` |
| `/orders` | Orders `:3002` |
| `/stock` | Inventory `:3003` |
| `/health` | chequea que los 4 respondan |

No valida JWT acá: eso sigue en Catalog/Orders. El gateway solo rutea.

## Run

```bash
cd apps/api-gateway
cp .env.example .env
npm install
npm run start:dev
```

http://localhost:3000

Ejemplo: `POST http://localhost:3000/auth/login` en vez de pegarle a `:3001`.
