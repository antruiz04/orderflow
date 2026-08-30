import json
import logging
from typing import Any

from kafka import KafkaConsumer

from config import Settings
from mailer import send_mail

logger = logging.getLogger(__name__)


def _build_confirmed(order_id: str) -> tuple[str, str]:
    return (
        f"Pedido {order_id} confirmado",
        (
            f"Tu pedido {order_id} se confirmó.\n"
            "El stock ya quedó reservado.\n\n"
            "— OrderFlow"
        ),
    )


def _build_cancelled(order_id: str, reason: str | None) -> tuple[str, str]:
    detail = reason or "sin stock suficiente"
    return (
        f"Pedido {order_id} cancelado",
        (
            f"No pudimos completar tu pedido {order_id}.\n"
            f"Motivo: {detail}\n\n"
            "— OrderFlow"
        ),
    )


def handle_message(settings: Settings, topic: str, payload: dict[str, Any]) -> None:
    order_id = payload.get("orderId")
    email = payload.get("userEmail")
    if not order_id or not email:
        logger.warning("mensaje sin orderId/userEmail, se ignora: %s", payload)
        return

    event = payload.get("event")
    if topic == settings.topic_reserved and event == "inventory.reserved":
        subject, body = _build_confirmed(order_id)
        send_mail(settings, to=email, subject=subject, body=body)
        return

    if topic == settings.topic_failed and event == "inventory.failed":
        subject, body = _build_cancelled(order_id, payload.get("reason"))
        send_mail(settings, to=email, subject=subject, body=body)
        return

    logger.debug("evento ignorado topic=%s event=%s", topic, event)


def run_consumer(settings: Settings) -> None:
    topics = [settings.topic_reserved, settings.topic_failed]
    consumer = KafkaConsumer(
        *topics,
        bootstrap_servers=settings.kafka_broker,
        group_id=settings.kafka_group_id,
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        value_deserializer=lambda v: v.decode("utf-8"),
    )

    logger.info(
        "escuchando %s en %s",
        ", ".join(topics),
        settings.kafka_broker,
    )

    for message in consumer:
        try:
            payload = json.loads(message.value)
            handle_message(settings, message.topic, payload)
        except Exception:
            logger.exception("error procesando mensaje offset=%s", message.offset)
