import logging
import smtplib
from email.message import EmailMessage

from config import Settings

logger = logging.getLogger(__name__)


def send_mail(
    settings: Settings,
    *,
    to: str,
    subject: str,
    body: str,
) -> None:
    msg = EmailMessage()
    msg["From"] = settings.smtp_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
        smtp.send_message(msg)

    logger.info("mail enviado a %s | %s", to, subject)
