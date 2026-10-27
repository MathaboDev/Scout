"""
The ONE notification utility (FR7). Every alert in the app goes through
notify(): submission receipts (FR5), missing documents (FR4), status
changes and outcomes (FR6), and deadline reminders (FR7).

Email uses Django's send_mail, so it works with whatever EMAIL_BACKEND
settings.py configures. For the demo, the console backend prints emails
to the runserver terminal, which is enough to show the link.
"""

import logging

from django.conf import settings
from django.core.mail import send_mail

from .models import Notification

log = logging.getLogger("scout.notifications")

# Notification types (stored in notification.notificationtype)
APPLICATION_SUBMITTED = "application_submitted"
MISSING_DOCUMENT = "missing_document"
STATUS_CHANGED = "status_changed"
OUTCOME_RECEIVED = "outcome_received"
DEADLINE_REMINDER = "deadline_reminder"


def frontend_url(path=""):
    base = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    return f"{base}{path}"


def notify(
    student,
    notification_type,
    message,
    *,
    application_id=None,
    bookmark_id=None,
    email_subject=None,
    email_body=None,
    once=False,
):
    """
    Create the in-app notification and, if email_subject is given, email it.

    once=True skips the whole thing when an identical in-app notification
    already exists. Used for "document missing", so re-opening the apply
    screen doesn't spam the student (FR7: each notification exactly once).
    """
    if once and Notification.objects.filter(
        student_id=student.student_id,
        notification_type=notification_type,
        channel="in_app",
        message=message,
    ).exists():
        return None

    in_app = Notification.objects.create(
        student_id=student.student_id,
        application_id=application_id,
        bookmark_id=bookmark_id,
        notification_type=notification_type,
        channel="in_app",
        message=message,
    )

    if email_subject:
        try:
            sent = send_mail(
                subject=email_subject,
                message=email_body or message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[student.email],
                fail_silently=False,
            )
        except Exception:
            # Never let a mail outage break an application submission.
            log.exception("Email notification failed (type=%s)", notification_type)
            sent = 0

        if sent:
            Notification.objects.create(
                student_id=student.student_id,
                application_id=application_id,
                bookmark_id=bookmark_id,
                notification_type=notification_type,
                channel="email",
                message=message,
                is_read=True,
            )

    return in_app

