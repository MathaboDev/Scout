"""
FR7: remind students 3 days before a bookmarked opportunity closes.

    python manage.py send_bookmark_reminders

Safe to run as often as you like: bookmark.remindersent makes sure each
bookmark is reminded exactly once. In production, schedule it every
minute (NFR2: within one minute of the scheduled time), e.g. a Render /
Railway cron job. For the demo, run it by hand after bookmarking the
"closing soon" seeded listing.
"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Student
from applications.models import Bookmark
from core.sql import fetch_all
from notifications.utils import DEADLINE_REMINDER, frontend_url, notify


class Command(BaseCommand):
    help = "Send 3-day closing reminders for bookmarked opportunities."

    def handle(self, *args, **options):
        now = timezone.now()
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
            [now, now + timedelta(days=3)],
        )

        sent = 0
        for row in due:
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
            Bookmark.objects.filter(bookmark_id=row["bookmarkid"]).update(reminder_sent=True)
            sent += 1

        self.stdout.write(self.style.SUCCESS(f"Sent {sent} reminder(s)."))

