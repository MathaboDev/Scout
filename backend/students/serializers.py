from rest_framework import serializers

from .models import Profile


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "profileid",
            "studentid",
            "institution",
            "fieldofstudy",
            "yearlevel",
            "academicaverage",
            "opportunitypreference",
            "province",
            "createdat",
            "updatedat",
        ]
        read_only_fields = [
            "profileid",
            "studentid",
            "createdat",
            "updatedat",
        ]