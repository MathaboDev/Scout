"""
FR21: remind students 3 days before a bookmarked opportunity closes.

send_due_reminders() is the one place the reminder rule lives. It is
called from two places:

  1. `python manage.py send_bookmark_reminders` (for a cron job, if the
     host offers one).
  2. ReminderTriggerMiddleware below, which runs the check in a
     background thread at most once every REMINDER_CHECK_INTERVAL seconds
     while the site is receiving traffic. This means reminders go out
     without a scheduler, as long as someone is using the platform.

Each bookmark is reminded at most once. The bookmark is "claimed" with a
conditional UPDATE (remindersent FALSE -> TRUE) before anything is sent,
so two workers running at the same time can never both send it.
"""

import logging
import threading
import time
from datetime import timedelta

from django.conf import settings
from django.db import connection
from django.utils import timezone

from accounts.models import Student
from applications.models import Bookmark
from core.sql import fetch_all

from .utils import DEADLINE_REMINDER, frontend_url, notify

log = logging.getLogger("scout.notifications")

REMINDER_WINDOW = timedelta(days=3)


def send_due_reminders(now=None):
    """Send every reminder that is due. Returns how many were sent."""
    now = now or timezone.now()
    due = fetch_all(
        """
        SELECT b.bookmarkid, b.studentid, o.opportunityid, o.title,
               o.closingdate, pr.companyname
        FROM bookmark b
        JOIN opportunity o ON o.opportunityid = b.opportunityid
        JOIN provider pr ON pr.providerid = o.providerid
        WHERE b.remindersent = FALSE
          AND o.isactive = TRUE
          AND o.isverified = TRUE
          AND o.closingdate >= %s
          AND o.closingdate <= %s
          AND NOT EXISTS (
              SELECT 1 FROM application a
              WHERE a.studentid = b.studentid AND a.opportunityid = b.opportunityid
          )
        """,
        [now, now + REMINDER_WINDOW],
    )

    sent = 0
    for row in due:
        # Claim first: only the worker whose UPDATE changes the row sends it.
        claimed = Bookmark.objects.filter(
            bookmark_id=row["bookmarkid"], reminder_sent=False
        ).update(reminder_sent=True)
        if not claimed:
            continue

        student = Student.objects.filter(student_id=row["studentid"]).first()
        if student is None:
            continue

        closes = timezone.localtime(row["closingdate"]).strftime("%d %b %Y")
        message = (
            f"{row['title']} at {row['companyname']} closes on {closes}. "
            "You bookmarked it, so don't miss the deadline."
        )
        link = frontend_url(f"/jobs/{row['opportunityid']}")
        notify(
            student,
            DEADLINE_REMINDER,
            message,
            bookmark_id=row["bookmarkid"],
            email_subject=f"Closing soon: {row['title']}",
            email_body=f"Hi {student.first_name},\n\n{message}\n\nView and apply: {link}\n\nScout",
        )
        sent += 1

    return sent


# ---------------------------------------------------------------------------
# Automatic trigger (no scheduler needed)
# ---------------------------------------------------------------------------

_lock = threading.Lock()
_last_run = 0.0


def _run_in_background():
    try:
        count = send_due_reminders()
        if count:
            log.warning("Sent %s bookmark reminder(s).", count)
    except Exception:
        log.exception("Automatic bookmark reminder run failed.")
    finally:
        # A thread gets its own DB connection; close it so it isn't leaked.
        connection.close()


def maybe_trigger_reminders():
    """Start a reminder run if the interval has passed. Never blocks the request."""
    global _last_run
    if not getattr(settings, "REMINDERS_AUTORUN", True):
        return
    interval = getattr(settings, "REMINDER_CHECK_INTERVAL", 600)
    now = time.monotonic()
    with _lock:
        if _last_run and now - _last_run < interval:
            return
        _last_run = now
    threading.Thread(target=_run_in_background, daemon=True).start()


class ReminderTriggerMiddleware:
    """Checks for due reminders as a side effect of normal API traffic."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith("/api/"):
            maybe_trigger_reminders()
        return response
