# Catalog Service

Este microservicio es el **catálogo**: categorías y productos.

Lee cualquiera. Crear/editar solo con un JWT de Auth Service cuyo `role` sea `admin`.

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health/` | No | Proceso + Postgres (`catalog_db`) |
| GET | `/api/categories/` | No | Listar categorías |
| POST | `/api/categories/` | Bearer JWT (admin) | Crear categoría |
| GET | `/api/products/` | No | Listar productos activos |
| POST | `/api/products/` | Bearer JWT (admin) | Crear producto |
| GET | `/api/products/{id}/` | No | Detalle |
| PATCH | `/api/products/{id}/` | Bearer JWT (admin) | Actualizar |
| — | `/admin/` | Django superuser | Panel admin (demo) |

## Cómo arrancarlo

1. Docker con Postgres arriba (`docker compose up -d` en la raíz de OrderFlow).
2. Mismo `JWT_SECRET` que en Auth (cópialo a `.env`).
3. Instala y migra:

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

Queda en **http://localhost:8000**

## Probar con JWT de Auth

1. En Auth, registra un admin:

```json
POST http://localhost:3001/auth/register
{ "email": "admin@orderflow.dev", "password": "secret123", "role": "admin" }
```

2. Usa el `accessToken` en Catalog:

```bash
curl http://localhost:8000/api/categories/ ^
  -H "Authorization: Bearer TU_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Electronics\"}"
```

## Ideas clave

- Precio en **Decimal** (`max_digits=12`, `decimal_places=2`).
- JWT se valida aquí con **PyJWT** y el mismo secreto que Nest — no hace falta llamar a Auth en cada request.
- Contrato del payload (`sub`, `email`, `role`): [docs/jwt-contract.md](../../docs/jwt-contract.md).
- Migraciones de Django (no `synchronize`): cambios de schema versionados.
- Solo usa **`catalog_db`**.