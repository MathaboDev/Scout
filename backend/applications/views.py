import logging
import uuid

from django.db import IntegrityError, transaction
from django.utils import timezone
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from accounts.models import Profile, Student
from core.choices import (
    APPLICATION_STATUSES,
    OUTCOME_RESULTS,
    REQUIRED_DOCUMENTS,
    STATUS_OUTCOME_RECEIVED,
    STATUS_SUBMITTED,
    STATUS_UNDER_REVIEW,
)
from core.permissions import IsProvider, IsStudent
from documents.models import Document
from notifications import utils as notifications
from opportunities import matching
from opportunities.models import Opportunity

from . import queries
from .report_pdf import build_summary_pdf
from .models import Application, Bookmark

audit = logging.getLogger("scout.audit")


# ==================================================================
# Helpers
# ==================================================================

def _active_documents(student_id):
    docs = Document.objects.filter(student_id=student_id, is_active=True)
    return [
        {
            "document_id": d.document_id,
            "document_type": d.document_type,
            "file_name": d.file_name,
        }
        for d in docs
    ]


def _missing_documents(documents):
    have = {d["document_type"] for d in documents}
    return [
        {"document_type": key, "label": label}
        for key, label in REQUIRED_DOCUMENTS
        if key not in have
    ]


def _applicant_payload(student, profile):
    return {
        "first_name": student.first_name,
        "last_name": student.last_name,
        "email": student.email,
        "student_type": profile.student_type,
        "institution": profile.institution,
        "field_of_study": profile.field_of_study,
        "year_level": profile.year_level,
        "graduate_type": profile.graduate_type,
        "qualification": profile.qualification,
        "academic_average": profile.academic_average,
        "opportunity_preference": profile.opportunity_preference,
        "province": profile.province,
    }


def _receipt(row):
    """FR5 receipt: student name, opportunity + provider, date, reference."""
    return {
        "application_id": row["application_id"],
        "reference_number": row["reference_number"],
        "student_name": f"{row['first_name']} {row['last_name']}",
        "email": row["email"],
        "opportunity_id": row["opportunity_id"],
        "opportunity_title": row["opportunity_title"],
        "company_name": row["company_name"],
        "submitted_at": row["submitted_at"],
        "status": row["status"],
        "outcome_result": row["outcome_result"],
    }


def _load_for_apply(request, opportunity_id):
    """
    Shared checks for review + confirm. Returns (context, error_response).
    """
    if not opportunity_id:
        return None, Response({"error": "opportunity_id is required."}, status=400)

    student = request.student
    opp = matching.get_opportunity(student.student_id, opportunity_id)
    if opp is None:
        return None, Response(
            {"error": "This opportunity doesn't exist or isn't live.", "code": "not_found"},
            status=404,
        )
    if opp["is_closed"]:
        return None, Response(
            {"error": "This opportunity has closed and no longer accepts applications.", "code": "closed"},
            status=410,
        )
    if opp["applied"]:
        return None, Response(
            {"error": "You've already applied for this opportunity.", "code": "already_applied"},
            status=409,
        )

    profile = Profile.objects.filter(student=student).first()
    if profile is None:
        return None, Response(
            {"error": "Complete your profile before applying.", "code": "profile_incomplete"},
            status=400,
        )
    if not opp["eligible"]:
        return None, Response(
            {"error": "Your profile doesn't meet this opportunity's requirements.", "code": "not_eligible"},
            status=403,
        )

    documents = _active_documents(student.student_id)
    return {
        "student": student,
        "profile": profile,
        "opportunity": opp,
        "documents": documents,
        "missing": _missing_documents(documents),
    }, None


# ==================================================================
# FR3 / FR4: assisted application
# ==================================================================

@api_view(["POST"])
@permission_classes([IsStudent])
def review_application(request):
    """
    POST /api/applications/review/  {opportunity_id}

    Nothing is submitted here. Returns everything the review screen
    shows, plus which required documents are missing. If any are missing
    the student is notified in-app and by email with a link that
    resumes the apply flow (FR4).
    """
    ctx, error = _load_for_apply(request, request.data.get("opportunity_id"))
    if error:
        return error

    opp, student, missing = ctx["opportunity"], ctx["student"], ctx["missing"]

    if missing:
        labels = ", ".join(m["label"] for m in missing)
        link = notifications.frontend_url(f"/apply/{opp['opportunity_id']}?resume=documents")
        message = f"Your application for {opp['title']} is waiting on: {labels}."
        notifications.notify(
            student,
            notifications.MISSING_DOCUMENT,
            message,
            email_subject=f"Upload missing documents for {opp['title']}",
            email_body=(
                f"Hi {student.first_name},\n\n{message}\n\n"
                f"Upload them here and you'll go straight back to your review screen:\n{link}\n\nScout"
            ),
            once=True,
        )

    return Response(
        {
            "can_submit": not missing,
            "missing_documents": missing,
            "applicant": _applicant_payload(student, ctx["profile"]),
            "opportunity": opp,
            "documents": ctx["documents"],
        }
    )


@api_view(["POST"])
@permission_classes([IsStudent])
def confirm_application(request):
    """
    POST /api/applications/confirm/  {opportunity_id}

    The ONLY endpoint that creates an application, and only after the
    student clicks confirm on the review screen (FR3).
    """
    ctx, error = _load_for_apply(request, request.data.get("opportunity_id"))
    if error:
        return error

    if ctx["missing"]:
        return Response(
            {
                "error": "Upload your required documents before submitting.",
                "code": "missing_documents",
                "missing_documents": ctx["missing"],
            },
            status=400,
        )

    student, opp = ctx["student"], ctx["opportunity"]
    reference_number = f"SCOUT-{uuid.uuid4().hex[:10].upper()}"

    try:
        with transaction.atomic():
            application = Application.objects.create(
                student_id=student.student_id,
                opportunity_id=opp["opportunity_id"],
                reference_number=reference_number,
                status=STATUS_SUBMITTED,
            )
    except IntegrityError:
        # NFR5: the database itself rejected a duplicate.
        return Response(
            {"error": "You've already applied for this opportunity.", "code": "already_applied"},
            status=409,
        )

    receipt = _receipt(queries.student_application(student.student_id, application.application_id))
    submitted = timezone.localtime(receipt["submitted_at"]).strftime("%d %b %Y, %H:%M")

    notifications.notify(
        student,
        notifications.APPLICATION_SUBMITTED,
        f"Application submitted for {opp['title']} at {opp['company_name']}. Reference {reference_number}.",
        application_id=application.application_id,
        email_subject=f"Your Scout receipt: {opp['title']}",
        email_body=(
            f"Hi {student.first_name},\n\n"
            "Your application was submitted.\n\n"
            f"Name:        {receipt['student_name']}\n"
            f"Opportunity: {opp['title']}\n"
            f"Provider:    {opp['company_name']}\n"
            f"Submitted:   {submitted}\n"
            f"Reference:   {reference_number}\n\n"
            f"Track it on your dashboard: {notifications.frontend_url('/watchlist')}\n\nScout"
        ),
    )

    return Response({"application": receipt}, status=status.HTTP_201_CREATED)


# ==================================================================
# FR5 / FR6: student dashboard
# ==================================================================

@api_view(["GET"])
@permission_classes([IsStudent])
def my_applications(request):
    """GET /api/applications/mine/  (polled by the dashboard)"""
    rows = queries.student_applications(request.student.student_id)
    return Response({"results": [_receipt(r) | {"updated_at": r["updated_at"]} for r in rows]})


@api_view(["GET"])
@permission_classes([IsStudent])
def application_receipt(request, application_id):
    """GET /api/applications/mine/<id>/receipt/"""
    row = queries.student_application(request.student.student_id, application_id)
    if row is None:
        return Response({"error": "Application not found."}, status=404)
    return Response(_receipt(row))


@api_view(["GET"])
@permission_classes([IsStudent])
def application_summary(request):
    """GET /api/applications/mine/summary/  -> FR5 downloadable summary data"""
    student = request.student
    counts = queries.student_summary_counts(student.student_id)
    rows = queries.student_applications(student.student_id)
    return Response(
        {
            "student_name": f"{student.first_name} {student.last_name}",
            "generated_at": timezone.now(),
            "totals": counts,
            "applications": [_receipt(r) for r in rows],
        }
    )


@api_view(["GET"])
@permission_classes([IsStudent])
def application_summary_pdf(request):
    """GET /api/applications/mine/summary/pdf/  -> FR5 summary as a PDF download"""
    student = request.student
    now = timezone.now()
    pdf = build_summary_pdf(
        student_id=student.student_id,
        student_name=f"{student.first_name} {student.last_name}",
        email=student.email,
        generated_at=now,
        totals=queries.student_summary_counts(student.student_id),
        applications=[_receipt(r) for r in queries.student_applications(student.student_id)],
    )
    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="scout-applications-{now:%Y-%m-%d}.pdf"'
    return response


# ==================================================================
# FR7: bookmarks
# ==================================================================

@api_view(["GET", "POST"])
@permission_classes([IsStudent])
def bookmarks(request):
    """
    GET  /api/applications/bookmarks/                    -> list with closing dates
    POST /api/applications/bookmarks/  {opportunity_id}  -> save
    """
    student = request.student

    if request.method == "GET":
        return Response({"results": queries.student_bookmarks(student.student_id)})

    opportunity_id = request.data.get("opportunity_id")
    exists = Opportunity.objects.filter(
        opportunity_id=opportunity_id, is_active=True, is_verified=True
    ).exists()
    if not exists:
        return Response({"error": "This opportunity doesn't exist or isn't live."}, status=404)

    try:
        with transaction.atomic():
            Bookmark.objects.create(student_id=student.student_id, opportunity_id=opportunity_id)
    except IntegrityError:
        pass  # already bookmarked: the request is idempotent
    return Response({"bookmarked": True}, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsStudent])
def remove_bookmark(request, opportunity_id):
    """DELETE /api/applications/bookmarks/<opportunity_id>/"""
    Bookmark.objects.filter(
        student_id=request.student.student_id, opportunity_id=opportunity_id
    ).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ==================================================================
# FR10: provider applicant list + status updates
# ==================================================================

def _provider_documents(student_id):
    # Provider sees which required documents are attached, by type and
    # file name only. No file URLs leave the backend here.
    docs = _active_documents(student_id)
    return docs, _missing_documents(docs)


@api_view(["GET"])
@permission_classes([IsProvider])
def listing_applicants(request, opportunity_id):
    """GET /api/applications/provider/listings/<opportunity_id>/applicants/"""
    provider = request.provider
    listing = Opportunity.objects.filter(
        opportunity_id=opportunity_id, provider_id=provider.provider_id
    ).first()
    if listing is None:
        return Response({"error": "Listing not found."}, status=404)

    return Response(
        {
            "listing": {
                "opportunity_id": listing.opportunity_id,
                "title": listing.title,
                "company_name": provider.company_name,
                "closing_date": listing.closing_date,
            },
            "results": queries.provider_applicants(provider.provider_id, opportunity_id),
        }
    )


@api_view(["GET", "PATCH"])
@permission_classes([IsProvider])
def applicant_detail(request, application_id):
    """
    GET   /api/applications/provider/applicants/<id>/
    PATCH /api/applications/provider/applicants/<id>/  {status, outcome_result?}

    The status written here is the same column the student's dashboard
    polls, so the student sees it within one poll interval (NFR2/NFR5).
    """
    provider = request.provider
    row = queries.provider_applicant(provider.provider_id, application_id)
    if row is None:
        return Response({"error": "Applicant not found."}, status=404)

    if request.method == "GET":
        documents, missing = _provider_documents(row["student_id"])
        row = {k: v for k, v in row.items() if k != "student_id"}
        return Response({"applicant": row, "documents": documents, "missing_documents": missing})

    new_status = request.data.get("status")
    outcome = request.data.get("outcome_result") or None

    if new_status not in APPLICATION_STATUSES:
        return Response(
            {"error": f"Status must be one of: {', '.join(APPLICATION_STATUSES)}."}, status=400
        )
    if new_status == STATUS_OUTCOME_RECEIVED and outcome not in OUTCOME_RESULTS:
        return Response(
            {"error": "Choose Successful or Unsuccessful when recording an outcome."}, status=400
        )
    if new_status != STATUS_OUTCOME_RECEIVED:
        outcome = None

    current = row["status"]
    if APPLICATION_STATUSES.index(new_status) < APPLICATION_STATUSES.index(current):
        return Response(
            {"error": f"An application can't move back from {current} to {new_status}."}, status=400
        )
    if current == STATUS_OUTCOME_RECEIVED:
        return Response({"error": "An outcome has already been recorded."}, status=400)
    if new_status == current:
        return Response({"error": f"This application is already {current}."}, status=400)

    now = timezone.now()
    application = Application.objects.get(application_id=application_id)
    application.status = new_status
    update_fields = ["status", "updated_at"]
    if application.reviewed_at is None:
        application.reviewed_at = now
        update_fields.append("reviewed_at")
    if new_status == STATUS_OUTCOME_RECEIVED:
        application.outcome_result = outcome
        application.outcome_received_at = now
        update_fields += ["outcome_result", "outcome_received_at"]
    application.save(update_fields=update_fields)

    # NFR5: who changed what, when. (A DB audit table is the proper home;
    # see HANDOVER.md. This log line is the interim record.)
    audit.info(
        "status_change application=%s provider=%s from=%s to=%s outcome=%s at=%s",
        application_id, provider.provider_id, current, new_status, outcome, now.isoformat(),
    )

    student = Student.objects.get(student_id=row["student_id"])
    title = row["opportunity_title"]
    if new_status == STATUS_OUTCOME_RECEIVED:
        message = f"An outcome is in for {title} at {provider.company_name}: {outcome}."
        ntype = notifications.OUTCOME_RECEIVED
    else:
        message = f"Your application for {title} at {provider.company_name} is now {new_status}."
        ntype = notifications.STATUS_CHANGED

    notifications.notify(
        student,
        ntype,
        message,
        application_id=application.application_id,
        email_subject=f"Update on your application: {title}",
        email_body=(
            f"Hi {student.first_name},\n\n{message}\n\n"
            f"See it on your dashboard: {notifications.frontend_url('/watchlist')}\n\nScout"
        ),
    )

    updated = queries.provider_applicant(provider.provider_id, application_id)
    updated.pop("student_id", None)
    return Response({"applicant": updated})

