from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    api_view,
    permission_classes,
    throttle_classes,
)
from rest_framework.generics import RetrieveUpdateAPIView
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

    #========================
    #Validate required fields
    #========================

    if not full_name or not email or not password or not confirm_password:
        return Response(
            {
                "error": "full_name, email, password and confirm_password are required."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    full_name = full_name.strip()
    email = email.strip().lower()

    # ========================
    # Split full name
    # ========================

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

    # ========================
    # Check password match
    # ========================

    if password != confirm_password:
        return Response(
            {
                "error": "Passwords do not match."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    #========================
    #Validate password length
    #========================

    if len(password) < 10:
        return Response(
            {
                "error": "Password must be at least 10 characters long."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

     
    #=========================
    #Check for duplicate email
    #=========================

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

    #=========================
    #Create both records
    #=========================

    try:
        with transaction.atomic():

            # Django authentication user
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
            )

            # Scout Student record, linked back to the auth user so
            # auth_utils.py can look up this student from request.user
            Student.objects.create(
                first_name=first_name,
                last_name=last_name,
                email=email,
                password_hash=make_password(password),
                is_email_verified=False,
                account_status="Active",
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

    # ========================
    # Validate required fields
    # ========================

    if not email or not password:
        return Response(
            {
                "error": "email and password are required."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    email = email.strip().lower()

    # ========================
    # Authenticate
    # ========================

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

    # ========================
    # Get/create authentication token
    # ========================

    token, created = Token.objects.get_or_create(user=user)

    # ========================
    # Return frontend format
    # ========================

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


class ProfileView(RetrieveUpdateAPIView):
    """
    GET: return the authenticated student's profile (blank/unsaved
    instance if they haven't created one yet).
    PATCH: create (first save) or update the authenticated
    student's profile.

    The profile is looked up server-side via student.auth_user,
    never trusted from the client (matches the eligibility-data
    security rule used elsewhere in the app).
    """

    permission_classes = [IsAuthenticated]
    serializer_class = StudentProfileSerializer
    http_method_names = ["get", "patch"]

    def get_object(self):
        student = get_object_or_404(Student, auth_user=self.request.user)

        try:
            return Profile.objects.get(student=student)
        except Profile.DoesNotExist:
            return Profile(student=student)