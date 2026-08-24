# Auth Service

Login / register / JWT. El resto de OrderFlow confía en este token.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | No | app + Postgres |
| POST | `/auth/register` | No | crea usuario + JWT |
| POST | `/auth/login` | No | login + JWT |
| GET | `/auth/profile` | Bearer | usuario actual |

## Run

```bash
# docker compose up -d en la raíz
cp .env.example .env
npm install
npm run start:dev
```

http://localhost:3001

## Probar

```bash
curl -X POST http://localhost:3001/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"demo@orderflow.dev\",\"password\":\"secret123\"}"

curl -X POST http://localhost:3001/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"demo@orderflow.dev\",\"password\":\"secret123\"}"

curl http://localhost:3001/auth/profile ^
  -H "Authorization: Bearer TU_TOKEN"
```

## Notas

- password con bcrypt
- JWT: `sub`, `email`, `role` — ver [jwt-contract.md](../../docs/jwt-contract.md)
- solo usa `auth_db`
- `synchronize: true` solo en local; en prod van migraciones
- `/health` pega un `SELECT 1` a Postgres
