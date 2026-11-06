"""
Demo data for the end-to-end walkthrough. Safe to run more than once.

    python manage.py seed_demo

Creates:
  - 1 admin login      admin@scout.demo        / ScoutDemo-2026
    (platform admin row plus a staff login; every opportunity needs an adminid)
  - 1 provider login   provider@byteworks.demo / ScoutDemo-2026
  - 1 student login    student@scout.demo      / ScoutDemo-2026
    with a complete profile but NO documents, so the demo shows FR4
  - 5 verified listings chosen so the eligible / all toggle is visibly
    different, plus 1 unverified listing to show FR9
  - 9 more fictional providers (logins provider@<name>.demo) with listings
    in every field of study, and 3 more students (see _demo_catalogue.py),
    including mathabo@scout.demo for the file upload + matching demo

To put Mathabo back to "profile filled in, no documents, no applications"
after a rehearsal:

    python manage.py seed_demo --reset-mathabo

Demo values only. Never run this against production data.
"""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import Profile, Student
from opportunities.models import Opportunity
from providers_admin.models import PlatformAdmin, Provider

from applications.models import Application, Bookmark
from core.choices import STATUS_OUTCOME_RECEIVED, STATUS_SUBMITTED

from documents.models import Document
from notifications.models import Notification

from ._demo_catalogue import (
    DEMO_APPLICANTS,
    MATHABO,
    MATHABO_NONGWE,
    PROVIDERS,
    RESETTABLE_STUDENTS,
    STUDENTS,
)

User = get_user_model()
DEMO_PASSWORD = "ScoutDemo-2026"


def _auth_user(email, first, last):
    user, created = User.objects.get_or_create(
        username=email,
        defaults={"email": email, "first_name": first, "last_name": last},
    )
    if created:
        user.set_password(DEMO_PASSWORD)
        user.save()
    return user


def _provider(email, company_name, industry, province):
    user = _auth_user(email, company_name, "Recruiting")
    provider, _ = Provider.objects.get_or_create(
        email=email,
        defaults={
            "company_name": company_name,
            "industry": industry,
            "province": province,
            "auth_user": user,
        },
    )
    if provider.auth_user_id is None:
        provider.auth_user = user
        provider.save(update_fields=["auth_user"])
    return provider


def _student(email, first, last, profile):
    user = _auth_user(email, first, last)
    student, _ = Student.objects.get_or_create(
        email=email,
        defaults={
            "first_name": first,
            "last_name": last,
            "auth_user": user,
            "account_status": "active",
        },
    )
    Profile.objects.get_or_create(student=student, defaults=profile)
    return student


class Command(BaseCommand):
    help = "Seed demo admin, provider, student and listings."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset-mathabo",
            action="store_true",
            help="Undo a rehearsal for both Mathabo accounts: hide uploaded documents, delete "
                 "applications, bookmarks and notifications, and restore the profile.",
        )

    def _reset_mathabo(self):
        for item in RESETTABLE_STUDENTS:
            student = Student.objects.get(email=item["email"])
            sid = student.student_id
            # Same as replacing a file in the app: the row is retired, not deleted.
            docs = Document.objects.filter(student_id=sid, is_active=True).update(is_active=False)
            apps = Application.objects.filter(student_id=sid).count()
            Application.objects.filter(student_id=sid).delete()
            Bookmark.objects.filter(student_id=sid).delete()
            Notification.objects.filter(student_id=sid).delete()
            # Clear every type-specific field first, then apply the seeded values.
            profile = {"year_level": None, "graduate_type": None, "qualification": None, **item["profile"]}
            Profile.objects.filter(student=student).update(**profile)
            self.stdout.write(self.style.SUCCESS(
                f"{item['email']} reset: {docs} document(s) hidden, "
                f"{apps} application(s) removed, profile restored."
            ))

    @transaction.atomic
    def handle(self, *args, **options):
        now = timezone.now()

        admin, _ = PlatformAdmin.objects.get_or_create(
            email="admin@scout.demo",
            defaults={
                "first_name": "Scout",
                "last_name": "Admin",
                "password": make_password(DEMO_PASSWORD),
                "role": "moderator",
                "is_active": True,
                "created_at": now,
            },
        )
        # The admin row alone can't log in: it needs a staff login with the same email.
        admin_user = _auth_user(admin.email, "Scout", "Admin")
        if not admin_user.is_staff:
            admin_user.is_staff = True
            admin_user.save(update_fields=["is_staff"])

        provider = _provider("provider@byteworks.demo", "ByteWorks", "Software", "Western Cape")

        _student("student@scout.demo", "Tumelo", "Mahlangu", {
            "student_type": "Tertiary Student",
            "institution": "Cape Peninsula University of Technology",
            "field_of_study": "Information Technology",
            "academic_average": 72,
            "opportunity_preference": "Internship",
            "province": "Western Cape",
            "year_level": 2,
        })
        for st in STUDENTS:
            _student(st["email"], st["first_name"], st["last_name"], st["profile"])

        listings = [
            # ELIGIBLE for the demo student
            dict(
                title="Software developer intern",
                opportunity_type="Internship",
                field_of_study="Information Technology",
                eligibility_type="Any",
                minimum_average=65,
                year_level_required=2,
                description="Build and test features on our client web apps alongside a senior developer.",
                closing_date=now + timedelta(days=25),
                is_verified=True,
            ),
            # ELIGIBLE and closes in 2 days: bookmark it, run send_bookmark_reminders
            dict(
                title="IT support intern",
                opportunity_type="Internship",
                field_of_study="Information Technology",
                eligibility_type="Tertiary Student",
                province="Western Cape",
                description="Help our support desk keep 200 staff laptops and accounts running.",
                closing_date=now + timedelta(days=2),
                is_verified=True,
            ),
            # NOT eligible: average too low
            dict(
                title="Cloud engineering intern",
                opportunity_type="Internship",
                field_of_study="Information Technology",
                eligibility_type="Any",
                minimum_average=80,
                description="Work on our AWS infrastructure and deployment pipelines.",
                closing_date=now + timedelta(days=30),
                is_verified=True,
            ),
            # NOT eligible: graduates only, Bachelor required
            dict(
                title="Graduate developer programme",
                opportunity_type="Graduate programme",
                field_of_study="Information Technology",
                eligibility_type="Graduate",
                required_qualification="Bachelor",
                description="A 12-month rotation programme for recent graduates.",
                closing_date=now + timedelta(days=40),
                is_verified=True,
            ),
            # NOT eligible: different field
            dict(
                title="Data analyst intern",
                opportunity_type="Internship",
                field_of_study="Computer Science",
                eligibility_type="Any",
                description="Turn product usage data into weekly insight reports.",
                closing_date=now + timedelta(days=20),
                is_verified=True,
            ),
            # FR9: posted but not verified, so invisible to students
            dict(
                title="UX design intern",
                opportunity_type="Internship",
                field_of_study="Information Technology",
                eligibility_type="Any",
                description="Prototype and user-test new onboarding flows.",
                closing_date=now + timedelta(days=28),
                is_verified=False,
            ),
        ]

        created = 0
        for data in listings:
            _, was_created = Opportunity.objects.get_or_create(
                provider_id=provider.provider_id,
                title=data["title"],
                defaults={**data, "admin_id": admin.admin_id, "is_active": True, "posted_at": now},
            )
            created += int(was_created)

        # Other providers: every field of study, all verified
        for p in PROVIDERS:
            other = _provider(p["email"], p["company_name"], p["industry"], p["province"])
            for item in p["listings"]:
                data = {k: v for k, v in item.items() if k != "days"}
                data["closing_date"] = now + timedelta(days=item["days"])
                data["is_verified"] = True
                _, was_created = Opportunity.objects.get_or_create(
                    provider_id=other.provider_id,
                    title=data["title"],
                    defaults={**data, "admin_id": admin.admin_id, "is_active": True, "posted_at": now},
                )
                created += int(was_created)

        # Demo applicants for the ByteWorks provider screens, one per status
        new_apps = 0
        for i, item in enumerate(DEMO_APPLICANTS, start=1):
            student = _student(item["email"], item["first_name"], item["last_name"], item["profile"])
            title, status, outcome, days_ago = item["application"]
            opp = Opportunity.objects.get(provider_id=provider.provider_id, title=title)
            submitted = now - timedelta(days=days_ago)
            reviewed = submitted + timedelta(days=2) if status != STATUS_SUBMITTED else None
            _, was_created = Application.objects.get_or_create(
                student_id=student.student_id,
                opportunity_id=opp.opportunity_id,
                defaults={
                    "reference_number": f"SCOUT-DEMO{i:05d}",
                    "status": status,
                    "outcome_result": outcome,
                    "submitted_at": submitted,
                    "reviewed_at": reviewed,
                    "outcome_received_at": now - timedelta(days=1) if status == STATUS_OUTCOME_RECEIVED else None,
                },
            )
            new_apps += int(was_created)

        if options.get("reset_mathabo"):
            self._reset_mathabo()

        self.stdout.write(self.style.SUCCESS(f"{new_apps} new demo applicant(s) for ByteWorks."))
        self.stdout.write(self.style.SUCCESS(
            f"Demo ready. {created} new listing(s).\n"
            f"  Student : student@scout.demo / {DEMO_PASSWORD}\n"
            f"  Mathabo : {MATHABO['email']} / {DEMO_PASSWORD} (Diploma IT student, no documents)\n"
            f"  Mathabo : {MATHABO_NONGWE['email']} / {DEMO_PASSWORD} (Masters graduate, no documents)\n"
            f"  Provider: provider@byteworks.demo / {DEMO_PASSWORD}\n"
            f"  Admin   : {admin.email} / {DEMO_PASSWORD} (log in at /login?as=admin)\n"
            f"  Also    : graduate@scout.demo, health@scout.demo and "
            f"provider@<kopano|mzansirail|indaba|umoya|lekgotla|sizwe|fynbos|brightfutures|karoo>.demo"
        ))

