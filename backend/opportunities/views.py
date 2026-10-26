from core.auth_utils import get_student_profile
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Opportunity
from .serializers import OpportunityBrowseSerializer
from .opportunity_eligibility import is_eligible


class OpportunityBrowseView(APIView):
    """
    GET /api/opportunities/?view=eligible   (default)
    GET /api/opportunities/?view=all

    An opportunity only reaches this endpoint once it is both is_active
    and is_verified, and its closing_date hasn't passed. Until the admin
    verification flow exists, you'll need to flip both flags to True by
    hand (or via the seed script) on any row you want to show up here.

    Every listing that clears those gates is returned either way. The
    only difference between the two "view" modes is filtering:
    "eligible" drops listings the student does not qualify for, "all"
    keeps them so the student can see what is out there. Either way,
    is_eligible is computed and attached to every item, because the card
    needs to show the badge even in "all" mode.
    """

    def get(self, request):
        profile = get_student_profile(request.user)
        view_mode = request.query_params.get("view", "eligible")

        opportunities = Opportunity.objects.filter(
            is_active=True,
            is_verified=True,
            closing_date__gte=timezone.now(),
        ).order_by("closing_date")

        results = []
        for opportunity in opportunities:
            opportunity.is_eligible = is_eligible(profile, opportunity)
            if view_mode == "eligible" and not opportunity.is_eligible:
                continue
            results.append(opportunity)

        return Response(OpportunityBrowseSerializer(results, many=True).data)