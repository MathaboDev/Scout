from rest_framework import serializers
from .models import Opportunity


class OpportunityBrowseSerializer(serializers.ModelSerializer):
    """
    Used ONLY on the student Browse screen (opportunities/views.py).
    is_eligible is not a database column, it is computed per-request in
    the view (see opportunity_eligibility.py) and attached to each
    Opportunity instance before serializing, so SerializerMethodField
    just reads it back off.

    Provider-side serializers (creating/editing listings) live in
    providers_admin/serializers.py, not here.
    """

    is_eligible = serializers.SerializerMethodField()

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
            "is_eligible",
        ]
        read_only_fields = fields

    def get_is_eligible(self, obj):
        # Set by the view with: opportunity.is_eligible = True/False
        return getattr(obj, "is_eligible", False)