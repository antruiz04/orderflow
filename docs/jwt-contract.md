# JWT contract (Auth ↔ other services)

This is the **shared agreement** between Auth Service (NestJS) and any service that trusts its tokens (today: Catalog / Django).

They do not share a database or a code library. The JWT payload shape **is** the API between them.

If you change this contract in Auth, update every consumer (and this file) in the same change.

## Who does what

| Role | Service | Responsibility |
|------|---------|----------------|
| Issuer | Auth (`apps/auth-service`) | Login / register → signs the JWT |
| Consumer | Catalog (`apps/catalog-service`), later others | Reads `Authorization: Bearer …` and verifies the signature |

## Shared secrets

| Variable | Value |
|----------|--------|
| `JWT_SECRET` | Same string in Auth `.env` and Catalog `.env` |
| Algorithm | `HS256` |

Never commit real secrets. Only `.env.example` placeholders go to GitHub.

## Access token payload (required fields)

Auth signs exactly these claims (see `signToken()` in Auth):

```json
{
  "sub": "<user uuid>",
  "email": "<user email>",
  "role": "customer" | "admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

| Claim | Meaning | Used by Catalog |
|-------|---------|-----------------|
| `sub` | User id | Identity (`AuthUser.id`) |
| `email` | User email | Identity (`AuthUser.email`) |
| `role` | Authorization | Write APIs require `"admin"` |
| `iat` / `exp` | Issued / expiry | Rejected if expired |

Catalog fails authentication if `sub`, `email`, or `role` is missing.

## Roles

| Value | Meaning |
|-------|---------|
| `customer` | Default. Can read public catalog endpoints. Cannot create/update products or categories. |
| `admin` | Can create/update catalog resources via API. |

## How a request looks

```http
POST /api/products/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
```

1. Client logs in on Auth → gets `accessToken`.
2. Client calls Catalog with that token in the header.
3. Catalog verifies signature with `JWT_SECRET` (PyJWT).
4. If `role === "admin"` → allow write; otherwise → 403.

Catalog does **not** call Auth on every request. Verification is local and stateless.

## What breaks the contract

Examples that will break Catalog (or future consumers) without a coordinated update:

- Renaming `sub` → `userId`
- Sending `roles: ["admin"]` instead of `role: "admin"`
- Changing algorithm without updating consumers
- Using a different `JWT_SECRET` per service

## Code pointers

- Issuer: `apps/auth-service/src/auth/auth.service.ts` → `signToken()`
- Consumer: `apps/catalog-service/catalog/authentication.py` → `AuthServiceJWTAuthentication`
- Permission: `apps/catalog-service/catalog/permissions.py` → `IsAdminOrReadOnly`
