from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from core.auth_utils_additions import get_provider_id  # move into auth_utils.py once merged
from opportunities.models import Opportunity
from applications.models import Application

from .serializers import OpportunityWriteSerializer, ProviderOpportunitySerializer


# ---------------------------------------------------------------------------
# Provider dashboard: list own listings, create, edit, remove
# ---------------------------------------------------------------------------

class ProviderOpportunityListView(APIView):
    """
    GET  /api/providers/opportunities/   list only this provider's own listings
    POST /api/providers/opportunities/   create a new listing

    provider_id always comes from get_provider_id(request.user), never
    from request.data, so a provider cannot post a listing under another
    company's name just by changing a field in the request body.

    A newly created listing is_verified = False (the model default) until
    an admin verifies it -- it will not appear on the student Browse
    screen until that happens, even once is_active is set.
    """

    def get(self, request):
        provider_id = get_provider_id(request.user)

        listings = Opportunity.objects.filter(provider_id=provider_id).order_by("-posted_at")

        # applicant_count isn't a real column, attached the same way
        # is_eligible is attached on the student Browse view.
        for listing in listings:
            listing.applicant_count = Application.objects.filter(opportunity_id=listing.opportunity_id).count()

        return Response(ProviderOpportunitySerializer(listings, many=True).data)

    def post(self, request):
        provider_id = get_provider_id(request.user)

        serializer = OpportunityWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # admin_id is required by the schema but there's no admin
        # assignment flow yet -- hardcoded to 1 as a placeholder. Replace
        # once listings are actually routed to a specific admin for review.
        opportunity = Opportunity.objects.create(
            provider_id=provider_id,
            admin_id=1,
            **serializer.validated_data,
        )
        return Response(OpportunityWriteSerializer(opportunity).data, status=status.HTTP_201_CREATED)


class ProviderOpportunityDetailView(APIView):
    """
    PATCH  /api/providers/opportunities/<id>/   edit a listing
    DELETE /api/providers/opportunities/<id>/   remove a listing

    Every lookup filters by provider_id as well as opportunity_id, so a
    provider editing or deleting a listing ID that isn't theirs gets a
    404, not someone else's data and not a 403 that confirms the ID exists.
    """

    def _get_own_opportunity(self, request, opportunity_id):
        provider_id = get_provider_id(request.user)
        return Opportunity.objects.filter(opportunity_id=opportunity_id, provider_id=provider_id).first()

    def patch(self, request, opportunity_id):
        opportunity = self._get_own_opportunity(request, opportunity_id)
        if opportunity is None:
            return Response({"error": "Listing not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = OpportunityWriteSerializer(opportunity, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data)

    def delete(self, request, opportunity_id):
        opportunity = self._get_own_opportunity(request, opportunity_id)
        if opportunity is None:
            return Response({"error": "Listing not found"}, status=status.HTTP_404_NOT_FOUND)

        opportunity.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Provider dashboard: view applicants for one of their own listings
# ---------------------------------------------------------------------------

class ProviderApplicantsView(APIView):
    """
    GET /api/providers/opportunities/<id>/applicants/

    Returns the listing itself (title + closing date) alongside the
    applicant list, so the frontend can show which listing this is at the
    top of the page without any ambiguity.
    """

    def get(self, request, opportunity_id):
        provider_id = get_provider_id(request.user)
        opportunity = Opportunity.objects.filter(opportunity_id=opportunity_id, provider_id=provider_id).first()
        if opportunity is None:
            return Response({"error": "Listing not found"}, status=status.HTTP_404_NOT_FOUND)

        applications = Application.objects.filter(opportunity_id=opportunity_id).order_by("-submitted_at")
        student_ids = [a.student_id for a in applications]

        # Adjust these two imports/lookups to match your actual Student/
        # Profile models in accounts/models.py.
        from accounts.models import Student, Profile

        students = {s.student_id: s for s in Student.objects.filter(student_id__in=student_ids)}
        profiles = {p.student_id: p for p in Profile.objects.filter(student_id__in=student_ids)}
        auth_user_ids = [s.auth_user_id for s in students.values()]
        users = {u.id: u for u in User.objects.filter(id__in=auth_user_ids)}

        applicants = []
        for application in applications:
            student = students.get(application.student_id)
            profile = profiles.get(application.student_id)
            user = users.get(student.auth_user_id) if student else None

            applicants.append({
                "application_id": application.application_id,
                "reference_number": application.reference_number,
                "student_id": application.student_id,
                "full_name": f"{user.first_name} {user.last_name}".strip() if user else "Unknown student",
                "email": user.email if user else "",
                "field_of_study": getattr(profile, "fieldofstudy", None),
                "qualification": getattr(profile, "qualification", None),
                "academic_average": getattr(profile, "academicaverage", None),
                "status": application.status,
                "submitted_at": application.submitted_at,
            })

        return Response({
            "opportunity": {
                "opportunity_id": opportunity.opportunity_id,
                "title": opportunity.title,
                "closing_date": opportunity.closing_date,
                "is_verified": opportunity.is_verified,
                "is_active": opportunity.is_active,
            },
            "applicants": applicants,
        })