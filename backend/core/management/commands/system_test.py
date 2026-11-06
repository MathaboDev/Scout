"""
Full system test of Scout, through the real API.

    python manage.py system_test
    python manage.py system_test --report "../docs/System Test Report.md"
    python manage.py system_test --with-frontend      # also runs `npm run build`

Every check is tagged with the requirement it proves (FR / NFR numbers
from the System Documentation), so the printed results and the optional
Markdown report can be pasted straight into section 9.

Leaves nothing behind:
  - all database changes happen inside one transaction that is rolled
    back at the end, even when a check fails or crashes;
  - email is captured in memory (locmem), never sent;
  - files uploaded to Supabase Storage during the test are deleted.

Needs: backend/.env filled in, the database reachable, seed_demo run once,
and at least one administrator (staff user + matching active admin row).
Exit code is 1 when any check fails, so it can run in CI.

smoke_test is the quick happy-path version of this command.
"""

import io
import re
import subprocess
import time
import traceback
import uuid
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError, connection, transaction
from django.test.utils import override_settings
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from accounts.models import LoginOTP, Profile, Student
from applications.models import Application, Bookmark
from documents.models import Document
from documents.supabase_storage import delete_document
from notifications import reminders
from notifications.models import Notification
from opportunities.models import Opportunity
from providers_admin.models import PlatformAdmin, Provider

User = get_user_model()

DEMO_PASSWORD = "ScoutDemo-2026"
PASSWORD = "SystemTest-2026!"
BASE_DIR = Path(settings.BASE_DIR)

PDF_BYTES = (
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n"
    b"trailer<</Root 1 0 R>>\n%%EOF\n"
)

# The IT student every eligibility check is measured against.
BASE_PROFILE = {
    "student_type": "Tertiary Student",
    "institution": "System Test University",
    "field_of_study": "Information Technology",
    "academic_average": 72,
    "opportunity_preference": "Internship",
    "province": "Western Cape",
    "year_level": 2,
    "graduate_type": None,
    "qualification": None,
}


class _Rollback(Exception):
    """Raised on purpose at the end to undo every database change."""


class _Stop(Exception):
    """A check the rest of a section depends on failed."""


class Command(BaseCommand):
    help = "Run the full Scout system test (every requirement), then undo all changes."

    def add_arguments(self, parser):
        parser.add_argument("--report", help="Write a Markdown results report to this path.")
        parser.add_argument("--with-frontend", action="store_true", help="Also run the frontend production build.")

    # ================================================================ harness

    def handle(self, *args, **options):
        self.results = []
        self.area = ""
        self.counter = {}
        self.student_ids = set()
        self.uploaded_paths = set()
        started = time.monotonic()
        self.real_email_backend = settings.EMAIL_BACKEND  # before the locmem override

        try:
            with override_settings(
                EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
                REMINDERS_AUTORUN=False,
                SECURE_SSL_REDIRECT=False,
            ):
                mail.outbox = []
                with transaction.atomic():
                    try:
                        self.run_all()
                    except Exception as exc:
                        self.fail(f"Unexpected error: {exc.__class__.__name__}", traceback.format_exc())
                    finally:
                        # note every test file BEFORE the rollback erases the rows
                        self.uploaded_paths |= set(
                            Document.objects.filter(student_id__in=self.student_ids).values_list("file_url", flat=True)
                        )
                    raise _Rollback()
        except _Rollback:
            pass
        finally:
            cache.clear()
            self.cleanup_storage()

        if options.get("with_frontend"):
            self.section("Frontend build")
            self.frontend_build()

        elapsed = time.monotonic() - started
        passed = sum(1 for r in self.results if r["result"] == "PASS")
        warned = sum(1 for r in self.results if r["result"] == "WARN")
        failed = [r for r in self.results if r["result"] == "FAIL"]

        self.stdout.write("")
        if options.get("report"):
            self.write_report(options["report"], passed, warned, failed, elapsed)
            self.stdout.write(f"Report written to {options['report']}")

        summary = f"{passed} passed, {warned} warnings, {len(failed)} failed ({len(self.results)} checks, {elapsed:.0f}s)."
        if failed:
            self.stdout.write(self.style.ERROR(summary))
            for r in failed:
                self.stdout.write(f"  - {r['id']} {r['check']}")
            self.stdout.write("All database changes were rolled back.")
            raise CommandError("system test failed")
        self.stdout.write(self.style.SUCCESS(summary + " All database changes were rolled back."))

    def section(self, title):
        self.area = title
        self.stdout.write(self.style.MIGRATE_HEADING(f"\n{title}"))
        cache.clear()  # fresh rate-limit counters per section

    def _record(self, result, name, detail, ref):
        prefix = self.area.split(" ")[0].rstrip(".")
        self.counter[prefix] = self.counter.get(prefix, 0) + 1
        check_id = f"{prefix}.{self.counter[prefix]:02d}"
        self.results.append(
            {"id": check_id, "area": self.area, "check": name, "ref": ref, "result": result, "detail": str(detail)[:300]}
        )
        style = {"PASS": self.style.SUCCESS, "WARN": self.style.WARNING, "FAIL": self.style.ERROR}[result]
        line = f"  {style(result)}  {check_id} {name}"
        if result != "PASS" and detail:
            line += f"  [{str(detail)[:300]}]"
        self.stdout.write(line)

    def expect(self, name, ok, detail="", ref=""):
        self._record("PASS" if ok else "FAIL", name, detail, ref)
        return ok

    def require(self, name, ok, detail="", ref=""):
        """Like expect, but stops the section when it fails."""
        if not self.expect(name, ok, detail, ref):
            raise _Stop()

    def warn(self, name, ok, detail="", ref=""):
        self._record("PASS" if ok else "WARN", name, detail, ref)

    def fail(self, name, detail=""):
        self._record("FAIL", name, detail, "")

    def run_section(self, title, fn):
        self.section(title)
        try:
            # Each section runs in its own savepoint, so a database error in
            # one section can't poison the transaction for the next.
            with transaction.atomic():
                fn()
        except _Stop:
            self.stdout.write(self.style.WARNING("  (rest of this section skipped)"))
        except Exception as exc:
            self.fail(f"Unexpected error: {exc.__class__.__name__}: {exc}", traceback.format_exc()[-600:])

    def cleanup_storage(self):
        for path in sorted(p for p in self.uploaded_paths if p):
            try:
                delete_document(path)
            except Exception:
                pass  # already removed (e.g. by account deletion) or unreachable

    # ---------------------------------------------------------------- API helpers

    def client(self, token=None, ip="127.0.0.1"):
        c = APIClient(SERVER_NAME="localhost", REMOTE_ADDR=ip)
        if token:
            c.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        return c

    @staticmethod
    def body(r):
        try:
            return r.json()
        except Exception:
            return {}

    @staticmethod
    def last_code(email):
        for message in reversed(getattr(mail, "outbox", [])):
            if email in message.to:
                found = re.search(r"\b(\d{6})\b", message.body)
                if found:
                    return found.group(1)
        return ""

    @staticmethod
    def new_email(label):
        return f"st-{label}-{uuid.uuid4().hex[:8]}@scout.test"

    def register_student(self, email, password=PASSWORD, full_name="System Tester"):
        cache.clear()
        return self.client().post(
            "/api/accounts/register/",
            {"full_name": full_name, "email": email, "password": password, "confirm_password": password},
            format="json",
        )

    def register_provider(self, email, password=PASSWORD, **extra):
        cache.clear()
        data = {
            "role": "provider",
            "company_name": "System Test Co",
            "industry": "Technology",
            "province": "Gauteng",
            "email": email,
            "password": password,
            "confirm_password": password,
        }
        data.update(extra)
        return self.client().post("/api/accounts/register/", data, format="json")

    def verify(self, otp_id, code):
        cache.clear()
        return self.client().post("/api/accounts/verify-otp/", {"otp_id": otp_id, "otp_code": code}, format="json")

    def login(self, email, password=PASSWORD):
        cache.clear()
        r = self.client().post("/api/accounts/login/", {"email": email, "password": password}, format="json")
        return r, (self.body(r).get("token") if r.status_code == 200 else None)

    def new_student(self, label, profile=BASE_PROFILE):
        """Register + verify a student (and save a profile). Returns (email, client, Student)."""
        email = self.new_email(label)
        r = self.register_student(email)
        self.require(f"Set-up: register {label} student", r.status_code == 201, f"{r.status_code} {self.body(r)}")
        r = self.verify(self.body(r)["otp_id"], self.last_code(email))
        self.require(f"Set-up: verify {label} student", r.status_code == 200, f"{r.status_code} {self.body(r)}")
        c = self.client(self.body(r)["token"])
        student = Student.objects.get(email=email)
        self.student_ids.add(student.student_id)
        if profile:
            r = c.patch("/api/accounts/profile/", profile, format="json")
            self.require(f"Set-up: {label} profile saved", r.status_code == 200, f"{r.status_code} {self.body(r)}")
        return email, c, student

    def new_provider(self, label):
        email = self.new_email(label)
        r = self.register_provider(email, company_name=f"ST {label} Co")
        self.require(f"Set-up: register {label} provider", r.status_code == 201, f"{r.status_code} {self.body(r)}")
        r = self.verify(self.body(r)["otp_id"], self.last_code(email))
        self.require(f"Set-up: verify {label} provider", r.status_code == 200, f"{r.status_code} {self.body(r)}")
        return email, self.client(self.body(r)["token"]), Provider.objects.get(email=email)

    def make_listing(self, provider, title, **fields):
        """Insert a verified, live listing straight into the database."""
        data = {
            "provider_id": provider.provider_id,
            "admin_id": self.admin.admin_id,
            "title": f"ST {title} {uuid.uuid4().hex[:6]}",
            "opportunity_type": "Internship",
            "field_of_study": "Information Technology",
            "eligibility_type": "Any",
            "description": "Created by system_test.",
            "closing_date": timezone.now() + timedelta(days=30),
            "is_verified": True,
            "is_active": True,
        }
        data.update(fields)
        return Opportunity.objects.create(**data)

    def upload(self, c, doc_type, name=None, content=PDF_BYTES, content_type="application/pdf"):
        return c.post(
            "/api/documents/upload/",
            {"document_type": doc_type, "file": SimpleUploadedFile(name or f"{doc_type}.pdf", content, content_type=content_type)},
            format="multipart",
        )

    def admin_client(self):
        token, _ = Token.objects.get_or_create(user=self.admin_user)
        return self.client(token.key)

    # ================================================================ the test

    def run_all(self):
        self.run_section("1. Environment and setup", self.t_setup)
        if not getattr(self, "admin", None):
            return  # every later section needs the admin and a demo provider
        sections = [
            ("2. Student registration and email verification", self.t_registration),
            ("3. Verification code security", self.t_code_security),
            ("4. Resend limits and rate limits", self.t_resend_and_rate_limits),
            ("5. Login and logout", self.t_login),
            ("6. Provider registration", self.t_provider_registration),
            ("7. Roles and permissions", self.t_permissions),
            ("8. Student profile", self.t_profile),
            ("9. Documents and storage", self.t_documents),
            ("10. Eligibility matching", self.t_matching),
            ("11. Assisted apply and receipts", self.t_apply),
            ("12. Dashboard, summary and PDF", self.t_dashboard),
            ("13. Bookmarks", self.t_bookmarks),
            ("14. Provider listings", self.t_provider_listings),
            ("15. Applicant review and outcomes", self.t_outcomes),
            ("16. Administrator verification", self.t_admin_verify),
            ("17. Notifications", self.t_notifications),
            ("18. Deadline reminders", self.t_reminders),
            ("19. Administrator activity monitoring", self.t_activity),
            ("20. Account deletion and re-registration", self.t_delete_account),
            ("21. Security", self.t_security),
            ("22. Performance", self.t_performance),
            ("23. Deployment configuration", self.t_deployment),
        ]
        for title, fn in sections:
            self.run_section(title, fn)

    # ---------------------------------------------------------------- 1
    def t_setup(self):
        try:
            call_command("check", stdout=io.StringIO())
            self.expect("Django system check has no issues", True)
        except Exception as exc:
            self.expect("Django system check has no issues", False, exc)
        with connection.cursor() as cur:
            cur.execute("SELECT 1")
            self.require("Database reachable", cur.fetchone() == (1,))
            cur.execute(
                "SELECT table_name FROM information_schema.tables WHERE table_schema='public' "
                "AND table_name IN ('student','profile','provider','opportunity','application',"
                "'bookmark','notification','document','admin','login_otp')"
            )
            tables = {row[0] for row in cur.fetchall()}
            cur.execute(
                "SELECT 1 FROM information_schema.columns WHERE table_name='provider' AND column_name='authuserid'"
            )
            has_authuserid = cur.fetchone() is not None
        self.require("All 10 application tables exist", len(tables) == 10, sorted(tables), "NFR12")
        self.expect("provider.authuserid column exists", has_authuserid, ref="NFR12")
        self.require(
            "Demo data present (run seed_demo if this fails)",
            Provider.objects.filter(email="provider@byteworks.demo").exists()
            and Student.objects.filter(email="student@scout.demo").exists(),
        )
        self.admin = PlatformAdmin.objects.filter(is_active=True).order_by("admin_id").first()
        self.admin_user = (
            User.objects.filter(is_staff=True, email__in=PlatformAdmin.objects.filter(is_active=True).values("email"))
            .order_by("id")
            .first()
        )
        if self.admin_user:
            self.admin = PlatformAdmin.objects.get(email=self.admin_user.email)
        ok = self.admin is not None and self.admin_user is not None
        if not ok:
            self.admin = None
        self.require("An administrator exists (staff user + active admin row)", ok, ref="FR27")
        self.expect("CORS allows FRONTEND_URL", settings.FRONTEND_URL in settings.CORS_ALLOWED_ORIGINS)
        self.expect(
            "Reminder middleware is installed",
            "notifications.reminders.ReminderTriggerMiddleware" in settings.MIDDLEWARE,
            ref="FR21",
        )

    # ---------------------------------------------------------------- 2
    def t_registration(self):
        email = self.new_email("reg")
        r = self.register_student(email)
        body = self.body(r)
        self.require("Register student -> 201 with a verification step", r.status_code == 201 and body.get("requires_verification"), body, "FR1")
        user = User.objects.get(username=email)
        student = Student.objects.get(email=email)
        self.student_ids.add(student.student_id)
        self.expect("New account is created inactive", user.is_active is False, ref="FR1")
        self.expect("Student row starts unverified", student.is_email_verified is False, ref="FR1")
        self.expect("Name split into first and last name", (student.first_name, student.last_name) == ("System", "Tester"))
        code = self.last_code(email)
        self.expect("Six-digit code is emailed", len(code) == 6, ref="FR2")
        self.expect("Code does not appear in the API response", code not in str(body), ref="NFR1")

        r = self.verify(body["otp_id"], code)
        vbody = self.body(r)
        self.require("Correct code activates the account and signs in", r.status_code == 200 and vbody.get("token"), vbody, "FR2")
        self.expect("Signed in as role student", vbody.get("user", {}).get("role") == "student", vbody, "FR2")
        user.refresh_from_db()
        student.refresh_from_db()
        self.expect("Account is now active", user.is_active, ref="FR2")
        self.expect("Student row marked email-verified", student.is_email_verified, ref="FR2")
        r = self.client(vbody["token"]).get("/api/accounts/me/")
        self.expect("Token from verification works on /me", r.status_code == 200 and self.body(r)["user"]["email"] == email)

        # Duplicate checks run against the now-verified account.
        bad = [
            ({"full_name": "System Tester", "email": email, "password": PASSWORD, "confirm_password": PASSWORD}, "Same email again is refused"),
            ({"full_name": "System Tester", "email": email.upper(), "password": PASSWORD, "confirm_password": PASSWORD}, "Same email in capitals is refused"),
            ({"full_name": "System Tester", "email": self.new_email("x"), "password": "Short-1", "confirm_password": "Short-1"}, "Password under 10 characters is refused"),
            ({"full_name": "System Tester", "email": self.new_email("x"), "password": PASSWORD, "confirm_password": PASSWORD + "x"}, "Mismatched passwords are refused"),
            ({"full_name": "Cher", "email": self.new_email("x"), "password": PASSWORD, "confirm_password": PASSWORD}, "Single-word name is refused"),
            ({"email": self.new_email("x"), "password": PASSWORD, "confirm_password": PASSWORD}, "Missing name is refused"),
            ({"full_name": "A B", "email": "", "password": PASSWORD, "confirm_password": PASSWORD}, "Missing email is refused"),
            ({"full_name": "A B", "role": "admin", "email": self.new_email("x"), "password": PASSWORD, "confirm_password": PASSWORD}, "Self-registering as admin is refused"),
            ({"full_name": "A B", "email": "student@scout.demo", "password": PASSWORD, "confirm_password": PASSWORD}, "Email used by an existing student is refused"),
            ({"full_name": "A B", "email": "provider@byteworks.demo", "password": PASSWORD, "confirm_password": PASSWORD}, "Email used by a provider is refused (unique across roles)"),
        ]
        for payload, name in bad:
            cache.clear()
            r = self.client().post("/api/accounts/register/", payload, format="json")
            self.expect(name, r.status_code == 400, f"{r.status_code} {self.body(r)}", "FR1")


        # An abandoned sign-up must not lock the email forever.
        email2 = self.new_email("abandon")
        self.register_student(email2)
        r = self.register_student(email2)
        self.expect("Abandoned (never verified) sign-up can register again", r.status_code == 201, f"{r.status_code} {self.body(r)}", "FR1")
        r = self.verify(self.body(r).get("otp_id"), self.last_code(email2))
        self.expect("...and the new code activates it", r.status_code == 200, f"{r.status_code} {self.body(r)}", "FR2")
        self.student_ids.update(Student.objects.filter(email=email2).values_list("student_id", flat=True))

    # ---------------------------------------------------------------- 3
    def t_code_security(self):
        email = self.new_email("otp")
        r = self.register_student(email)
        otp_id = self.body(r)["otp_id"]
        code = self.last_code(email)
        self.student_ids.update(Student.objects.filter(email=email).values_list("student_id", flat=True))
        record = LoginOTP.objects.get(id=otp_id)
        self.expect("Only a salted hash of the code is stored", record.code_hash != code and "$" in record.code_hash, ref="FR2 / NFR1")
        self.expect("Resend token stored as a hash", record.resend_token_hash and "$" in record.resend_token_hash, ref="NFR1")
        self.expect("Code expires 5 minutes after issue", abs((record.expires_at - record.created_at) - timedelta(minutes=5)) < timedelta(seconds=5), ref="FR2")

        wrong = "000000" if code != "000000" else "111111"
        r = self.verify(otp_id, wrong)
        self.expect("Wrong code is refused", r.status_code == 400, r.status_code, "FR2")
        for payload, name in [
            ({"otp_id": otp_id, "otp_code": "12345"}, "Five-digit code is refused"),
            ({"otp_id": otp_id, "otp_code": "abcdef"}, "Non-numeric code is refused"),
            ({"otp_id": "x", "otp_code": code}, "Non-numeric code id is refused"),
            ({"otp_id": 999999999, "otp_code": code}, "Unknown code id is refused"),
        ]:
            cache.clear()
            r = self.client().post("/api/accounts/verify-otp/", payload, format="json")
            self.expect(name, r.status_code == 400, r.status_code, "FR2")

        # expired
        LoginOTP.objects.filter(id=otp_id).update(expires_at=timezone.now() - timedelta(seconds=1))
        r = self.verify(otp_id, code)
        self.expect("Expired code is refused", r.status_code == 400, r.status_code, "FR2")
        self.expect("Account stays inactive after a refused code", not User.objects.get(username=email).is_active, ref="FR2")

        # attempt limit
        email = self.new_email("attempts")
        r = self.register_student(email)
        otp_id = self.body(r)["otp_id"]
        code = self.last_code(email)
        self.student_ids.update(Student.objects.filter(email=email).values_list("student_id", flat=True))
        wrong = "000000" if code != "000000" else "111111"
        for _ in range(5):
            self.verify(otp_id, wrong)
        r = self.verify(otp_id, code)
        self.expect("Correct code refused after 5 wrong attempts", r.status_code == 400, r.status_code, "FR2")
        self.expect("Attempts counter stops at 5", LoginOTP.objects.get(id=otp_id).attempts == 5, LoginOTP.objects.get(id=otp_id).attempts, "FR2")

        # reuse
        email = self.new_email("reuse")
        r = self.register_student(email)
        otp_id = self.body(r)["otp_id"]
        code = self.last_code(email)
        self.student_ids.update(Student.objects.filter(email=email).values_list("student_id", flat=True))
        self.verify(otp_id, code)
        r = self.verify(otp_id, code)
        self.expect("A used code cannot be used again", r.status_code == 400, r.status_code, "FR2")

    # ---------------------------------------------------------------- 4
    def t_resend_and_rate_limits(self):
        email = self.new_email("resend")
        r = self.register_student(email)
        body = self.body(r)
        first_code = self.last_code(email)
        self.student_ids.update(Student.objects.filter(email=email).values_list("student_id", flat=True))

        def resend(otp_id, token):
            cache.clear()
            return self.client().post("/api/accounts/resend-otp/", {"otp_id": otp_id, "resend_token": token}, format="json")

        r = resend(body["otp_id"], body["resend_token"])
        self.expect("Resend inside the 60-second cooldown is refused", r.status_code == 429, r.status_code, "FR2")
        r = resend(body["otp_id"], "not-the-token")
        self.expect("Resend with a wrong resend token is refused", r.status_code == 400, r.status_code, "FR2")

        user = User.objects.get(username=email)
        otp_id, token = body["otp_id"], body["resend_token"]
        for n in range(1, 4):
            LoginOTP.objects.filter(user=user).update(created_at=timezone.now() - timedelta(minutes=2))
            r = resend(otp_id, token)
            rb = self.body(r)
            self.expect(f"Resend {n} of 3 succeeds", r.status_code == 200 and rb.get("resends_remaining") == 3 - n, f"{r.status_code} {rb}", "FR2")
            if r.status_code != 200:
                return
            otp_id, token = rb["otp_id"], rb["resend_token"]
        LoginOTP.objects.filter(user=user).update(created_at=timezone.now() - timedelta(minutes=2))
        r = resend(otp_id, token)
        self.expect("Fourth resend is refused (limit 3)", r.status_code == 429, r.status_code, "FR2")
        r = self.verify(otp_id, first_code)
        self.expect("The original code no longer works after a resend", r.status_code == 400, r.status_code, "FR2")
        r = self.verify(otp_id, self.last_code(email))
        self.expect("The newest code works", r.status_code == 200, r.status_code, "FR2")

        # endpoint rate limits (counted per client IP)
        cache.clear()
        codes = [self.client(ip="10.9.0.1").post("/api/accounts/verify-otp/", {"otp_id": 1, "otp_code": "1"}, format="json").status_code for _ in range(6)]
        self.expect("Verify endpoint limited to 5 requests per minute", codes[:5].count(429) == 0 and codes[5] == 429, codes, "NFR3")
        codes = [self.client(ip="10.9.0.2").post("/api/accounts/resend-otp/", {"otp_id": 1, "resend_token": "x"}, format="json").status_code for _ in range(6)]
        self.expect("Resend endpoint limited to 5 requests per minute", codes[:5].count(429) == 0 and codes[5] == 429, codes, "NFR3")
        codes = [self.client(ip="10.9.0.3").post("/api/accounts/login/", {"email": "nobody@scout.test", "password": "x"}, format="json").status_code for _ in range(21)]
        self.expect("Anonymous requests limited to 20 per minute", codes[:20].count(429) == 0 and codes[20] == 429, codes[-3:], "NFR3")
        cache.clear()

    # ---------------------------------------------------------------- 5
    def t_login(self):
        email, _, _ = self.new_student("login", profile=None)
        r, token = self.login(email)
        self.require("Verified user logs in with email + password only", token is not None, f"{r.status_code} {self.body(r)}", "FR3")
        self.expect("Login payload carries the role", self.body(r)["user"]["role"] == "student", ref="FR5")
        self.expect("Login records last_login (used by activity monitoring)", User.objects.get(username=email).last_login is not None)
        r, t = self.login(email.upper())
        self.expect("Email is case-insensitive at login", t is not None, r.status_code, "FR3")
        r, _ = self.login(email, "wrong-password-123")
        self.expect("Wrong password -> 401", r.status_code == 401, r.status_code, "FR3")
        r, _ = self.login("nobody-" + email)
        self.expect("Unknown email -> same 401 (no account discovery)", r.status_code == 401 and self.body(r).get("error") == "Invalid email or password.", self.body(r), "FR3 / FR5")
        cache.clear()
        r = self.client().post("/api/accounts/login/", {"email": email}, format="json")
        self.expect("Missing password -> 400", r.status_code == 400, r.status_code)

        pending = self.new_email("pending")
        self.register_student(pending)
        self.student_ids.update(Student.objects.filter(email=pending).values_list("student_id", flat=True))
        r, _ = self.login(pending)
        self.expect("Unverified account with the right password is told to verify", r.status_code == 403 and "verify" in self.body(r).get("error", "").lower(), self.body(r), "FR3")
        r, _ = self.login(pending, "wrong-password-123")
        self.expect("Unverified account with a wrong password gets the generic error", r.status_code == 401, r.status_code, "FR3")

        r, token2 = self.login(email)
        self.expect("Logging in twice returns the same token", token2 == token)
        c = self.client(token)
        r = c.post("/api/accounts/logout/")
        self.expect("Logout -> 200", r.status_code == 200, r.status_code, "FR4")
        self.expect("Token is deleted on the server", not Token.objects.filter(key=token).exists(), ref="FR4")
        self.expect("Old token is refused afterwards", c.get("/api/accounts/me/").status_code == 401, ref="FR4")
        self.expect("Logout without a token is refused", self.client().post("/api/accounts/logout/").status_code == 401, ref="FR4")

    # ---------------------------------------------------------------- 6
    def t_provider_registration(self):
        email = self.new_email("prov")
        r = self.register_provider(email, phone="0211234567")
        body = self.body(r)
        self.require("Register provider -> 201", r.status_code == 201, body, "FR1")
        provider = Provider.objects.get(email=email)
        self.expect("Provider row linked to auth_user", provider.auth_user_id == User.objects.get(username=email).id, ref="FR1")
        self.expect("Phone number stored", provider.phone == "0211234567", ref="FR1")
        self.expect("Provider account starts inactive", not User.objects.get(username=email).is_active, ref="FR1")
        for extra, name in [
            ({"company_name": ""}, "Missing company name is refused"),
            ({"industry": ""}, "Missing industry is refused"),
            ({"province": "Atlantis"}, "Invalid province is refused"),
        ]:
            r = self.register_provider(self.new_email("x"), **extra)
            self.expect(name, r.status_code == 400, f"{r.status_code} {self.body(r)}", "FR1")
        r = self.register_provider(self.new_email("x"), phone=None)
        self.expect("Phone number is optional", r.status_code == 201, f"{r.status_code} {self.body(r)}", "FR1")

        r = self.verify(body["otp_id"], self.last_code(email))
        vb = self.body(r)
        self.require("Provider verifies and is signed in as provider", r.status_code == 200 and vb["user"]["role"] == "provider", vb, "FR2")
        self.expect("Payload includes the company name", vb["user"].get("company_name") == "System Test Co")
        pc = self.client(vb["token"])
        r = pc.get("/api/opportunities/provider/listings/")
        self.expect("New provider reaches an empty dashboard", r.status_code == 200 and self.body(r).get("results") == [], f"{r.status_code} {self.body(r)}", "FR23")
        r, t = self.login(email)
        self.expect("Provider logs in again with email + password", t is not None, r.status_code, "FR3")

    # ---------------------------------------------------------------- 7
    def t_permissions(self):
        _, st, _ = self.new_student("perm")
        _, pv, _ = self.new_provider("perm")
        ad = self.admin_client()
        anon = self.client()

        student_eps = [("get", "/api/opportunities/"), ("get", "/api/applications/mine/"), ("get", "/api/applications/bookmarks/"),
                       ("get", "/api/notifications/"), ("get", "/api/accounts/profile/"), ("get", "/api/applications/mine/summary/pdf/")]
        provider_eps = [("get", "/api/opportunities/provider/listings/"), ("get", "/api/applications/provider/applicants/1/")]
        admin_eps = [("get", "/api/providers-admin/listings/pending/"), ("post", "/api/providers-admin/listings/1/verify/"),
                     ("get", "/api/providers-admin/activity/")]

        def codes(c, eps):
            return [getattr(c, m)(p).status_code for m, p in eps]

        cache.clear()
        self.expect("Anonymous users get 401 on every protected endpoint",
                    all(x == 401 for x in codes(anon, student_eps + provider_eps + admin_eps)), codes(anon, student_eps + provider_eps + admin_eps), "FR5")
        self.expect("Provider cannot use student endpoints", all(x == 403 for x in codes(pv, student_eps)), codes(pv, student_eps), "FR5")
        self.expect("Student cannot use provider endpoints", all(x == 403 for x in codes(st, provider_eps)), codes(st, provider_eps), "FR5")
        self.expect("Student cannot use admin endpoints", all(x == 403 for x in codes(st, admin_eps)), codes(st, admin_eps), "FR5")
        self.expect("Provider cannot use admin endpoints", all(x == 403 for x in codes(pv, admin_eps)), codes(pv, admin_eps), "FR5")
        self.expect("Admin cannot use student endpoints", all(x == 403 for x in codes(ad, student_eps[:5])), codes(ad, student_eps[:5]), "FR5")
        r = ad.get("/api/accounts/me/")
        self.expect("Admin /me reports role admin", self.body(r).get("user", {}).get("role") == "admin", self.body(r), "FR5")
        r = self.client(token="0" * 40).get("/api/accounts/me/")
        self.expect("A made-up token is refused", r.status_code == 401, r.status_code, "FR5")

        # A staff flag alone is not enough to be an admin.
        email, sc, student = self.new_student("staff", profile=None)
        User.objects.filter(username=email).update(is_staff=True)
        r = sc.get("/api/providers-admin/listings/pending/")
        self.expect("Staff flag without an admin row does not grant admin access", r.status_code == 403, r.status_code, "FR5")

    # ---------------------------------------------------------------- 8
    def t_profile(self):
        _, st, student = self.new_student("profile", profile=None)
        r = st.get("/api/accounts/profile/")
        self.expect("Empty profile loads before first save", r.status_code == 200, r.status_code, "FR6")
        r = st.patch("/api/accounts/profile/", {"institution": "Only this"}, format="json")
        self.expect("First save without all required fields is refused", r.status_code == 400, self.body(r), "FR6")
        bad = [
            ({**BASE_PROFILE, "year_level": None}, "Tertiary student without a year is refused"),
            ({**BASE_PROFILE, "student_type": "Graduate", "graduate_type": None, "qualification": "Bachelor", "year_level": None}, "Graduate without graduate type is refused"),
            ({**BASE_PROFILE, "student_type": "Graduate", "graduate_type": "Undergraduate", "qualification": "Honours", "year_level": None}, "Undergraduate with an Honours qualification is refused"),
            ({**BASE_PROFILE, "student_type": "Graduate", "graduate_type": "Postgraduate", "qualification": "Diploma", "year_level": None}, "Postgraduate with a Diploma is refused"),
            ({**BASE_PROFILE, "academic_average": 101}, "Average above 100 is refused"),
            ({**BASE_PROFILE, "academic_average": -1}, "Negative average is refused"),
            ({**BASE_PROFILE, "province": "Atlantis"}, "Unknown province is refused"),
            ({**BASE_PROFILE, "field_of_study": "Basket weaving"}, "Unknown field of study is refused"),
            ({**BASE_PROFILE, "year_level": 9}, "Year of study above 6 is refused"),
        ]
        for payload, name in bad:
            r = st.patch("/api/accounts/profile/", payload, format="json")
            self.expect(name, r.status_code == 400, f"{r.status_code} {self.body(r)}", "FR6")
        r = st.patch("/api/accounts/profile/", BASE_PROFILE, format="json")
        self.require("Save Tertiary Student profile", r.status_code == 200, self.body(r), "FR6")
        r = st.patch("/api/accounts/profile/", {**BASE_PROFILE, "graduate_type": "Postgraduate", "qualification": "Masters"}, format="json")
        b = self.body(r)
        self.expect("Graduate-only fields are cleared for a tertiary student", r.status_code == 200 and b.get("qualification") is None and b.get("graduate_type") is None, b, "FR6")
        grad = {**BASE_PROFILE, "student_type": "Graduate", "graduate_type": "Postgraduate", "qualification": "Honours", "year_level": None}
        r = st.patch("/api/accounts/profile/", grad, format="json")
        b = self.body(r)
        self.expect("Switch to Graduate profile", r.status_code == 200 and b.get("qualification") == "Honours" and b.get("year_level") is None, b, "FR6")
        r = st.patch("/api/accounts/profile/", {"academic_average": 80}, format="json")
        self.expect("Partial update keeps other fields", self.body(r).get("qualification") == "Honours" and self.body(r).get("academic_average") == 80, self.body(r), "FR6")
        self.expect("Still exactly one profile row", Profile.objects.filter(student=student).count() == 1, ref="FR6")
        b = self.body(st.get("/api/accounts/profile/"))
        forbidden = {"id_number", "idnumber", "address", "race", "salary", "bank", "health"}
        self.expect("Profile holds no sensitive personal fields", not any(k for k in b if any(f in k.lower() for f in forbidden)), sorted(b), "FR7")

        # Database CHECK constraints are a second safety net.
        for sql, name in [
            ("UPDATE profile SET yearlevel = 2 WHERE studentid = %s", "Database rejects a graduate with a year of study"),
            ("UPDATE profile SET qualification = 'Diploma' WHERE studentid = %s", "Database rejects a Postgraduate with a Diploma"),
            ("UPDATE profile SET studenttype = 'Alien' WHERE studentid = %s", "Database rejects an unknown student type"),
        ]:
            try:
                with transaction.atomic(), connection.cursor() as cur:
                    cur.execute(sql, [student.student_id])
                self.expect(name, False, "update was accepted", "FR6 / NFR5")
            except IntegrityError:
                self.expect(name, True, ref="FR6 / NFR5")

    # ---------------------------------------------------------------- 9
    def t_documents(self):
        _, st, student = self.new_student("docs")
        _, other, _ = self.new_student("docs-other")
        r = st.get("/api/documents/")
        self.expect("Document list starts empty", r.status_code == 200 and self.body(r) == [], self.body(r), "FR8")

        r = self.upload(st, "cv", "cv.exe", b"MZ", "application/octet-stream")
        self.expect("Executable file is refused", r.status_code == 400, r.status_code, "FR8")
        r = self.upload(st, "cv", "cv.docx", b"PK", "application/msword")
        self.expect("Word document is refused", r.status_code == 400, r.status_code, "FR8")
        r = self.upload(st, "cv", "big.pdf", b"0" * (5 * 1024 * 1024 + 1))
        self.expect("File over 5 MB is refused", r.status_code == 400, r.status_code, "FR8")
        r = self.upload(st, "passport", "p.pdf")
        self.expect("Unknown document type is refused", r.status_code == 400, r.status_code, "FR8")
        r = st.post("/api/documents/upload/", {"document_type": "cv"}, format="multipart")
        self.expect("Upload without a file is refused", r.status_code == 400, r.status_code, "FR8")

        r = self.upload(st, "cv")
        self.require("Upload PDF CV", r.status_code == 201, f"{r.status_code} {self.body(r)}", "FR8")
        first = self.body(r)
        self.expect("Upload response hides the storage path", "file_url" not in first, first, "FR9")
        r = self.upload(st, "cv", "cv-v2.png", b"\x89PNG\r\n\x1a\n", "image/png")
        self.expect("Upload PNG replacement CV", r.status_code == 201, f"{r.status_code} {self.body(r)}", "FR8")
        rows = Document.objects.filter(student_id=student.student_id, document_type="cv")
        self.expect("Replacing a document retires the old row (not deleted)",
                    rows.count() == 2 and rows.filter(is_active=True).count() == 1
                    and not rows.get(document_id=first["document_id"]).is_active, list(rows.values("document_id", "is_active")), "FR8")
        docs = self.body(st.get("/api/documents/"))
        self.expect("List shows only the active CV", len(docs) == 1 and docs[0]["file_name"] == "cv-v2.png", docs, "FR8")
        r = self.upload(st, "academic_transcript", "t.jpg", b"\xff\xd8\xff", "image/jpeg")
        self.expect("Optional transcript (JPG) upload", r.status_code == 201, r.status_code, "FR8")

        r = st.get(f"/api/documents/{docs[0]['document_id']}/url/")
        b = self.body(r)
        self.expect("Signed link issued, valid for one hour", r.status_code == 200 and "token=" in b.get("signed_url", "") and b.get("expires_in") == 3600, r.status_code, "FR9")
        self.expect("Signed link does not contain the service key", settings.SUPABASE_SERVICE_KEY not in str(b), ref="FR9")
        r = other.get(f"/api/documents/{docs[0]['document_id']}/url/")
        self.expect("Another student cannot get a link to this document (404)", r.status_code == 404, r.status_code, "FR5 / FR9")
        self.expect("Another student's list does not show it", self.body(other.get("/api/documents/")) == [], ref="FR5")

    # ---------------------------------------------------------------- 10
    def t_matching(self):
        _, st, _ = self.new_student("match")
        _, _, prov = self.new_provider("match")
        L = lambda name, **f: self.make_listing(prov, name, **f)
        cases = [
            (L("no criteria"), True, "Listing with no optional criteria"),
            (L("other field", field_of_study="Engineering"), False, "Different field of study"),
            (L("other type", opportunity_type="Learnership"), False, "Different opportunity type"),
            (L("graduates only", eligibility_type="Graduate"), False, "Eligibility type Graduate"),
            (L("tertiary only", eligibility_type="Tertiary Student"), True, "Eligibility type Tertiary Student"),
            (L("avg equal", minimum_average=72), True, "Minimum average equal to the student's"),
            (L("avg higher", minimum_average=72.5), False, "Minimum average above the student's"),
            (L("year 2", year_level_required=2), True, "Year level equal to the student's"),
            (L("year 3", year_level_required=3), False, "Year level above the student's"),
            (L("same province", province="Western Cape"), True, "Same province"),
            (L("other province", province="Gauteng"), False, "Different province"),
            (L("needs qualification", required_qualification="Diploma"), False, "Tertiary student vs a required qualification"),
        ]
        hidden = [
            (L("expired", closing_date=timezone.now() - timedelta(hours=1)), "Expired listing"),
            (L("unverified", is_verified=False), "Unverified listing"),
            (L("inactive", is_active=False), "Inactive (removed) listing"),
        ]
        r = st.get("/api/opportunities/?view=all")
        all_rows = {o["opportunity_id"]: o for o in self.body(r).get("results", [])}
        r = st.get("/api/opportunities/?view=eligible")
        elig_ids = {o["opportunity_id"] for o in self.body(r).get("results", [])}
        for opp, expected, name in cases:
            row = all_rows.get(opp.opportunity_id)
            self.expect(
                f"{name}: {'eligible' if expected else 'not eligible'}",
                row is not None and row["eligible"] is expected and ((opp.opportunity_id in elig_ids) is expected),
                row and row["eligible"], "FR10 / FR11",
            )
        for opp, name in hidden:
            self.expect(f"{name} hidden from both views", opp.opportunity_id not in all_rows and opp.opportunity_id not in elig_ids, ref="FR11")
        dates = [o["closing_date"] for o in self.body(st.get("/api/opportunities/?view=all"))["results"]]
        self.expect("All view is ordered by closing date", dates == sorted(dates), ref="FR11")
        self.expect("Every row has bookmarked/applied flags", all("bookmarked" in o and "applied" in o for o in all_rows.values()), ref="FR12")
        r = st.get(f"/api/opportunities/{hidden[0][0].opportunity_id}/")
        self.expect("Expired listing detail still opens, flagged closed", r.status_code == 200 and self.body(r).get("is_closed") is True, r.status_code, "FR15")
        self.expect("Unverified listing detail -> 404", st.get(f"/api/opportunities/{hidden[1][0].opportunity_id}/").status_code == 404, ref="FR24")

        # browser-supplied values are ignored
        r = st.get("/api/opportunities/?view=eligible&academic_average=100&field_of_study=Engineering")
        ids = {o["opportunity_id"] for o in self.body(r).get("results", [])}
        self.expect("Eligibility ignores values sent by the browser", ids == elig_ids, ref="FR10")
        self.expect("Invalid view parameter -> 400", st.get("/api/opportunities/?view=bogus").status_code == 400, ref="FR11")

        # graduates and qualification ranking
        grad = {**BASE_PROFILE, "student_type": "Graduate", "graduate_type": "Postgraduate", "qualification": "Masters", "year_level": None}
        st.patch("/api/accounts/profile/", grad, format="json")
        g_cases = [
            (L("needs bachelor", required_qualification="Bachelor"), True, "Masters graduate vs Bachelor requirement (higher qualifies)"),
            (L("needs masters", required_qualification="Masters"), True, "Masters graduate vs Masters requirement"),
            (L("needs doctorate", required_qualification="Doctorate"), False, "Masters graduate vs Doctorate requirement"),
            (L("grad year", year_level_required=1), False, "Graduate vs a listing that sets a year level"),
            (L("grad only", eligibility_type="Graduate"), True, "Eligibility type Graduate for a graduate"),
            (L("tertiary only g", eligibility_type="Tertiary Student"), False, "Eligibility type Tertiary Student for a graduate"),
        ]
        rows = {o["opportunity_id"]: o for o in self.body(st.get("/api/opportunities/?view=all")).get("results", [])}
        for opp, expected, name in g_cases:
            row = rows.get(opp.opportunity_id)
            self.expect(f"{name}: {'eligible' if expected else 'not eligible'}", row is not None and row["eligible"] is expected, row and row["eligible"], "FR10")

        _, nop, _ = self.new_student("noprofile", profile=None)
        r = nop.get("/api/opportunities/?view=eligible")
        self.expect("Student without a profile sees no eligible listings", r.status_code == 200 and self.body(r)["results"] == [] and self.body(r)["profile_complete"] is False, self.body(r).get("profile_complete"), "FR10")

    # ---------------------------------------------------------------- 11
    def t_apply(self):
        email, st, student = self.new_student("apply")
        _, _, prov = self.new_provider("apply")
        opp = self.make_listing(prov, "apply target")
        closed = self.make_listing(prov, "apply closed", closing_date=timezone.now() - timedelta(hours=1))
        no_fit = self.make_listing(prov, "apply no fit", minimum_average=99)
        mail.outbox = []

        r = st.post("/api/applications/review/", {"opportunity_id": opp.opportunity_id}, format="json")
        b = self.body(r)
        self.require("Review screen loads", r.status_code == 200, f"{r.status_code} {b}", "FR13")
        self.expect("Review blocks submission and lists CV + matric", b.get("can_submit") is False and {m["document_type"] for m in b.get("missing_documents", [])} == {"cv", "matric_certificate"}, b.get("missing_documents"), "FR16")
        self.expect("Review is pre-filled from the stored profile", b.get("applicant", {}).get("institution") == BASE_PROFILE["institution"], b.get("applicant"), "FR13")
        st.post("/api/applications/review/", {"opportunity_id": opp.opportunity_id}, format="json")
        n = Notification.objects.filter(student_id=student.student_id, notification_type="missing_document", channel="in_app").count()
        emails = [m for m in mail.outbox if email in m.to and "missing" in m.subject.lower()]
        self.expect("Missing-document alert is sent once, even after reopening", n == 1 and len(emails) == 1, f"in_app={n} emails={len(emails)}", "FR16")
        self.expect("Alert email links back to the same review screen", emails and f"/apply/{opp.opportunity_id}" in emails[0].body, ref="FR16")
        r = st.post("/api/applications/confirm/", {"opportunity_id": opp.opportunity_id}, format="json")
        self.expect("Confirm without required documents is refused", r.status_code == 400 and self.body(r).get("code") == "missing_documents", r.status_code, "FR15")
        self.expect("Nothing was created by review alone", not Application.objects.filter(student_id=student.student_id).exists(), ref="FR13")

        for t in ("cv", "matric_certificate"):
            self.require(f"Upload {t}", self.upload(st, t).status_code == 201, ref="FR8")
        r = st.post("/api/applications/review/", {"opportunity_id": opp.opportunity_id}, format="json")
        b = self.body(r)
        self.expect("Review now allows submission and attaches the documents", b.get("can_submit") is True and len(b.get("documents", [])) == 2, b.get("documents"), "FR13")

        mail.outbox = []
        r = st.post("/api/applications/confirm/", {"opportunity_id": opp.opportunity_id}, format="json")
        app = self.body(r).get("application", {})
        self.require("Confirm creates the application", r.status_code == 201, f"{r.status_code} {self.body(r)}", "FR14")
        self.expect("Status is Submitted", app.get("status") == "Submitted", app, "FR14")
        self.expect("Reference number has the form SCOUT-XXXXXXXXXX", re.fullmatch(r"SCOUT-[0-9A-F]{10}", app.get("reference_number", "")) is not None, app.get("reference_number"), "FR14")
        need = {"student_name", "opportunity_title", "company_name", "submitted_at", "reference_number", "status"}
        self.expect("Receipt has name, opportunity, provider, date, reference, status", need <= set(app), sorted(app), "FR17")
        receipts = [m for m in mail.outbox if email in m.to and app.get("reference_number", "?") in m.body]
        self.expect("Receipt is emailed", len(receipts) == 1, len(receipts), "FR17")

        r = st.post("/api/applications/confirm/", {"opportunity_id": opp.opportunity_id}, format="json")
        self.expect("Applying twice -> 409", r.status_code == 409, r.status_code, "FR15 / NFR5")
        try:
            with transaction.atomic():
                Application.objects.create(student_id=student.student_id, opportunity_id=opp.opportunity_id, reference_number="SCOUT-DUPLICATE0")
            self.expect("Database itself rejects a duplicate application", False, "insert accepted", "NFR5")
        except IntegrityError:
            self.expect("Database itself rejects a duplicate application", True, ref="NFR5")
        r = st.post("/api/applications/review/", {"opportunity_id": closed.opportunity_id}, format="json")
        self.expect("Closed listing -> 410", r.status_code == 410, r.status_code, "FR15")
        r = st.post("/api/applications/review/", {"opportunity_id": no_fit.opportunity_id}, format="json")
        self.expect("Ineligible listing -> 403", r.status_code == 403, r.status_code, "FR15")
        _, nop, _ = self.new_student("apply-noprofile", profile=None)
        r = nop.post("/api/applications/review/", {"opportunity_id": opp.opportunity_id}, format="json")
        self.expect("Incomplete profile -> 400", r.status_code == 400 and self.body(r).get("code") == "profile_incomplete", self.body(r), "FR15")
        r = st.post("/api/applications/review/", {}, format="json")
        self.expect("Missing opportunity id -> 400", r.status_code == 400, r.status_code)
        r = st.post("/api/applications/review/", {"opportunity_id": 999999999}, format="json")
        self.expect("Unknown opportunity -> 404", r.status_code == 404, r.status_code)
        r = st.get(f"/api/opportunities/{opp.opportunity_id}/")
        self.expect("Listing now shows as applied", self.body(r).get("applied") is True, ref="FR12")
        self.apply_ctx = {"student": st, "student_row": student, "email": email, "opp": opp, "app": app, "provider": prov}

    # ---------------------------------------------------------------- 12
    def t_dashboard(self):
        ctx = getattr(self, "apply_ctx", None)
        self.require("Apply section produced an application", ctx is not None and ctx["app"].get("application_id"))
        st, aid = ctx["student"], ctx["app"]["application_id"]
        r = st.get("/api/applications/mine/")
        rows = self.body(r).get("results", [])
        self.expect("Dashboard lists the application with its status", any(a["application_id"] == aid and a["status"] == "Submitted" for a in rows), rows, "FR19")
        r = st.get(f"/api/applications/mine/{aid}/receipt/")
        self.expect("Receipt reopens from the dashboard", r.status_code == 200 and self.body(r)["reference_number"] == ctx["app"]["reference_number"], r.status_code, "FR17")
        _, other, _ = self.new_student("dash-other")
        self.expect("Another student's receipt -> 404", other.get(f"/api/applications/mine/{aid}/receipt/").status_code == 404, ref="FR5")
        self.expect("Another student's dashboard does not show it", self.body(other.get("/api/applications/mine/"))["results"] == [], ref="FR5")
        r = st.get("/api/applications/mine/summary/")
        t = self.body(r).get("totals", {})
        self.expect("Summary totals by status", t.get("total") == 1 and t.get("submitted") == 1, t, "FR18")
        r = st.get("/api/applications/mine/summary/pdf/")
        ok = r.status_code == 200 and r["Content-Type"] == "application/pdf" and r.content[:4] == b"%PDF"
        self.expect("PDF summary downloads", ok, r.status_code, "FR18")
        self.expect("PDF is offered as a file download", "attachment" in r.get("Content-Disposition", ""), ref="FR18")
        r = other.get("/api/applications/mine/summary/pdf/")
        self.expect("PDF works for a student with no applications", r.status_code == 200 and r.content[:4] == b"%PDF", r.status_code, "FR18")

    # ---------------------------------------------------------------- 13
    def t_bookmarks(self):
        _, st, student = self.new_student("bm")
        _, _, prov = self.new_provider("bm")
        opp = self.make_listing(prov, "bookmark")
        hidden = self.make_listing(prov, "bookmark hidden", is_verified=False)
        r = st.post("/api/applications/bookmarks/", {"opportunity_id": opp.opportunity_id}, format="json")
        self.expect("Bookmark a listing", r.status_code == 201, r.status_code, "FR20")
        r = st.post("/api/applications/bookmarks/", {"opportunity_id": opp.opportunity_id}, format="json")
        self.expect("Saving again has no extra effect", r.status_code == 201 and Bookmark.objects.filter(student_id=student.student_id).count() == 1, ref="FR20 / NFR5")
        rows = self.body(st.get("/api/applications/bookmarks/")).get("results", [])
        self.expect("Watchlist shows the closing date", rows and rows[0]["opportunity_id"] == opp.opportunity_id and rows[0].get("closing_date"), rows, "FR20")
        self.expect("Listing shows as bookmarked", self.body(st.get(f"/api/opportunities/{opp.opportunity_id}/")).get("bookmarked") is True, ref="FR12")
        r = st.post("/api/applications/bookmarks/", {"opportunity_id": hidden.opportunity_id}, format="json")
        self.expect("Bookmarking an unverified listing -> 404", r.status_code == 404, r.status_code, "FR24")
        r = st.delete(f"/api/applications/bookmarks/{opp.opportunity_id}/")
        self.expect("Remove bookmark", r.status_code == 204 and not Bookmark.objects.filter(student_id=student.student_id).exists(), r.status_code, "FR20")
        r = st.delete(f"/api/applications/bookmarks/{opp.opportunity_id}/")
        self.expect("Removing twice is harmless", r.status_code == 204, r.status_code, "FR20")

    # ---------------------------------------------------------------- 14
    def t_provider_listings(self):
        _, pv, prov = self.new_provider("listings")
        _, other, _ = self.new_provider("listings-other")
        _, st, _ = self.new_student("listings")
        listing = {
            "title": "ST provider listing", "opportunity_type": "Internship", "field_of_study": "Information Technology",
            "eligibility_type": "Any", "description": "Created by system_test.",
            "closing_date": (timezone.now() + timedelta(days=20)).isoformat(),
        }
        for change, name in [
            ({"field_of_study": "Basket weaving"}, "Unknown field of study"),
            ({"closing_date": (timezone.now() - timedelta(days=1)).isoformat()}, "Closing date in the past"),
            ({"minimum_average": 120}, "Minimum average above 100"),
            ({"eligibility_type": "Graduate", "year_level_required": 2}, "Graduate listing with a year level"),
            ({"eligibility_type": "Tertiary Student", "required_qualification": "Bachelor"}, "Tertiary listing with a qualification"),
            ({"title": ""}, "Missing title"),
        ]:
            r = pv.post("/api/opportunities/provider/listings/", {**listing, **change}, format="json")
            self.expect(f"{name} is refused", r.status_code == 400, f"{r.status_code} {self.body(r)}", "FR23")
        r = pv.post("/api/opportunities/provider/listings/", {**listing, "minimum_average": 60, "province": "Gauteng"}, format="json")
        b = self.body(r)
        self.require("Create listing with optional criteria", r.status_code == 201, b, "FR23")
        lid = b["opportunity_id"]
        self.expect("New listing is unverified (pending)", b["state"] == "Pending verification" and not Opportunity.objects.get(opportunity_id=lid).is_verified, b.get("state"), "FR24")
        self.expect("Provider id comes from the token, not the request", Opportunity.objects.get(opportunity_id=lid).provider_id == prov.provider_id, ref="FR23")
        r = pv.post("/api/opportunities/provider/listings/", {**listing, "provider_id": 1, "is_verified": True}, format="json")
        sneaky = Opportunity.objects.get(opportunity_id=self.body(r)["opportunity_id"])
        self.expect("Provider cannot self-verify or post for another provider", sneaky.provider_id == prov.provider_id and not sneaky.is_verified, ref="FR23 / FR24")
        visible = {o["opportunity_id"] for o in self.body(st.get("/api/opportunities/?view=all"))["results"]}
        self.expect("Pending listing hidden from students", lid not in visible, ref="FR24")

        mine = self.body(pv.get("/api/opportunities/provider/listings/"))["results"]
        self.expect("Dashboard lists only this provider's listings", {l["opportunity_id"] for l in mine} == {lid, sneaky.opportunity_id}, ref="FR23")
        url = f"/api/opportunities/provider/listings/{lid}/"
        self.expect("Another provider: GET -> 404", other.get(url).status_code == 404, ref="FR23 / FR5")
        self.expect("Another provider: PATCH -> 404", other.patch(url, {"title": "hijack"}, format="json").status_code == 404, ref="FR23 / FR5")
        self.expect("Another provider: DELETE -> 404", other.delete(url).status_code == 404, ref="FR23 / FR5")
        self.expect("...and the listing is unchanged", Opportunity.objects.get(opportunity_id=lid).title == "ST provider listing", ref="FR23")

        Opportunity.objects.filter(opportunity_id=lid).update(is_verified=True)
        r = pv.patch(url, {"description": "Edited"}, format="json")
        self.expect("Edit own listing", r.status_code == 200 and self.body(r)["description"] == "Edited", r.status_code, "FR23")
        self.expect("Editing sends it back for verification", not Opportunity.objects.get(opportunity_id=lid).is_verified, ref="FR24")
        r = pv.delete(url)
        self.expect("Remove own listing", r.status_code == 204, r.status_code, "FR23")
        self.expect("Removal is a soft delete (history kept)", Opportunity.objects.filter(opportunity_id=lid, is_active=False).exists(), ref="FR23")
        self.expect("Removed listing gone from the dashboard", lid not in {l["opportunity_id"] for l in self.body(pv.get("/api/opportunities/provider/listings/"))["results"]}, ref="FR23")
        self.expect("Removed listing gone from the admin queue",
                    lid not in {l["opportunity_id"] for l in self.body(self.admin_client().get("/api/providers-admin/listings/pending/"))["results"]}, ref="FR27")

    # ---------------------------------------------------------------- 15
    def t_outcomes(self):
        ctx = getattr(self, "apply_ctx", None)
        self.require("Apply section produced an application", ctx is not None and ctx["app"].get("application_id"))
        prov, opp, aid, st, email = ctx["provider"], ctx["opp"], ctx["app"]["application_id"], ctx["student"], ctx["email"]
        pv = self.client(Token.objects.get_or_create(user=prov.auth_user)[0].key)
        _, other, _ = self.new_provider("outcome-other")

        r = pv.get("/api/opportunities/provider/listings/")
        row = next((l for l in self.body(r)["results"] if l["opportunity_id"] == opp.opportunity_id), {})
        self.expect("Dashboard counts the applicant as awaiting review", row.get("applicant_count") == 1 and row.get("awaiting_review") == 1, row, "FR25")
        r = pv.get(f"/api/applications/provider/listings/{opp.opportunity_id}/applicants/")
        apps = self.body(r).get("results", [])
        self.expect("Applicant list shows the student", any(a["application_id"] == aid for a in apps), apps, "FR25")
        self.expect("Another provider cannot list these applicants", other.get(f"/api/applications/provider/listings/{opp.opportunity_id}/applicants/").status_code == 404, ref="FR25 / FR5")
        url = f"/api/applications/provider/applicants/{aid}/"
        r = pv.get(url)
        b = self.body(r)
        self.expect("Applicant detail shows the professional profile", r.status_code == 200 and b["applicant"]["institution"] == BASE_PROFILE["institution"], r.status_code, "FR25 / FR29")
        self.expect("Applicant detail shows which documents are attached", {d["document_type"] for d in b.get("documents", [])} >= {"cv", "matric_certificate"} and b.get("missing_documents") == [], b.get("documents"), "FR25")
        text = str(b)
        leaked = re.search(r"student_\d+/|signed_url|file_url|/storage/v1", text)
        self.expect("No file links or storage paths reach the provider", leaked is None, leaked and leaked.group(0), "FR25")
        self.expect("No internal student id reaches the provider", "student_id" not in b["applicant"], ref="FR29")
        self.expect("Another provider: applicant detail -> 404", other.get(url).status_code == 404, ref="FR5")
        self.expect("Another provider cannot change the status", other.patch(url, {"status": "Under Review"}, format="json").status_code == 404, ref="FR26")

        for payload, name in [
            ({"status": "Rejected"}, "Unknown status is refused"),
            ({"status": "Submitted"}, "Setting the current status again is refused"),
            ({"status": "Outcome Received"}, "Outcome without a result is refused"),
            ({"status": "Outcome Received", "outcome_result": "Maybe"}, "Outcome with an unknown result is refused"),
        ]:
            r = pv.patch(url, payload, format="json")
            self.expect(name, r.status_code == 400, f"{r.status_code} {self.body(r)}", "FR26")
        mail.outbox = []
        r = pv.patch(url, {"status": "Under Review"}, format="json")
        self.expect("Move to Under Review", r.status_code == 200 and self.body(r)["applicant"]["status"] == "Under Review", r.status_code, "FR26")
        self.expect("reviewed_at is recorded", Application.objects.get(application_id=aid).reviewed_at is not None, ref="FR26")
        self.expect("Student is emailed about the status change", any(email in m.to and "Update on your application" in m.subject for m in mail.outbox), ref="FR22")
        r = pv.patch(url, {"status": "Submitted"}, format="json")
        self.expect("Moving backwards is refused", r.status_code == 400, r.status_code, "FR26 / NFR5")
        r = pv.patch(url, {"status": "Outcome Received", "outcome_result": "Successful"}, format="json")
        self.expect("Record outcome Successful", r.status_code == 200 and self.body(r)["applicant"]["outcome_result"] == "Successful", r.status_code, "FR26")
        r = pv.patch(url, {"status": "Outcome Received", "outcome_result": "Unsuccessful"}, format="json")
        self.expect("Outcome cannot be changed once recorded", r.status_code == 400 and Application.objects.get(application_id=aid).outcome_result == "Successful", r.status_code, "FR26")
        rows = self.body(st.get("/api/applications/mine/"))["results"]
        self.expect("Student dashboard shows Outcome Received + Successful", any(a["application_id"] == aid and a["status"] == "Outcome Received" and a["outcome_result"] == "Successful" for a in rows), rows, "FR19 / US11")
        types = set(Notification.objects.filter(student_id=ctx["student_row"].student_id, channel="in_app").values_list("notification_type", flat=True))
        self.expect("Student has submitted, status and outcome notifications", {"application_submitted", "status_changed", "outcome_received"} <= types, sorted(types), "FR22")

        # direct jump Submitted -> Outcome Received is allowed (forward)
        _, st2, _ = self.new_student("outcome2")
        for t in ("cv", "matric_certificate"):
            self.upload(st2, t)
        a2 = self.body(st2.post("/api/applications/confirm/", {"opportunity_id": opp.opportunity_id}, format="json")).get("application", {})
        r = pv.patch(f"/api/applications/provider/applicants/{a2.get('application_id')}/", {"status": "Outcome Received", "outcome_result": "Unsuccessful"}, format="json")
        self.expect("Submitted can jump straight to an outcome", r.status_code == 200, f"{r.status_code} {self.body(r)}", "FR26")

    # ---------------------------------------------------------------- 16
    def t_admin_verify(self):
        _, pv, prov = self.new_provider("admin")
        _, st, _ = self.new_student("admin")
        ad = self.admin_client()
        listing = {
            "title": "ST admin queue listing", "opportunity_type": "Internship", "field_of_study": "Information Technology",
            "eligibility_type": "Any", "description": "Created by system_test.",
            "closing_date": (timezone.now() + timedelta(days=20)).isoformat(),
        }
        lid = self.body(pv.post("/api/opportunities/provider/listings/", listing, format="json")).get("opportunity_id")
        self.require("Provider posts a listing", lid is not None, ref="FR27")
        r = ad.get("/api/providers-admin/listings/pending/")
        queue = self.body(r).get("results", [])
        item = next((l for l in queue if l["opportunity_id"] == lid), None)
        self.expect("New listing enters the verification queue", item is not None, r.status_code, "FR27")
        self.expect("Queue item has the full detail the admin needs", item and {"description", "provider_name", "closing_date", "field_of_study"} <= set(item), item and sorted(item), "FR27")
        posted = [l["posted_at"] for l in queue]
        self.expect("Queue is oldest first", posted == sorted(posted), ref="FR27")
        r = ad.post(f"/api/providers-admin/listings/{lid}/verify/")
        self.expect("Admin verifies the listing", r.status_code == 200, f"{r.status_code} {self.body(r)}", "FR27")
        opp = Opportunity.objects.get(opportunity_id=lid)
        self.expect("Listing is verified and stamped with the verifying admin", opp.is_verified and opp.admin_id == self.admin.admin_id, (opp.is_verified, opp.admin_id), "FR28 / NFR6")
        visible = {o["opportunity_id"] for o in self.body(st.get("/api/opportunities/?view=all"))["results"]}
        self.expect("Verified listing is now visible to students", lid in visible, ref="FR28")
        self.expect("Verified listing left the queue", lid not in {l["opportunity_id"] for l in self.body(ad.get("/api/providers-admin/listings/pending/"))["results"]}, ref="FR27")
        r = ad.post(f"/api/providers-admin/listings/{lid}/verify/")
        self.expect("Verifying again is refused", r.status_code == 400, r.status_code, "FR28")
        r = ad.post("/api/providers-admin/listings/999999999/verify/")
        self.expect("Verifying an unknown listing -> 404", r.status_code == 404, r.status_code, "FR27")
        out = io.StringIO()
        other = self.make_listing(prov, "cmd verify", is_verified=False)
        call_command("verify_listings", str(other.opportunity_id), stdout=out)
        self.expect("verify_listings command still works", Opportunity.objects.get(opportunity_id=other.opportunity_id).is_verified, out.getvalue()[:100])

    # ---------------------------------------------------------------- 17
    def t_notifications(self):
        email, st, student = self.new_student("notes")
        _, other, _ = self.new_student("notes-other")
        from notifications.utils import notify
        a = notify(student, "status_changed", "System test note A")
        notify(student, "status_changed", "System test note B")
        r = st.get("/api/notifications/")
        b = self.body(r)
        self.expect("Feed lists in-app notifications with an unread count", r.status_code == 200 and b["unread_count"] == 2 and len(b["results"]) == 2, b, "FR22")
        self.expect("Newest first", b["results"][0]["message"] == "System test note B", ref="FR22")
        r = other.post(f"/api/notifications/{a.notification_id}/read/")
        self.expect("Another student cannot mark it read", not Notification.objects.get(notification_id=a.notification_id).is_read, ref="FR5")
        r = st.post(f"/api/notifications/{a.notification_id}/read/")
        self.expect("Mark one as read", r.status_code == 200 and self.body(st.get("/api/notifications/"))["unread_count"] == 1, ref="FR22")
        r = st.post("/api/notifications/read-all/")
        self.expect("Mark all as read", r.status_code == 200 and self.body(st.get("/api/notifications/"))["unread_count"] == 0, ref="FR22")
        mail.outbox = []
        notify(student, "status_changed", "System test emailed", email_subject="System test subject")
        self.expect("Email copy is sent and logged as an email-channel row",
                    any(email in m.to for m in mail.outbox)
                    and Notification.objects.filter(student_id=student.student_id, channel="email", message="System test emailed").exists(), ref="FR22")
        feed = self.body(st.get("/api/notifications/"))["results"]
        self.expect("Email-channel rows stay out of the in-app feed", len([n for n in feed if n["message"] == "System test emailed"]) == 1, ref="FR22")
        with override_settings(EMAIL_BACKEND="core.management.commands.system_test.BrokenEmailBackend"):
            try:
                notify(student, "status_changed", "System test mail outage", email_subject="x")
                ok = Notification.objects.filter(student_id=student.student_id, message="System test mail outage", channel="in_app").exists()
                self.expect("A mail outage never blocks the in-app notification", ok, ref="NFR7")
            except Exception as exc:
                self.expect("A mail outage never blocks the in-app notification", False, exc, "NFR7")

    # ---------------------------------------------------------------- 18
    def t_reminders(self):
        email, st, student = self.new_student("remind")
        _, _, prov = self.new_provider("remind")
        soon = self.make_listing(prov, "closes in 2 days", closing_date=timezone.now() + timedelta(days=2))
        later = self.make_listing(prov, "closes in 5 days", closing_date=timezone.now() + timedelta(days=5))
        applied = self.make_listing(prov, "already applied", closing_date=timezone.now() + timedelta(days=1))
        gone = self.make_listing(prov, "already closed", closing_date=timezone.now() + timedelta(days=1))
        for o in (soon, later, applied, gone):
            st.post("/api/applications/bookmarks/", {"opportunity_id": o.opportunity_id}, format="json")
        Opportunity.objects.filter(opportunity_id=gone.opportunity_id).update(closing_date=timezone.now() - timedelta(hours=1))
        for t in ("cv", "matric_certificate"):
            self.upload(st, t)
        st.post("/api/applications/confirm/", {"opportunity_id": applied.opportunity_id}, format="json")

        mail.outbox = []
        reminders.send_due_reminders()
        bm = {b.opportunity_id: b for b in Bookmark.objects.filter(student_id=student.student_id)}
        self.expect("Bookmark closing within 3 days is reminded", bm[soon.opportunity_id].reminder_sent, ref="FR21")
        self.expect("Bookmark closing in 5 days is not reminded yet", not bm[later.opportunity_id].reminder_sent, ref="FR21")
        self.expect("Student who already applied is skipped", not bm[applied.opportunity_id].reminder_sent, ref="FR21")
        self.expect("Already-closed listing is skipped", not bm[gone.opportunity_id].reminder_sent, ref="FR21")
        self.expect("Reminder appears in the in-app feed", any(soon.title in n["message"] for n in self.body(st.get("/api/notifications/"))["results"]), ref="FR21 / FR22")
        emails = [m for m in mail.outbox if email in m.to and soon.title in m.subject]
        self.expect("Reminder is emailed with a link to the listing", len(emails) == 1 and f"/jobs/{soon.opportunity_id}" in emails[0].body, len(emails), "FR21")
        before = Notification.objects.filter(student_id=student.student_id, notification_type="deadline_reminder").count()
        reminders.send_due_reminders()
        call_command("send_bookmark_reminders", stdout=io.StringIO())
        after = Notification.objects.filter(student_id=student.student_id, notification_type="deadline_reminder").count()
        self.expect("Running again sends nothing new (once per bookmark)", before == after, (before, after), "FR21")
        reminders.send_due_reminders(now=timezone.now() + timedelta(days=3))
        self.expect("The 5-day bookmark is reminded once it enters the window", Bookmark.objects.get(bookmark_id=bm[later.opportunity_id].bookmark_id).reminder_sent, ref="FR21")

        # automatic trigger: runs in the background at most once per interval
        started = []

        class FakeThread:
            def __init__(self, target, daemon):
                self.target = target

            def start(self):
                started.append(self.target)

        real_thread, real_last = reminders.threading.Thread, reminders._last_run
        reminders.threading.Thread = FakeThread
        try:
            with override_settings(REMINDERS_AUTORUN=True, REMINDER_CHECK_INTERVAL=600):
                reminders._last_run = 0.0
                reminders.maybe_trigger_reminders()
                reminders.maybe_trigger_reminders()
            self.expect("Automatic check starts once, then waits for the interval", len(started) == 1, len(started), "FR21")
            with override_settings(REMINDERS_AUTORUN=False):
                reminders._last_run = 0.0
                reminders.maybe_trigger_reminders()
            self.expect("REMINDERS_AUTORUN=false switches it off", len(started) == 1, len(started), "FR21")
            with override_settings(REMINDERS_AUTORUN=True):
                reminders._last_run = 0.0
                st.get("/api/notifications/")
            self.expect("Normal API traffic triggers the check (middleware)", len(started) == 2, len(started), "FR21")
        finally:
            reminders.threading.Thread, reminders._last_run = real_thread, real_last

    # ---------------------------------------------------------------- 19
    def t_activity(self):
        ad = self.admin_client()
        before = self.body(ad.get("/api/providers-admin/activity/"))
        self.require("Admin gets activity analytics", "totals" in before, before)
        _, st, _ = self.new_student("activity")
        after = self.body(ad.get("/api/providers-admin/activity/"))
        t0, t1 = before["totals"], after["totals"]
        self.expect("Student total goes up by one after a sign-up", t1["students"] == t0["students"] + 1, (t0["students"], t1["students"]))
        self.expect("Seven-day sign-ups go up by one", t1["signups_7d"] == t0["signups_7d"] + 1)
        self.expect("Active users counts the new login", t1["active_users_7d"] >= t0["active_users_7d"] + 1, (t0["active_users_7d"], t1["active_users_7d"]))
        self.expect("Daily series covers 14 days ending today", len(after["daily"]) == 14 and after["daily"][-1]["date"] == timezone.localdate().isoformat(), after["daily"][-1])
        self.expect("Today's sign-ups include the new student", after["daily"][-1]["signups"] >= 1)
        self.expect("Newest event in the feed is the sign-up", after["recent_activity"][0]["kind"] == "student_signup", after["recent_activity"][:1])
        total_status = sum(after["applications_by_status"].values())
        self.expect("Status breakdown adds up to total applications", total_status == t1["applications"], (total_status, t1["applications"]))
        self.expect("Status breakdown has exactly the three statuses", set(after["applications_by_status"]) == {"Submitted", "Under Review", "Outcome Received"}, sorted(after["applications_by_status"]))
        self.expect("Top listings has at most 5 rows", len(after["top_listings"]) <= 5)
        self.expect("Feed has at most 15 rows", len(after["recent_activity"]) <= 15)

    # ---------------------------------------------------------------- 20
    def t_delete_account(self):
        email, st, student = self.new_student("delete")
        sid = student.student_id
        for t in ("cv", "matric_certificate"):
            self.upload(st, t)
        _, _, prov = self.new_provider("delete-target")
        opp = self.make_listing(prov, "delete target")
        st.post("/api/applications/bookmarks/", {"opportunity_id": opp.opportunity_id}, format="json")
        st.post("/api/applications/confirm/", {"opportunity_id": opp.opportunity_id}, format="json")
        paths = list(Document.objects.filter(student_id=sid).values_list("file_url", flat=True))
        self.uploaded_paths |= set(paths)

        r = st.post("/api/accounts/delete-account/", {"password": "wrong-password-123"}, format="json")
        self.expect("Wrong password does not delete", r.status_code == 400 and Student.objects.filter(student_id=sid).exists(), r.status_code, "FR30")
        r = st.post("/api/accounts/delete-account/", {}, format="json")
        self.expect("Missing password does not delete", r.status_code == 400, r.status_code, "FR30")
        self.expect("Anonymous delete is refused", self.client().post("/api/accounts/delete-account/", {"password": PASSWORD}, format="json").status_code == 401, ref="FR30")
        r = self.admin_client().post("/api/accounts/delete-account/", {"password": "anything"}, format="json")
        self.expect("Admin accounts cannot self-delete", r.status_code == 403, r.status_code, "FR30")

        r = st.post("/api/accounts/delete-account/", {"password": PASSWORD}, format="json")
        self.require("Student deletes their account", r.status_code == 200, f"{r.status_code} {self.body(r)}", "FR30")
        leftovers = {
            "auth_user": User.objects.filter(username=email).exists(),
            "student": Student.objects.filter(student_id=sid).exists(),
            "profile": Profile.objects.filter(student_id=sid).exists(),
            "document": Document.objects.filter(student_id=sid).exists(),
            "application": Application.objects.filter(student_id=sid).exists(),
            "bookmark": Bookmark.objects.filter(student_id=sid).exists(),
            "notification": Notification.objects.filter(student_id=sid).exists(),
            "login_otp": LoginOTP.objects.filter(user__username=email).exists(),
        }
        self.expect("Every row about the student is gone", not any(leftovers.values()), {k: v for k, v in leftovers.items() if v}, "FR30")
        self.expect("Old token no longer works", st.get("/api/accounts/me/").status_code == 401, ref="FR30")
        r, _ = self.login(email)
        self.expect("Old credentials no longer log in", r.status_code == 401, r.status_code, "FR30")
        from documents.supabase_storage import get_signed_url
        try:
            get_signed_url(paths[0])
            gone = False
        except Exception:
            gone = True
        self.expect("Stored files were removed from Supabase Storage", gone, paths[:1], "FR30")

        r = self.register_student(email, full_name="Returning Tester")
        self.expect("Same email can sign up again (acceptance criterion)", r.status_code == 201, f"{r.status_code} {self.body(r)}", "FR30")
        r = self.verify(self.body(r).get("otp_id"), self.last_code(email))
        self.expect("Returning user verifies and is signed in", r.status_code == 200 and self.body(r).get("token"), r.status_code, "FR30")
        new = Student.objects.filter(email=email).first()
        self.student_ids.update([new.student_id] if new else [])
        self.expect("Returning user starts with a clean account", new and new.student_id != sid and not Profile.objects.filter(student=new).exists(), ref="FR30")

        # provider deletion
        _, st2, s2 = self.new_student("delete-applicant")
        for t in ("cv", "matric_certificate"):
            self.upload(st2, t)
        st2.post("/api/applications/confirm/", {"opportunity_id": opp.opportunity_id}, format="json")
        pemail = prov.email
        pv = self.client(Token.objects.get_or_create(user=prov.auth_user)[0].key)
        r = pv.post("/api/accounts/delete-account/", {"password": PASSWORD}, format="json")
        self.require("Provider deletes their account", r.status_code == 200, f"{r.status_code} {self.body(r)}", "FR30")
        self.expect("Provider, its listings and their applications are gone",
                    not Provider.objects.filter(email=pemail).exists()
                    and not Opportunity.objects.filter(opportunity_id=opp.opportunity_id).exists()
                    and not Application.objects.filter(opportunity_id=opp.opportunity_id).exists(), ref="FR30")
        notes = [n["message"] for n in self.body(st2.get("/api/notifications/"))["results"]]
        self.expect("Affected applicant is told the application was removed", any("closed its Scout account" in m for m in notes), notes[:3], "FR30")
        r = self.register_provider(pemail)
        self.expect("Same provider email can sign up again", r.status_code == 201, f"{r.status_code} {self.body(r)}", "FR30")

    # ---------------------------------------------------------------- 21
    def t_security(self):
        email, st, _ = self.new_student("sec")
        user = User.objects.get(username=email)
        self.expect("Passwords are stored hashed by Django", user.password.startswith(("pbkdf2_", "argon2", "bcrypt", "scrypt")) and PASSWORD not in user.password, user.password[:12], "NFR1")
        self.expect("Legacy student.passwordhash column is unused", Student.objects.get(email=email).password_hash is None, ref="NFR1")
        b = str(self.body(st.get("/api/accounts/me/")))
        self.expect("No password or hash in API responses", "password" not in b and "pbkdf2" not in b, ref="NFR1")

        probes = ["' OR '1'='1", "1; DROP TABLE student; --", "\" OR 1=1 --"]
        for p in probes:
            r, _ = self.login(p, p)
            self.expect(f"SQL injection probe at login refused ({p[:12]})", r.status_code == 401, r.status_code, "NFR4")
        r = st.get("/api/opportunities/?view=' OR 1=1 --")
        self.expect("SQL injection probe in a query parameter refused", r.status_code == 400, r.status_code, "NFR4")
        r = st.get("/api/opportunities/1%20OR%201=1/")
        self.expect("Non-numeric ids do not reach the database", r.status_code == 404, r.status_code, "NFR4")
        self.expect("All 10 tables still exist after the probes", Student.objects.exists(), ref="NFR4")

        r = st.post("/api/applications/review/", {"opportunity_id": "abc"}, format="json")
        self.expect("Bad input returns a clean error, not a crash", r.status_code in (400, 404), f"{r.status_code} {self.body(r)}", "NFR4")
        self.expect("Error responses carry no stack trace", "Traceback" not in str(self.body(r)), ref="NFR4")
        r = self.upload(st, "cv", "../../etc/passwd.pdf")
        doc = Document.objects.filter(student_id=Student.objects.get(email=email).student_id).order_by("-document_id").first()
        self.expect("Uploaded file names cannot choose the storage path", r.status_code != 201 or (doc and ".." not in doc.file_url and doc.file_url.startswith("student_")), doc and doc.file_url, "NFR4")
        self.expect("Database connection requires SSL", settings.DATABASES["default"]["OPTIONS"].get("sslmode") in ("require", "verify-ca", "verify-full"), settings.DATABASES["default"]["OPTIONS"].get("sslmode"), "NFR2")
        self.warn("Authentication tokens expire", False, "Known limitation: tokens are valid until logout", "NFR3")

    # ---------------------------------------------------------------- 22
    def t_performance(self):
        _, st, _ = self.new_student("perf")
        timings = {}
        for name, path in [("Eligible view", "/api/opportunities/?view=eligible"), ("All view", "/api/opportunities/?view=all"),
                           ("Dashboard", "/api/applications/mine/"), ("Notifications", "/api/notifications/")]:
            best = None
            for _ in range(3):
                t = time.perf_counter()
                st.get(path)
                d = time.perf_counter() - t
                best = d if best is None else min(best, d)
            timings[name] = best
            self.warn(f"{name} responds in under 2 seconds ({best * 1000:.0f} ms)", best < 2, f"{best * 1000:.0f} ms", "NFR9")
        ad = self.admin_client()
        t = time.perf_counter()
        ad.get("/api/providers-admin/activity/")
        d = time.perf_counter() - t
        self.warn(f"Admin activity responds in under 2 seconds ({d * 1000:.0f} ms)", d < 2, f"{d * 1000:.0f} ms", "NFR9")
        self.warn("500 concurrent users", False, "Not measured: needs a load-testing tool against the deployed site", "NFR9")

    # ---------------------------------------------------------------- 23
    def t_deployment(self):
        req = BASE_DIR / "requirements.txt"
        raw = req.read_bytes()
        self.expect("requirements.txt is plain UTF-8 (hosts can read it)", not raw.startswith((b"\xff\xfe", b"\xfe\xff")) and b"\x00" not in raw, raw[:4])
        text = raw.decode("utf-8", errors="ignore").lower()
        for pkg in ("django", "djangorestframework", "psycopg2-binary", "django-cors-headers", "python-dotenv", "requests", "reportlab", "gunicorn"):
            self.expect(f"requirements.txt includes {pkg}", re.search(rf"^{re.escape(pkg)}\b", text, re.M) is not None)
        example = (BASE_DIR / ".env.example").read_text(encoding="utf-8")
        for key in ("DJANGO_SECRET_KEY", "DB_HOST", "SUPABASE_URL", "SUPABASE_SERVICE_KEY", "EMAIL_HOST_PASSWORD", "FRONTEND_URL"):
            self.expect(f".env.example lists {key}", key in example)
        self.expect("SUPABASE_URL has no /rest/v1 suffix", "/rest/v1" not in settings.SUPABASE_URL, settings.SUPABASE_URL)
        self.expect("Behind a hosting proxy, HTTPS is detected (no redirect loop)", getattr(settings, "SECURE_PROXY_SSL_HEADER", None) == ("HTTP_X_FORWARDED_PROTO", "https"), ref="NFR2")
        self.expect("CSRF trusted origins follow the frontend/backend URLs", hasattr(settings, "CSRF_TRUSTED_ORIGINS"), ref="NFR2")
        api_js = (BASE_DIR.parent / "frontend" / "src" / "lib" / "api.js").read_text(encoding="utf-8")
        fe_env = BASE_DIR.parent / "frontend" / ".env.example"
        env_names = set(re.findall(r"^(VITE_\w+)=", fe_env.read_text(encoding="utf-8"), re.M)) if fe_env.exists() else set()
        used = set(re.findall(r"import\.meta\.env\.(VITE_\w+)", api_js))
        self.expect("Frontend reads the API address variable its .env sets", bool(env_names & used), f"env sets {sorted(env_names)}, api.js reads {sorted(used)}")
        self.warn("DEBUG is off", not settings.DEBUG, "DEBUG is on in this .env; set DEBUG=False on the server", "NFR2")
        self.warn("Real SMTP email backend configured", "smtp" in self.real_email_backend.lower(), self.real_email_backend, "NFR7")

    # ---------------------------------------------------------------- frontend
    def frontend_build(self):
        fe = BASE_DIR.parent / "frontend"
        try:
            proc = subprocess.run("npm run build", cwd=fe, shell=True, capture_output=True, text=True, timeout=300)
            self.expect("Frontend production build succeeds", proc.returncode == 0, (proc.stdout + proc.stderr)[-300:])
        except Exception as exc:
            self.expect("Frontend production build succeeds", False, exc)

    # ---------------------------------------------------------------- report
    def write_report(self, path, passed, warned, failed, elapsed):
        now = timezone.localtime()
        lines = [
            "# Scout System Test Report",
            "",
            f"Run on {now:%d %B %Y at %H:%M} (SAST) with `python manage.py system_test`. "
            f"{len(self.results)} checks: **{passed} passed, {warned} warnings, {len(failed)} failed** in {elapsed:.0f} seconds.",
            "",
            "Every check runs through the real API against the Supabase database inside one transaction that is "
            "rolled back afterwards. Email is captured in memory, and test files uploaded to storage are deleted. "
            "WARN marks a known limitation or a target that could not be measured locally, not a defect.",
            "",
        ]
        area = None
        for r in self.results:
            if r["area"] != area:
                area = r["area"]
                lines += ["", f"## {area}", "", "| ID | Check | Requirement | Result |", "| --- | --- | --- | --- |"]
            result = r["result"] if r["result"] == "PASS" else f"**{r['result']}**: {r['detail']}".replace("|", "/")
            lines.append(f"| {r['id']} | {r['check'].replace('|', '/')} | {r['ref']} | {result} |")
        Path(path).write_text("\n".join(lines) + "\n", encoding="utf-8")


class BrokenEmailBackend:
    """Email backend that always fails, to test NFR7 (mail outages)."""

    def __init__(self, *args, **kwargs):
        pass

    def send_messages(self, messages):
        raise ConnectionError("simulated SMTP outage")
