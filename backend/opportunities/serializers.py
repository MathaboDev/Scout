from django.utils import timezone
from rest_framework import serializers

from core.choices import (
    ALL_QUALIFICATIONS,
    ELIGIBILITY_TYPES,
    FIELD_OF_STUDY_OPTIONS,
    OPPORTUNITY_TYPES,
    PROVINCES,
)

from .models import Opportunity


class ListingTemplateSerializer(serializers.ModelSerializer):
    """
    The fixed listing template providers fill in (FR10).
    Every field maps 1:1 to an opportunity column, so whatever a provider
    enters can be matched by opportunities/matching.py.
    """

    opportunity_type = serializers.ChoiceField(choices=OPPORTUNITY_TYPES)
    field_of_study = serializers.ChoiceField(choices=FIELD_OF_STUDY_OPTIONS)
    eligibility_type = serializers.ChoiceField(choices=ELIGIBILITY_TYPES)
    minimum_average = serializers.FloatField(
        min_value=0, max_value=100, required=False, allow_null=True
    )
    year_level_required = serializers.IntegerField(
        min_value=1, max_value=6, required=False, allow_null=True
    )
    required_qualification = serializers.ChoiceField(
        choices=ALL_QUALIFICATIONS, required=False, allow_null=True
    )
    province = serializers.ChoiceField(choices=PROVINCES, required=False, allow_null=True)

    class Meta:
        model = Opportunity
        fields = [
            "opportunity_id",
            "title",
            "opportunity_type",
            "field_of_study",
            "eligibility_type",
            "minimum_average",
            "year_level_required",
            "required_qualification",
            "province",
            "description",
            "closing_date",
            "is_verified",
            "is_active",
            "posted_at",
        ]
        read_only_fields = ["opportunity_id", "is_verified", "is_active", "posted_at"]

    def _value(self, attrs, key):
        if key in attrs:
            return attrs[key]
        return getattr(self.instance, key, None)

    def validate_closing_date(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("Closing date must be in the future.")
        return value

    def validate(self, attrs):
        eligibility = self._value(attrs, "eligibility_type")
        if eligibility == "Graduate" and self._value(attrs, "year_level_required"):
            raise serializers.ValidationError(
                {"year_level_required": "Year of study only applies to tertiary students."}
            )
        if eligibility == "Tertiary Student" and self._value(attrs, "required_qualification"):
            raise serializers.ValidationError(
                {"required_qualification": "A completed qualification only applies to graduates."}
            )
        return attrs

