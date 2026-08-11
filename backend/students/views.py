from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.auth_utils import get_student_id, get_student_profile
from .models import Profile
from .serializers import StudentProfileSerializer


class StudentProfileView(APIView):
    """
    View and save the authenticated student's profile.

    The student is determined from request.user.
    The client cannot provide or change the student ID.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Return the authenticated student's profile.
        """

        profile = get_student_profile(request.user)

        return Response(
            {
                "profile": profile
            }
        )

    def post(self, request):
        """
        Create the authenticated student's profile.
        """

        student_id = get_student_id(request.user)

        if Profile.objects.filter(studentid=student_id).exists():
            return Response(
                {
                    "detail": "Profile already exists. Use PUT to update it."
                },
                status=400,
            )

        serializer = StudentProfileSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        profile = serializer.save(studentid_id=student_id)

        return Response(
            {
                "profile": StudentProfileSerializer(profile).data
            },
            status=201,
        )

    def put(self, request):
        """
        Update the authenticated student's existing profile.
        """

        student_id = get_student_id(request.user)

        try:
            profile = Profile.objects.get(studentid=student_id)
        except Profile.DoesNotExist:
            return Response(
                {
                    "detail": "No profile found. Create your profile first."
                },
                status=404,
            )

        serializer = StudentProfileSerializer(
            profile,
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)

        profile = serializer.save()

        return Response(
            {
                "profile": StudentProfileSerializer(profile).data
            }
        )