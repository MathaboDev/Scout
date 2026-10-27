"""
Demo data for the end-to-end walkthrough. Safe to run more than once.

    python manage.py seed_demo

Creates:
  - 1 platform admin row (needed: every opportunity has a NOT NULL adminid)
  - 1 provider login   provider@byteworks.demo / ScoutDemo-2026
  - 1 student login    student@scout.demo      / ScoutDemo-2026
    with a complete profile but NO documents, so the demo shows FR4
  - 5 verified listings chosen so the eligible / all toggle is visibly
    different, plus 1 unverified listing to show FR9
  - 9 more fictional providers (logins provider@<name>.demo) with listings
    in every field of study, and 2 more students (see _demo_catalogue.py)

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

from ._demo_catalogue import PROVIDERS, STUDENTS

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

        self.stdout.write(self.style.SUCCESS(
            f"Demo ready. {created} new listing(s).\n"
            f"  Student : student@scout.demo / {DEMO_PASSWORD}\n"
            f"  Provider: provider@byteworks.demo / {DEMO_PASSWORD}\n"
            f"  Also    : graduate@scout.demo, health@scout.demo and "
            f"provider@<kopano|mzansirail|indaba|umoya|lekgotla|sizwe|fynbos|brightfutures|karoo>.demo"
        ))

