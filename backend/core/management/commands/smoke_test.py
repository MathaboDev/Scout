"""
End-to-end check of the whole Scout backend, through the real API.

    python manage.py smoke_test

Walks the full journey a student and a provider take (register, log in,
profile, matching, bookmarks, documents, apply, provider review, status
updates, notifications, PDF report, permissions, management commands)
and prints PASS / FAIL for every step.

Leaves NOTHING behind:
  - every database change happens inside one transaction that is rolled
    back at the end, even if a step fails;
  - files uploaded to Supabase storage during the test are deleted.

Needs: .env filled in, the database reachable, and seed_demo run once.
Exit code is 1 if anything failed, so it can run in CI.
"""

import io
import traceback
import uuid

from django.conf import settings
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction
from django.test.utils import override_settings
from rest_framework.test import APIClient

from accounts.models import Student
from documents.models import Document
from documents.supabase_storage import delete_document
from opportunities.models import Opportunity

DEMO_PASSWORD = "ScoutDemo-2026"
# a tiny but valid PDF, used for the CV and matric certificate uploads
PDF_BYTES = (
    b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n"
    b"trailer<</Root 1 0 R>>\n%%EOF\n"
)


class _Rollback(Exception):
    """Raised on purpose at the end to undo every database change."""


class Command(BaseCommand):
    help = "Run an end-to-end API check of every Scout feature, then undo all changes."

    def handle(self, *args, **options):
        self.passed = 0
        self.failed = []
        self.uploaded_paths = []
        self.student_id = None

        try:
            # locmem email: reminders/notifications are captured, not sent
            with override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"):
                with transaction.atomic():
                    try:
                        self.run_all()
                    except Exception as exc:  # report as a failure, keep going to cleanup
                        self.expect(f"Unexpected error: {exc.__class__.__name__}", False, traceback.format_exc())
                    finally:
                        # note every file the test student uploaded BEFORE the rollback erases the rows
                        if self.student_id:
                            self.uploaded_paths = list(
                                Document.objects.filter(student_id=self.student_id).values_list("file_url", flat=True)
                            )
                    raise _Rollback()
        except _Rollback:
            pass
        finally:
            self.cleanup_storage()

        total = self.passed + len(self.failed)
        self.stdout.write("")
        if self.failed:
            self.stdout.write(self.style.ERROR(f"{len(self.failed)} of {total} checks FAILED:"))
            for name in self.failed:
                self.stdout.write(self.style.ERROR(f"  - {name}"))
            self.stdout.write("All database changes were rolled back.")
            raise CommandError("smoke test failed")
        self.stdout.write(self.style.SUCCESS(f"All {total} checks passed. All database changes were rolled back."))

    # ------------------------------------------------------------------ helpers

    def section(self, title):
        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING(title))

    def expect(self, name, ok, detail=""):
        if ok:
            self.passed += 1
            self.stdout.write(f"  {self.style.SUCCESS('PASS')}  {name}")
        else:
            self.failed.append(name)
            self.stdout.write(f"  {self.style.ERROR('FAIL')}  {name}  {detail}")
        return ok

    def client(self, token=None):
        c = APIClient(SERVER_NAME="localhost")
        if token:
            c.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        return c

    def login(self, email, password=DEMO_PASSWORD):
        r = self.client().post("/api/accounts/login/", {"email": email, "password": password}, format="json")
        return r, (r.json().get("token") if r.status_code == 200 else None)

    @staticmethod
    def body(r):
        try:
            return r.json()
        except Exception:
            return {}

    def cleanup_storage(self):
        for path in self.uploaded_paths:
            try:
                delete_document(path)
                self.stdout.write(f"  cleaned up storage file {path}")
            except Exception as exc:  # report, never hide
                self.stdout.write(self.style.WARNING(f"  could not delete storage file {path}: {exc}"))

    # ------------------------------------------------------------------ the test

    def run_all(self):
        # ---------------- 1. setup ----------------
        self.section("1. Setup")
        try:
            call_command("check", stdout=io.StringIO())
            self.expect("Django system check", True)
        except Exception as exc:
            self.expect("Django system check", False, str(exc))
        with connection.cursor() as cur:
            cur.execute("SELECT 1")
            self.expect("Database reachable", cur.fetchone() == (1,))
            cur.execute(
                "SELECT table_name FROM information_schema.tables WHERE table_schema='public' "
                "AND table_name IN ('student','profile','provider','opportunity','application',"
                "'bookmark','notification','document','admin')"
            )
            tables = {row[0] for row in cur.fetchall()}
        self.expect("All 9 core tables exist", len(tables) == 9, f"found {sorted(tables)}")
        self.expect(
            "Demo data present (run seed_demo if this fails)",
            Opportunity.objects.filter(title="Software developer intern").exists(),
        )
        self.expect(
            "CORS allows FRONTEND_URL",
            settings.FRONTEND_URL in settings.CORS_ALLOWED_ORIGINS,
            str(settings.CORS_ALLOWED_ORIGINS),
        )

        # ---------------- 2. accounts ----------------
        self.section("2. Sign up, log in, log out (FR1)")
        anon = self.client()
        email = f"smoke-{uuid.uuid4().hex[:8]}@scout.test"
        password = "SmokeTest-2026!"
        r = anon.post(
            "/api/accounts/register/",
            {"full_name": "Smoke Tester", "email": email, "password": password, "confirm_password": password},
            format="json",
        )
        self.expect("Register new student -> 201", r.status_code == 201, f"{r.status_code} {self.body(r)}")
        r = anon.post(
            "/api/accounts/register/",
            {"full_name": "Smoke Tester", "email": email, "password": password, "confirm_password": password},
            format="json",
        )
        self.expect("Register same email again is refused", r.status_code == 400, str(r.status_code))
        r = anon.post(
            "/api/accounts/register/",
            {"full_name": "X", "email": "other-" + email, "password": password, "confirm_password": "nope"},
            format="json",
        )
        self.expect("Mismatched passwords are refused", r.status_code == 400, str(r.status_code))
        r, _ = self.login(email, "wrong-password")
        self.expect("Wrong password is refused", r.status_code in (400, 401), str(r.status_code))
        r, token = self.login(email, password)
        self.expect(
            "Log in -> token, role student",
            token is not None and self.body(r).get("user", {}).get("role") == "student",
            f"{r.status_code} {self.body(r)}",
        )
        if not token:
            return  # nothing else can run without a login
        st = self.client(token)
        r = st.get("/api/accounts/me/")
        self.expect("GET /me returns this student", r.status_code == 200 and self.body(r).get("user", {}).get("email") == email, str(self.body(r)))
        self.student_id = Student.objects.get(email=email).student_id
        r = anon.get("/api/accounts/me/")
        self.expect("GET /me without token is refused", r.status_code in (401, 403), str(r.status_code))

        # ---------------- 3. profile ----------------
        self.section("3. Profile (FR1)")
        r = st.get("/api/accounts/profile/")
        self.expect("GET empty profile", r.status_code == 200, str(r.status_code))
        r = st.patch(
            "/api/accounts/profile/",
            {"student_type": "Tertiary Student", "qualification": "Bachelor Degree"},
            format="json",
        )
        self.expect("Invalid profile values are refused", r.status_code == 400, f"{r.status_code} {self.body(r)}")
        profile = {
            "student_type": "Tertiary Student",
            "institution": "Smoke Test University",
            "field_of_study": "Information Technology",
            "academic_average": 72,
            "opportunity_preference": "Internship",
            "province": "Western Cape",
            "year_level": 2,
            "graduate_type": None,
            "qualification": None,
        }
        r = st.patch("/api/accounts/profile/", profile, format="json")
        self.expect("Save complete profile", r.status_code == 200, f"{r.status_code} {self.body(r)}")
        r = st.get("/api/accounts/profile/")
        self.expect("Profile saved values read back", self.body(r).get("field_of_study") == "Information Technology", str(self.body(r)))

        # ---------------- 4. matching ----------------
        self.section("4. Opportunities + eligibility matching (FR2)")
        r = st.get("/api/opportunities/?view=eligible")
        eligible = self.body(r).get("results", [])
        titles = {o["title"] for o in eligible}
        self.expect("Eligible view loads", r.status_code == 200, str(r.status_code))
        self.expect("Eligible view has the matching IT internship", "Software developer intern" in titles, str(sorted(titles)))
        self.expect("Every row in eligible view is flagged eligible", all(o["eligible"] for o in eligible))
        self.expect("Average-too-low listing is excluded", "Cloud engineering intern" not in titles)
        self.expect("Other-field listing is excluded", "Data analyst intern" not in titles)
        r = st.get("/api/opportunities/?view=all")
        all_rows = self.body(r).get("results", [])
        all_titles = {o["title"] for o in all_rows}
        self.expect("All view shows more than eligible view", len(all_rows) > len(eligible), f"{len(all_rows)} vs {len(eligible)}")
        self.expect("Unverified listing is hidden from students (FR9)", "UX design intern" not in all_titles)
        self.expect("Invalid view parameter is refused", st.get("/api/opportunities/?view=bogus").status_code == 400)

        target = next((o for o in eligible if o["title"] == "Software developer intern"), None)
        too_hard = next((o for o in all_rows if o["title"] == "Cloud engineering intern"), None)
        if not target:
            return
        oid = target["opportunity_id"]
        r = st.get(f"/api/opportunities/{oid}/")
        self.expect("Opportunity detail loads", r.status_code == 200 and self.body(r).get("eligible") is True, str(self.body(r))[:200])
        self.expect("Unknown opportunity -> 404", st.get("/api/opportunities/999999999/").status_code == 404)

        # qualification ranking (Masters graduate qualifies for a Bachelor listing)
        grad = {**profile, "student_type": "Graduate", "graduate_type": "Postgraduate", "qualification": "Masters",
                "year_level": None, "field_of_study": "Engineering", "opportunity_preference": "Graduate programme",
                "academic_average": 70}
        st.patch("/api/accounts/profile/", grad, format="json")
        r = st.get("/api/opportunities/?view=eligible")
        self.expect(
            "Masters graduate qualifies for a Bachelor-level listing",
            "Engineer-in-training graduate programme" in {o["title"] for o in self.body(r).get("results", [])},
        )
        st.patch("/api/accounts/profile/", profile, format="json")  # back to the IT student

        # ---------------- 5. bookmarks ----------------
        self.section("5. Bookmarks (FR7)")
        r = st.post("/api/applications/bookmarks/", {"opportunity_id": oid}, format="json")
        self.expect("Bookmark an opportunity", r.status_code in (200, 201), f"{r.status_code} {self.body(r)}")
        r = st.get("/api/applications/bookmarks/")
        self.expect("Bookmark appears in the list", any(b["opportunity_id"] == oid for b in self.body(r).get("results", [])))
        r = st.get(f"/api/opportunities/{oid}/")
        self.expect("Opportunity shows as bookmarked", self.body(r).get("bookmarked") is True)
        r = st.delete(f"/api/applications/bookmarks/{oid}/")
        self.expect("Remove bookmark", r.status_code in (200, 204), str(r.status_code))
        st.post("/api/applications/bookmarks/", {"opportunity_id": oid}, format="json")  # keep one for the reminder test

        # ---------------- 6. documents ----------------
        self.section("6. Documents + Supabase storage (FR1 / FR4)")
        r = st.post("/api/applications/review/", {"opportunity_id": oid}, format="json")
        body = self.body(r)
        self.expect(
            "Review before documents: blocked, lists CV + matric",
            r.status_code == 200 and body.get("can_submit") is False and len(body.get("missing_documents", [])) == 2,
            f"{r.status_code} {body}",
        )
        r = st.post("/api/applications/confirm/", {"opportunity_id": oid}, format="json")
        self.expect("Submit without documents is refused", r.status_code == 400, str(r.status_code))

        r = st.post(
            "/api/documents/upload/",
            {"document_type": "cv", "file": SimpleUploadedFile("cv.exe", b"MZ", content_type="application/octet-stream")},
            format="multipart",
        )
        self.expect("Wrong file type is refused", r.status_code == 400, str(r.status_code))
        for doc_type in ("cv", "matric_certificate"):
            r = st.post(
                "/api/documents/upload/",
                {"document_type": doc_type, "file": SimpleUploadedFile(f"{doc_type}.pdf", PDF_BYTES, content_type="application/pdf")},
                format="multipart",
            )
            self.expect(f"Upload {doc_type} to Supabase storage", r.status_code in (200, 201), f"{r.status_code} {self.body(r)}")
        r = st.get("/api/documents/")
        docs = self.body(r) if isinstance(self.body(r), list) else self.body(r).get("results", [])
        self.expect("Documents list shows both files", r.status_code == 200 and len(docs) >= 2, f"{r.status_code} {docs}")
        if docs:
            r = st.get(f"/api/documents/{docs[0]['document_id']}/url/")
            self.expect("Signed download link is issued", r.status_code == 200 and "http" in str(self.body(r)), f"{r.status_code}")

        # ---------------- 7. apply ----------------
        self.section("7. Assisted apply + receipts (FR3 / FR4 / FR5)")
        r = st.post("/api/applications/review/", {"opportunity_id": oid}, format="json")
        body = self.body(r)
        self.expect(
            "Review is pre-filled from the profile",
            body.get("can_submit") is True and body.get("applicant", {}).get("institution") == "Smoke Test University",
            str(body)[:300],
        )
        if too_hard:
            r = st.post("/api/applications/review/", {"opportunity_id": too_hard["opportunity_id"]}, format="json")
            self.expect("Applying to an ineligible listing is refused", r.status_code == 403, str(r.status_code))
        r = st.post("/api/applications/confirm/", {"opportunity_id": oid}, format="json")
        app = self.body(r).get("application", {})
        self.expect("Submit application -> reference number", r.status_code == 201 and bool(app.get("reference_number")), f"{r.status_code} {self.body(r)}")
        r = st.post("/api/applications/confirm/", {"opportunity_id": oid}, format="json")
        self.expect("Applying twice is refused", r.status_code == 409, str(r.status_code))
        aid = app.get("application_id")
        r = st.get("/api/applications/mine/")
        mine = self.body(r).get("results", [])
        self.expect("Watchlist shows the application as Submitted", any(a["application_id"] == aid and a["status"] == "Submitted" for a in mine))
        r = st.get(f"/api/applications/mine/{aid}/receipt/")
        self.expect("Receipt loads", r.status_code == 200 and self.body(r).get("reference_number") == app.get("reference_number"))
        r = st.get("/api/applications/mine/summary/")
        self.expect("Summary totals count it", self.body(r).get("totals", {}).get("total") == 1, str(self.body(r).get("totals")))
        r = st.get("/api/applications/mine/summary/pdf/")
        self.expect(
            "PDF report downloads",
            r.status_code == 200 and r["Content-Type"] == "application/pdf" and r.content[:4] == b"%PDF",
            str(r.status_code),
        )
        r = st.get("/api/notifications/")
        self.expect("Submission notification created", r.status_code == 200 and len(self.body(r).get("results", [])) >= 1, str(self.body(r))[:200])

        # ---------------- 8. provider ----------------
        self.section("8. Provider dashboard + status updates (FR6 / FR10)")
        r, ptoken = self.login("provider@byteworks.demo")
        self.expect("Provider logs in, role provider", ptoken is not None and self.body(r).get("user", {}).get("role") == "provider", str(r.status_code))
        if not ptoken:
            return
        pv = self.client(ptoken)
        self.expect("Student cannot use provider endpoints", st.get("/api/opportunities/provider/listings/").status_code == 403)
        self.expect("Provider cannot use student endpoints", pv.get("/api/applications/mine/").status_code == 403)
        r = pv.get("/api/opportunities/provider/listings/")
        listing = next((l for l in self.body(r).get("results", []) if l["opportunity_id"] == oid), None)
        self.expect("Provider dashboard counts the new applicant", listing is not None and listing["applicant_count"] >= 1, str(listing))

        new_listing = {
            "title": "Smoke test listing", "opportunity_type": "Internship", "field_of_study": "Information Technology",
            "eligibility_type": "Any", "description": "Created by smoke_test.",
            "closing_date": "2030-01-01T12:00:00Z",
        }
        r = pv.post("/api/opportunities/provider/listings/", {**new_listing, "field_of_study": "Basket weaving"}, format="json")
        self.expect("Invalid listing is refused", r.status_code == 400, str(r.status_code))
        r = pv.post("/api/opportunities/provider/listings/", new_listing, format="json")
        created = self.body(r)
        nid = created.get("opportunity_id")
        self.expect("Post a listing -> pending verification", r.status_code == 201 and created.get("state") == "Pending verification", f"{r.status_code} {created}")
        r = pv.patch(f"/api/opportunities/provider/listings/{nid}/", {"description": "Edited by smoke_test."}, format="json")
        self.expect("Edit listing", r.status_code == 200, f"{r.status_code} {self.body(r)}")
        titles_now = {o["title"] for o in self.body(st.get("/api/opportunities/?view=all")).get("results", [])}
        self.expect("Unverified new listing hidden from students", "Smoke test listing" not in titles_now)
        call_command("verify_listings", str(nid), stdout=io.StringIO())
        titles_now = {o["title"] for o in self.body(st.get("/api/opportunities/?view=all")).get("results", [])}
        self.expect("verify_listings makes it visible (FR9)", "Smoke test listing" in titles_now)
        r = pv.delete(f"/api/opportunities/provider/listings/{nid}/")
        self.expect("Remove listing", r.status_code == 204, str(r.status_code))

        r = pv.get(f"/api/applications/provider/listings/{oid}/applicants/")
        applicants = self.body(r).get("results", []) if isinstance(self.body(r), dict) else self.body(r)
        self.expect("Applicant list includes the test student", any(a.get("application_id") == aid for a in applicants), str(applicants)[:300])
        r = pv.get(f"/api/applications/provider/applicants/{aid}/")
        self.expect("Applicant detail loads", r.status_code == 200, str(r.status_code))
        url = f"/api/applications/provider/applicants/{aid}/"
        r = pv.patch(url, {"status": "Under Review"}, format="json")
        self.expect("Move to Under Review", r.status_code == 200, f"{r.status_code} {self.body(r)}")
        r = pv.patch(url, {"status": "Submitted"}, format="json")
        self.expect("Moving backwards is refused", r.status_code == 400, str(r.status_code))
        r = pv.patch(url, {"status": "Outcome Received"}, format="json")
        self.expect("Outcome without a result is refused", r.status_code == 400, str(r.status_code))
        r = pv.patch(url, {"status": "Outcome Received", "outcome_result": "Successful"}, format="json")
        self.expect("Record outcome: Successful", r.status_code == 200, f"{r.status_code} {self.body(r)}")
        mine = self.body(st.get("/api/applications/mine/")).get("results", [])
        self.expect(
            "Student sees the new status (FR6)",
            any(a["application_id"] == aid and a["status"] == "Outcome Received" and a["outcome_result"] == "Successful" for a in mine),
        )
        notes = self.body(st.get("/api/notifications/"))
        self.expect("Student got status notifications", notes.get("unread_count", 0) >= 2, str(notes)[:200])
        r = st.post("/api/notifications/read-all/")
        self.expect("Mark all notifications read", r.status_code in (200, 204) and self.body(st.get("/api/notifications/")).get("unread_count") == 0)

        _, otoken = self.login("provider@kopano.demo")
        if otoken:
            r = self.client(otoken).get(url)
            self.expect("Another provider cannot see this applicant", r.status_code == 404, str(r.status_code))

        # ---------------- 9. commands ----------------
        self.section("9. Management commands")
        Opportunity.objects.filter(opportunity_id=oid).update(
            closing_date=Opportunity.objects.get(opportunity_id=oid).closing_date.__class__.now(
                Opportunity.objects.get(opportunity_id=oid).closing_date.tzinfo
            ) + __import__("datetime").timedelta(days=2)
        )
        mail.outbox = []
        out = io.StringIO()
        try:
            call_command("send_bookmark_reminders", stdout=out)
            self.expect("send_bookmark_reminders runs", True)
        except Exception as exc:
            self.expect("send_bookmark_reminders runs", False, str(exc))
        self.expect("Reminder created for the bookmark closing in 2 days", "Reminder" in str(self.body(st.get("/api/notifications/"))) or len(mail.outbox) >= 1, out.getvalue()[:200])
        out = io.StringIO()
        call_command("seed_demo", stdout=out)
        self.expect("seed_demo is safe to re-run", "0 new listing" in out.getvalue(), out.getvalue()[:120])

        # ---------------- 10. logout ----------------
        self.section("10. Log out")
        r = st.post("/api/accounts/logout/")
        self.expect("Log out", r.status_code == 200, str(r.status_code))
        self.expect("Old token no longer works", st.get("/api/accounts/me/").status_code in (401, 403))
