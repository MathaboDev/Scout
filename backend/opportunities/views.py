from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from accounts.models import Profile
from applications.models import Application
from core.choices import STATUS_SUBMITTED
from core.permissions import IsProvider, IsStudent
from providers_admin.models import PlatformAdmin

from . import matching
from .models import Opportunity
from .serializers import ListingTemplateSerializer


# ------------------------------------------------------------------
# Student side (FR2)
# ------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsStudent])
def student_opportunities(request):
    """GET /api/opportunities/?view=eligible|all"""
    view = request.query_params.get("view", "eligible")
    if view not in ("eligible", "all"):
        return Response(
            {"error": "view must be 'eligible' or 'all'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    student = request.student
    results = matching.list_opportunities(student.student_id, eligible_only=(view == "eligible"))
    return Response(
        {
            "view": view,
            "profile_complete": Profile.objects.filter(student=student).exists(),
            "results": results,
        }
    )


@api_view(["GET"])
@permission_classes([IsStudent])
def student_opportunity_detail(request, opportunity_id):
    """GET /api/opportunities/<id>/"""
    row = matching.get_opportunity(request.student.student_id, opportunity_id)
    if row is None:
        return Response({"error": "This opportunity doesn't exist or isn't live."}, status=404)
    return Response(row)


# ------------------------------------------------------------------
# Provider side (FR10): every query is scoped to request.provider
# ------------------------------------------------------------------

def _listing_state(opp):
    if not opp.is_verified:
        return "Pending verification"
    if opp.closing_date < timezone.now():
        return "Closed"
    return "Live"


def _listing_payload(opp, counts=None):
    data = ListingTemplateSerializer(opp).data
    data["state"] = _listing_state(opp)
    counts = counts or {}
    data["applicant_count"] = counts.get("total", 0)
    data["awaiting_review"] = counts.get("submitted", 0)
    return data


@api_view(["GET", "POST"])
@permission_classes([IsProvider])
def provider_listings(request):
    """
    GET  /api/opportunities/provider/listings/  -> this provider's listings + counts
    POST /api/opportunities/provider/listings/  -> create from the template
    """
    provider = request.provider

    if request.method == "POST":
        serializer = ListingTemplateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        admin = PlatformAdmin.objects.filter(is_active=True).order_by("admin_id").first()
        if admin is None:
            return Response(
                {"error": "No platform administrator exists yet to verify listings. Run `manage.py seed_demo`."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # FR9: a new listing is active but NOT live until an admin verifies it.
        opp = serializer.save(
            provider_id=provider.provider_id,
            admin_id=admin.admin_id,
            is_active=True,
            is_verified=False,
        )
        return Response(_listing_payload(opp), status=status.HTTP_201_CREATED)

    listings = list(
        Opportunity.objects.filter(provider_id=provider.provider_id, is_active=True).order_by("-posted_at")
    )
    counts = {
        row["opportunity_id"]: row
        for row in Application.objects.filter(
            opportunity_id__in=[o.opportunity_id for o in listings]
        )
        .values("opportunity_id")
        .annotate(
            total=Count("application_id"),
            submitted=Count("application_id", filter=Q(status=STATUS_SUBMITTED)),
        )
    }
    return Response(
        {
            "company_name": provider.company_name,
            "results": [_listing_payload(o, counts.get(o.opportunity_id)) for o in listings],
        }
    )


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsProvider])
def provider_listing_detail(request, opportunity_id):
    """
    GET    -> one listing (for the edit form)
    PATCH  -> edit; goes back to "Pending verification" (FR9)
    DELETE -> remove (soft: isactive = FALSE, so applications keep their history)
    """
    opp = Opportunity.objects.filter(
        opportunity_id=opportunity_id,
        provider_id=request.provider.provider_id,  # can never touch another provider's row
        is_active=True,
    ).first()
    if opp is None:
        return Response({"error": "Listing not found."}, status=404)

    if request.method == "GET":
        return Response(_listing_payload(opp))

    if request.method == "DELETE":
        opp.is_active = False
        opp.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = ListingTemplateSerializer(opp, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    opp = serializer.save(is_verified=False)
    return Response(_listing_payload(opp))

