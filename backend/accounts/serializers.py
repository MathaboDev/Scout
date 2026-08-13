from rest_framework import serializers

from .models import Profile


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "profile_id",
            "student",
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

        read_only_fields = [
            "profile_id",
            "student",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        student_type = attrs.get(
            "student_type",
            getattr(self.instance, "student_type", None),
        )

        year_level = attrs.get(
            "year_level",
            getattr(self.instance, "year_level", None),
        )

        graduate_type = attrs.get(
            "graduate_type",
            getattr(self.instance, "graduate_type", None),
        )

        qualification = attrs.get(
            "qualification",
            getattr(self.instance, "qualification", None),
        )

        if student_type not in ["Tertiary Student", "Graduate"]:
            raise serializers.ValidationError(
                {
                    "student_type": (
                        "Must be 'Tertiary Student' or 'Graduate'."
                    )
                }
            )

        if student_type == "Tertiary Student":
            if year_level is None:
                raise serializers.ValidationError(
                    {
                        "year_level": (
                            "Year level is required for tertiary students."
                        )
                    }
                )

            if graduate_type is not None:
                raise serializers.ValidationError(
                    {
                        "graduate_type": (
                            "Graduate type must be empty for tertiary students."
                        )
                    }
                )

            if qualification is not None:
                raise serializers.ValidationError(
                    {
                        "qualification": (
                            "Qualification must be empty for tertiary students."
                        )
                    }
                )

        elif student_type == "Graduate":
            if year_level is not None:
                raise serializers.ValidationError(
                    {
                        "year_level": (
                            "Year level must be empty for graduates."
                        )
                    }
                )

            if graduate_type not in ["Undergraduate", "Postgraduate"]:
                raise serializers.ValidationError(
                    {
                        "graduate_type": (
                            "Must be 'Undergraduate' or 'Postgraduate'."
                        )
                    }
                )

            undergraduate_qualifications = [
                "Higher Certificate",
                "Diploma",
                "Bachelor",
            ]

            postgraduate_qualifications = [
                "Honours",
                "Masters",
                "Doctorate",
            ]

            if graduate_type == "Undergraduate":
                if qualification not in undergraduate_qualifications:
                    raise serializers.ValidationError(
                        {
                            "qualification": (
                                "Undergraduate graduates must use "
                                "Higher Certificate, Diploma or Bachelor."
                            )
                        }
                    )

            if graduate_type == "Postgraduate":
                if qualification not in postgraduate_qualifications:
                    raise serializers.ValidationError(
                        {
                            "qualification": (
                                "Postgraduate graduates must use "
                                "Honours, Masters or Doctorate."
                            )
                        }
                    )

        return attrs