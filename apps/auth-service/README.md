# Auth Service

Este microservicio se encarga de una sola cosa: **saber quién eres**.

Aquí registras usuarios, inicias sesión y recibes un JWT. Los demás servicios de OrderFlow más adelante van a confiar en ese token.

## Qué endpoints tiene

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | No | Proceso + conexión a Postgres (`database: up/down`) |
| POST | `/auth/register` | No | Crea cuenta y devuelve JWT |
| POST | `/auth/login` | No | Login y JWT |
| GET | `/auth/profile` | Bearer JWT | Datos del usuario logueado |

## Cómo arrancarlo

1. Docker con Postgres arriba (`docker compose up -d` en la raíz de OrderFlow).
2. Copia el env:

```bash
cp .env.example .env
```

3. Instala y corre:

```bash
npm install
npm run start:dev
```

Queda en **http://localhost:3001**

## Prueba rápida

```bash
# Registro
curl -X POST http://localhost:3001/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"demo@orderflow.dev\",\"password\":\"secret123\"}"

# Login
curl -X POST http://localhost:3001/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"demo@orderflow.dev\",\"password\":\"secret123\"}"

# Perfil (pega el accessToken que te devolvió login)
curl http://localhost:3001/auth/profile ^
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## Ideas clave (para entrevistas)

- **bcrypt** hashea la password antes de guardarla.
- El **JWT** lleva `sub` (user id), `email` y `role`. No lleva la password.
- Contrato con otros servicios: [docs/jwt-contract.md](../../docs/jwt-contract.md) — si cambias el payload, avisa a Catalog.
- Usamos solo la base **`auth_db`**. Otros servicios no deben leer esta tabla directo.
- **`synchronize: true`** es solo para desarrollo local. En producción irían migraciones TypeORM (cambios de schema versionados y explícitos).
- **`/health`** hace un `SELECT 1` a Postgres. Si la DB está caída responde 503, no un falso "ok".
