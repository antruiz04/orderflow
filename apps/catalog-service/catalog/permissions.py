from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrReadOnly(BasePermission):
    """
    GET/HEAD/OPTIONS → cualquiera.
    POST/PATCH/PUT/DELETE → solo JWT con role=admin (el de Auth Service).
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        user = request.user
        return bool(
            user
            and getattr(user, 'is_authenticated', False)
            and getattr(user, 'is_admin', False)
        )
