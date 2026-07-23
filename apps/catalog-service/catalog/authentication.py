"""
Autenticación con el JWT que emite Auth Service (NestJS).

Contrato del payload: docs/jwt-contract.md
Campos requeridos: sub, email, role (mismos que signToken() en Auth).

No guardamos usuarios aquí: solo decodificamos el token con el mismo JWT_SECRET.
"""

from dataclasses import dataclass

import jwt
from django.conf import settings
from rest_framework import authentication, exceptions


@dataclass
class AuthUser:
    """Usuario “ligero” que viaja en request.user (no es el User de Django)."""

    id: str
    email: str
    role: str

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_admin(self) -> bool:
        return self.role == 'admin'


class AuthServiceJWTAuthentication(authentication.BaseAuthentication):
    keyword = 'Bearer'

    def authenticate(self, request):
        header = authentication.get_authorization_header(request).decode('utf-8')
        if not header:
            return None

        parts = header.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            return None

        token = parts[1]
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM],
            )
        except jwt.ExpiredSignatureError as exc:
            raise exceptions.AuthenticationFailed('Token expired') from exc
        except jwt.InvalidTokenError as exc:
            raise exceptions.AuthenticationFailed('Invalid token') from exc

        user_id = payload.get('sub')
        email = payload.get('email')
        role = payload.get('role')
        if not user_id or not email or not role:
            raise exceptions.AuthenticationFailed('Invalid token payload')

        return (AuthUser(id=str(user_id), email=email, role=role), token)
