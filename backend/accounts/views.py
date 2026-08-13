from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import make_password
from django.db import transaction

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    api_view,
    permission_classes,
    throttle_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from core.auth_utils import get_student_id, get_student_profile

from .models import Profile, Student
from .serializers import StudentProfileSerializer


User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def register(request):
    full_name = request.data.get("full_name")
    email = request.data.get("email")
    password = request.data.get("password")
    confirm_password = request.data.get("confirm_password")

    if not full_name or not email or not password or not confirm_password:
        return Response(
            {
                "error": (
                    "full_name, email, password and "
                    "confirm_password are required."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    full_name = full_name.strip()
    email = email.strip().lower()

    name_parts = full_name.split()

    if len(name_parts) < 2:
        return Response(
            {
                "error": "Please provide your first and last name."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    first_name = name_parts[0]
    last_name = " ".join(name_parts[1:])

    if password != confirm_password:
        return Response(
            {
                "error": "Passwords do not match."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(password) < 10:
        return Response(
            {
                "error": "Password must be at least 10 characters long."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=email).exists():
        return Response(
            {
                "error": "An account with this email already exists."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if Student.objects.filter(email=email).exists():
        return Response(
            {
                "error": "An account with this email already exists."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        with transaction.atomic():

            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
            )

            Student.objects.create(
                first_name=first_name,
                last_name=last_name,
                email=email,
                password_hash=make_password(password),
                is_email_verified=False,
                account_status="active",
                auth_user=user,
            )

    except Exception as error:
        return Response(
            {
                "error": "Registration failed.",
                "details": str(error),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {
            "message": "Registration successful",
            "user": {
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
            },
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def login(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {
                "error": "email and password are required."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    email = email.strip().lower()

    user = authenticate(
        request=request,
        username=email,
        password=password,
    )

    if user is None:
        return Response(
            {
                "error": "Invalid email or password."
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    token, created = Token.objects.get_or_create(user=user)

    return Response(
        {
            "token": token.key,
            "user": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
            },
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        request.user.auth_token.delete()
    except Token.DoesNotExist:
        pass

    return Response(
        {
            "message": "Logout successful."
        },
        status=status.HTTP_200_OK,
    )


class StudentProfileView(APIView):
    """
    GET, POST and PUT for the authenticated student's profile.

    The student ID is always obtained from request.user.
    The client cannot choose another student's ID.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_student_profile(request.user)

        return Response(
            {
                "profile": profile
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        student_id = get_student_id(request.user)

        if Profile.objects.filter(student_id=student_id).exists():
            return Response(
                {
                    "detail": (
                        "Profile already exists. "
                        "Use PUT to update it."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = StudentProfileSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        profile = serializer.save(
            student_id=student_id
        )

        return Response(
            {
                "profile": StudentProfileSerializer(profile).data
            },
            status=status.HTTP_201_CREATED,
        )

    def put(self, request):
        student_id = get_student_id(request.user)

        try:
            profile = Profile.objects.get(
                student_id=student_id
            )
        except Profile.DoesNotExist:
            return Response(
                {
                    "detail": (
                        "No profile found. "
                        "Create your profile first."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
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
            },
            status=status.HTTP_200_OK,
        )