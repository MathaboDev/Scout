"""
FR21: remind students 3 days before a bookmarked opportunity closes.

    python manage.py send_bookmark_reminders

Safe to run as often as you like: bookmark.remindersent makes sure each
bookmark is reminded exactly once. The same check also runs automatically
in the background while the site has traffic (see notifications/reminders.py),
so a cron job is optional. Use this command for the demo, or schedule it
on the host for reminders that go out even when nobody is using the site.
"""

from django.core.management.base import BaseCommand

from notifications.reminders import send_due_reminders


class Command(BaseCommand):
    help = "Send 3-day closing reminders for bookmarked opportunities."

    def handle(self, *args, **options):
        sent = send_due_reminders()
        self.stdout.write(self.style.SUCCESS(f"Sent {sent} reminder(s)."))
