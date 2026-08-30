import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    kafka_broker: str
    kafka_group_id: str
    topic_reserved: str
    topic_failed: str
    smtp_host: str
    smtp_port: int
    smtp_from: str


def load_settings() -> Settings:
    return Settings(
        kafka_broker=os.environ.get("KAFKA_BROKER", "localhost:19092"),
        kafka_group_id=os.environ.get("KAFKA_GROUP_ID", "notifications-service"),
        topic_reserved=os.environ.get(
            "KAFKA_TOPIC_INVENTORY_RESERVED", "inventory.reserved"
        ),
        topic_failed=os.environ.get(
            "KAFKA_TOPIC_INVENTORY_FAILED", "inventory.failed"
        ),
        smtp_host=os.environ.get("SMTP_HOST", "localhost"),
        smtp_port=int(os.environ.get("SMTP_PORT", "1025")),
        smtp_from=os.environ.get("SMTP_FROM", "orders@orderflow.local"),
    )
