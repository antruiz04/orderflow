# Catalog Service

Categorías y productos (Django + DRF).

Lectura pública. Escritura solo con JWT de Auth y `role=admin`.

## Endpoints

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/health/` | no |
| GET/POST | `/api/categories/` | write = admin |
| GET/POST/PATCH | `/api/products/` | write = admin |
| | `/admin/` | superuser de Django |

## Run

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# mismo JWT_SECRET que Auth
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

http://localhost:8000

## Probar escritura

1. Registra un admin en Auth (`role: "admin"`)
2. Usa el token:

```bash
curl http://localhost:8000/api/categories/ ^
  -H "Authorization: Bearer TU_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Electronics\"}"
```

## Notas

- precio `Decimal(12, 2)`
- JWT con PyJWT + mismo secret que Nest (no llama a Auth en cada request)
- payload: [jwt-contract.md](../../docs/jwt-contract.md)
- migraciones de Django
- DB: `catalog_db`
