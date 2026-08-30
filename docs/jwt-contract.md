# JWT entre Auth y el resto

Auth firma el token. Catalog y Orders lo validan con el mismo `JWT_SECRET`.
No comparten DB ni código: el contrato es el shape del payload.

Si cambio los claims en Auth, tengo que actualizar este doc y los consumidores.

## Quién hace qué

| | Servicio | Rol |
|--|----------|-----|
| Emite | Auth | login/register → JWT |
| Consume | Catalog, Orders | leen `Authorization: Bearer ...` |
| Reenvía | API Gateway | no valida; pasa el header al servicio |

El cliente puede pegarle al Gateway (`:3000`) en vez de a cada puerto.
## Secrets

- `JWT_SECRET` igual en todos los `.env`
- algoritmo: `HS256`
- el secret real no va a GitHub (solo `.env.example`)

## Payload

Lo firma Auth en `signToken()`:

```json
{
  "sub": "<user uuid>",
  "email": "<email>",
  "role": "customer" | "admin",
  "iat": ...,
  "exp": ...
}
```

Si falta `sub`, `email` o `role`, el consumidor rechaza el token.

| role | |
|------|--|
| `customer` | default; puede crear pedidos; no escribe en Catalog |
| `admin` | puede escribir en Catalog |

## Ejemplo

1. Login en Auth → `accessToken`
2. Request a Catalog/Orders con `Authorization: Bearer ...`
3. El servicio verifica la firma localmente (no llama a Auth en cada request)

## Qué lo rompe

- renombrar `sub` → `userId`
- mandar `roles: []` en vez de `role`
- cambiar el algoritmo sin avisar
- usar otro `JWT_SECRET` en un servicio

## Código

- Auth: `apps/auth-service/src/auth/auth.service.ts` → `signToken()`
- Catalog: `apps/catalog-service/catalog/authentication.py`
- Orders: `apps/orders-service/src/auth/jwt.strategy.ts`
