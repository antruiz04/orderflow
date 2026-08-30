# Notifications Service

Consumer de Kafka que manda mail cuando Inventory confirma o cancela un pedido.

Usa Mailhog en local (`localhost:1025` SMTP, UI en http://localhost:8025).

Escucha:

- `inventory.reserved` → mail de confirmación
- `inventory.failed` → mail de cancelación

El `userEmail` viene en el evento (Orders lo mete en `order.created` y Inventory lo reenvía). No hay DB propia.

## Run

```bash
cd apps/notifications-service
py -3 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python main.py
```

Hace falta Docker (Redpanda + Mailhog) e Inventory corriendo el flujo de pedidos.

## Probar

1. Creás un pedido con stock OK → Mailhog muestra el mail de confirmado
2. Pedido sin stock → mail de cancelado

## Nota

Eventos viejos sin `userEmail` se ignoran (queda un warning en el log).
