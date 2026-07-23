from django.db import connection
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Category, Product
from .permissions import IsAdminOrReadOnly
from .serializers import CategorySerializer, ProductSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    """Proceso vivo + SELECT 1 a catalog_db (igual idea que Auth)."""
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        return Response(
            {'status': 'ok', 'service': 'catalog-service', 'database': 'up'}
        )
    except Exception:
        return Response(
            {'status': 'error', 'service': 'catalog-service', 'database': 'down'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        # En listado público solo mostramos activos; admin puede ver todos con ?all=1
        if self.request.query_params.get('all') == '1':
            user = self.request.user
            if getattr(user, 'is_admin', False):
                return qs
        return qs.filter(is_active=True)
