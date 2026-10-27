"""
FR9: an administrator verifies listings before they go live.

There is no admin UI yet, so this command is the admin action:

    python manage.py verify_listings            # list pending listings
    python manage.py verify_listings 12 14      # verify listings 12 and 14
    python manage.py verify_listings --all      # verify everything pending
"""

from django.core.management.base import BaseCommand, CommandError

from opportunities.models import Opportunity
from providers_admin.models import PlatformAdmin


class Command(BaseCommand):
    help = "Verify pending opportunity listings so students can see them."

    def add_arguments(self, parser):
        parser.add_argument("ids", nargs="*", type=int)
        parser.add_argument("--all", action="store_true")

    def handle(self, *args, ids, **options):
        pending = Opportunity.objects.filter(is_active=True, is_verified=False)

        if not ids and not options["all"]:
            if not pending.exists():
                self.stdout.write("No listings are waiting for verification.")
            for o in pending.order_by("posted_at"):
                self.stdout.write(f"  {o.opportunity_id}: {o.title} (provider {o.provider_id})")
            return

        admin = PlatformAdmin.objects.filter(is_active=True).order_by("admin_id").first()
        if admin is None:
            raise CommandError("No active admin row exists. Run `manage.py seed_demo` first.")

        target = pending if options["all"] else pending.filter(opportunity_id__in=ids)
        count = target.update(is_verified=True, admin_id=admin.admin_id)
        self.stdout.write(self.style.SUCCESS(f"Verified {count} listing(s) as {admin.email}."))

