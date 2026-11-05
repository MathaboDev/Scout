"""
Admin endpoints for FR9: verifying listings before students see them.

A pending listing is one that a provider has posted (is_active=True) but
no admin has reviewed yet (is_verified=False). Verifying a listing stamps
the reviewing admin's admin_id onto the row, so opportunity.adminid is a
real audit trail and not a placeholder.
"""

from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from core.permissions import IsAdmin

from opportunities.models import Opportunity

from .serializers import AdminListingSerializer


@api_view(["GET"])
@permission_classes([IsAdmin])
def pending_listings(request):
    """
    GET /api/providers-admin/listings/pending/

    Returns every listing waiting for admin verification, oldest first so
    the queue drains in the order providers submitted them.
    """
    pending = Opportunity.objects.filter(is_active=True, is_verified=False).order_by("posted_at")
    return Response({"results": AdminListingSerializer(pending, many=True).data})


@api_view(["POST"])
@permission_classes([IsAdmin])
def verify_listing(request, opportunity_id):
    """
    POST /api/providers-admin/listings/<id>/verify/

    Marks a pending listing as verified under the calling admin's admin_id,
    so students will see it from the next eligibility query onwards.
    """
    opportunity = Opportunity.objects.filter(opportunity_id=opportunity_id).first()
    if opportunity is None:
        return Response({"error": "Listing not found."}, status=status.HTTP_404_NOT_FOUND)

    if opportunity.is_verified:
        return Response({"error": "This listing has already been verified."}, status=status.HTTP_400_BAD_REQUEST)

    opportunity.is_verified = True
    opportunity.admin_id = request.admin.admin_id
    opportunity.save(update_fields=["is_verified", "admin_id"])

    return Response(
        {
            "message": "Listing verified.",
            "opportunity_id": opportunity.opportunity_id,
            "verified_at": timezone.now(),
        }
    )
