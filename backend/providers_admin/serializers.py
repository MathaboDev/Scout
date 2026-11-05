from rest_framework import serializers

from opportunities.models import Opportunity
from .models import Provider


class AdminListingSerializer(serializers.ModelSerializer):
    """
    Read-only listing details for the admin verification queue.
    Includes provider identity so the admin knows who posted the listing.
    """

    provider_name = serializers.SerializerMethodField()
    provider_email = serializers.SerializerMethodField()

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
            "posted_at",
            "provider_name",
            "provider_email",
        ]
        read_only_fields = fields

    def _provider(self, obj):
        # Cached so the two SerializerMethodFields share one query per row.
        if not hasattr(obj, "_admin_provider_cache"):
            obj._admin_provider_cache = Provider.objects.filter(provider_id=obj.provider_id).first()
        return obj._admin_provider_cache

    def get_provider_name(self, obj):
        provider = self._provider(obj)
        return provider.company_name if provider else "Unknown provider"

    def get_provider_email(self, obj):
        provider = self._provider(obj)
        return provider.email if provider else ""
