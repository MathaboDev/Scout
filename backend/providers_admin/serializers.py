from rest_framework import serializers
from opportunities.models import Opportunity


class OpportunityWriteSerializer(serializers.ModelSerializer):
    """
    Used by the provider dashboard to create and edit listings.
    provider_id is deliberately absent from fields: the view sets it from
    the authenticated provider, never accepted from the request body.
    is_verified is also absent -- only an admin action should flip that,
    not the provider who posted the listing.
    """

    class Meta:
        model = Opportunity
        fields = [
            "opportunity_id",
            "title",
            "description",
            "opportunity_type",
            "field_of_study",
            "minimum_average",
            "year_level_required",
            "required_qualification",
            "eligibility_type",
            "province",
            "closing_date",
            "is_active",
        ]
        read_only_fields = ["opportunity_id"]


class ProviderOpportunitySerializer(serializers.ModelSerializer):
    """Used for the provider's own listing list (dashboard), includes applicant_count."""

    applicant_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Opportunity
        fields = [
            "opportunity_id",
            "title",
            "opportunity_type",
            "closing_date",
            "is_verified",
            "is_active",
            "applicant_count",
        ]
        read_only_fields = fields