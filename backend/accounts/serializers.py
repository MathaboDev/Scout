from rest_framework import serializers

from core.choices import (
    FIELD_OF_STUDY_OPTIONS,
    GRADUATE_TYPES,
    OPPORTUNITY_TYPES,
    POSTGRAD_QUALIFICATIONS,
    PROVINCES,
    STUDENT_TYPES,
    UNDERGRAD_QUALIFICATIONS,
)

from .models import Profile

# Columns that are NOT NULL in schema.sql's profile table.
ALWAYS_REQUIRED = [
    "student_type",
    "institution",
    "field_of_study",
    "academic_average",
    "opportunity_preference",
    "province",
]


class StudentProfileSerializer(serializers.ModelSerializer):
    """
    Wire format is snake_case (student_type, field_of_study, ...).
    The frontend sends exactly these keys; see frontend/src/lib/api.js.
    """

    student_type = serializers.ChoiceField(choices=STUDENT_TYPES)
    field_of_study = serializers.ChoiceField(choices=FIELD_OF_STUDY_OPTIONS)
    opportunity_preference = serializers.ChoiceField(choices=OPPORTUNITY_TYPES)
    province = serializers.ChoiceField(choices=PROVINCES)
    academic_average = serializers.FloatField(min_value=0, max_value=100)
    year_level = serializers.IntegerField(min_value=1, max_value=6, required=False, allow_null=True)
    graduate_type = serializers.ChoiceField(
        choices=GRADUATE_TYPES, required=False, allow_null=True
    )
    qualification = serializers.ChoiceField(
        choices=UNDERGRAD_QUALIFICATIONS + POSTGRAD_QUALIFICATIONS,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Profile
        fields = [
            "profile_id",
            "student_type",
            "institution",
            "field_of_study",
            "academic_average",
            "opportunity_preference",
            "province",
            "year_level",
            "graduate_type",
            "qualification",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["profile_id", "created_at", "updated_at"]

    def _value(self, attrs, key):
        if key in attrs:
            return attrs[key]
        return getattr(self.instance, key, None)

    def validate(self, attrs):
        # First save of a profile is an INSERT, so every NOT NULL column
        # must be present even though the view uses PATCH.
        is_new = self.instance is None or self.instance.pk is None
        if is_new:
            missing = [k for k in ALWAYS_REQUIRED if attrs.get(k) in (None, "")]
            if missing:
                raise serializers.ValidationError(
                    {k: "This field is required." for k in missing}
                )

        student_type = self._value(attrs, "student_type")
        year_level = self._value(attrs, "year_level")
        graduate_type = self._value(attrs, "graduate_type")
        qualification = self._value(attrs, "qualification")

        # Mirrors chk_profile_studenttype_fields in schema.sql exactly.
        if student_type == "Tertiary Student":
            if year_level is None:
                raise serializers.ValidationError(
                    {"year_level": "Year of study is required for tertiary students."}
                )
            attrs["graduate_type"] = None
            attrs["qualification"] = None

        elif student_type == "Graduate":
            attrs["year_level"] = None
            if graduate_type not in GRADUATE_TYPES:
                raise serializers.ValidationError(
                    {"graduate_type": "Choose Undergraduate or Postgraduate."}
                )
            allowed = (
                UNDERGRAD_QUALIFICATIONS
                if graduate_type == "Undergraduate"
                else POSTGRAD_QUALIFICATIONS
            )
            if qualification not in allowed:
                raise serializers.ValidationError(
                    {"qualification": f"Choose one of: {', '.join(allowed)}."}
                )

        return attrs

