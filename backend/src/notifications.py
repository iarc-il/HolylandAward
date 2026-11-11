"""Email alerts to the site admin.

Configured entirely through environment variables, so no secret lives in the
code. If they are not set (e.g. local development), sending is skipped.

  SMTP_USER          account that sends the mail (e.g. a Gmail address)
  SMTP_PASSWORD      its password - for Gmail an "App password"
  ADMIN_NOTIFY_EMAIL who receives alerts (defaults to SMTP_USER)
  SMTP_HOST / SMTP_PORT  default smtp.gmail.com / 587 (STARTTLS)
"""

import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)


def send_admin_email(subject: str, body: str) -> bool:
    """Send an alert to the admin. Never raises: a mail problem must not break
    the request that triggered it. Returns True only if the mail was sent."""
    user = os.getenv("SMTP_USER", "").strip()
    # Google shows app passwords in groups of four letters separated by spaces.
    password = os.getenv("SMTP_PASSWORD", "").replace(" ", "")
    recipient = os.getenv("ADMIN_NOTIFY_EMAIL", "").strip() or user
    if not (user and password and recipient):
        logger.info("Admin email not configured; skipping: %s", subject)
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = user
    message["To"] = recipient
    message.set_content(body)

    try:
        host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        port = int(os.getenv("SMTP_PORT", "587"))
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.starttls()
            server.login(user, password)
            server.send_message(message)
    except Exception:
        logger.exception("Failed to send admin email: %s", subject)
        return False
    return True
