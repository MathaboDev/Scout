from django.contrib.auth import authenticate, get_user_model
from django.db import transaction

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from core.permissions import IsStudent, get_provider, get_student

from .models import Profile, Student
from .serializers import StudentProfileSerializer

User = get_user_model()

MIN_PASSWORD_LENGTH = 10  # frontend Register.jsx uses the same number


def _user_payload(user):
    """
    The one shape the frontend stores after login. `role` decides which
    side of the app the user lands on: "student" or "provider".
    """
    student = get_student(user)
    provider = None if student else get_provider(user)

    payload = {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "role": "student" if student else "provider" if provider else None,
    }
    if provider:
        payload["company_name"] = provider.company_name
    return payload


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def register(request):
    full_name = (request.data.get("full_name") or "").strip()
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    confirm_password = request.data.get("confirm_password") or ""

    if not full_name or not email or not password or not confirm_password:
        return Response(
            {"error": "Full name, email, password and confirm password are all required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    name_parts = full_name.split()
    if len(name_parts) < 2:
        return Response(
            {"error": "Please enter your first and last name."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if password != confirm_password:
        return Response({"error": "Passwords don't match."}, status=status.HTTP_400_BAD_REQUEST)

    if len(password) < MIN_PASSWORD_LENGTH:
        return Response(
            {"error": f"Use at least {MIN_PASSWORD_LENGTH} characters for your password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=email).exists() or Student.objects.filter(email=email).exists():
        return Response(
            {"error": "An account with this email already exists. Try logging in instead."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    first_name, last_name = name_parts[0], " ".join(name_parts[1:])

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
                password_hash=None,
                is_email_verified=False,
                account_status="active",
                auth_user=user,
            )
    except Exception:
        # NFR1: never echo internal errors (they can contain SQL / data).
        return Response(
            {"error": "We couldn't create your account right now. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {
            "message": "Registration successful.",
            "user": {"first_name": first_name, "last_name": last_name, "email": email},
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def login(request):
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""

    if not email or not password:
        return Response(
            {"error": "Enter your email and password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request=request, username=email, password=password)
    if user is None:
        return Response(
            {"error": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    payload = _user_payload(user)
    if payload["role"] is None:
        return Response(
            {"error": "This login isn't linked to a Scout student or provider account."},
            status=status.HTTP_403_FORBIDDEN,
        )

    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": payload}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response({"message": "Logout successful."}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """Lets the frontend re-check who is logged in after a page reload."""
    return Response({"user": _user_payload(request.user)})


class ProfileView(RetrieveUpdateAPIView):
    """
    GET   /api/accounts/profile/  -> the student's profile (blank if not created yet)
    PATCH /api/accounts/profile/  -> create on first save, update afterwards

    Looked up server-side from the auth token; the client never sends a
    student id.
    """

    permission_classes = [IsStudent]
    serializer_class = StudentProfileSerializer
    http_method_names = ["get", "patch"]

    def get_object(self):
        student = self.request.student
        return Profile.objects.filter(student=student).first() or Profile(student=student)

