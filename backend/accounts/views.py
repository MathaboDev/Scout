from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from django.utils import timezone
from django.contrib.auth.hashers import check_password

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from core.permissions import IsStudent, get_provider, get_student

from .models import Profile, Student, LoginOTP
from .serializers import StudentProfileSerializer

from .otp_utils import (can_request_login_otp, create_login_otp, send_login_otp, verify_login_otp, MAX_OTP_ATTEMPTS, MAX_OTP_RESENDS,)
from .throttles import OTPVerificationThrottle, OTPResendThrottle

import logging
# Logger for recording backend errors without exposing them to users.
logger = logging.getLogger(__name__)

User = get_user_model()

MIN_PASSWORD_LENGTH = 10  # frontend Register.jsx uses the same number


def _user_payload(user):
    """"
    The one shape the frontend stores after login. `role` decides which
    side of the app the user lands on: 'student' or 'provider'.
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
    """
    Authenticate the user's credentials and initiate email OTP verification.
    An authentication token is issued only after OTP verification.
    """

    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""

    # Ensure both login credentials have been provided.
    if not email or not password:
        return Response(
            {"error": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Authenticate against Django's existing user credentials.
    user = authenticate(
        request=request,
        username=email,
        password=password
    )

    if user is None:
        return Response(
            {"error": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Only registered Scout students and providers may continue.
    payload = _user_payload(user)

    if payload["role"] is None:
        return Response(
            {"error": "User account is not linked to a Scout role."},
            status=status.HTTP_403_FORBIDDEN
        )

    # Lock the user's database row so simultaneous login requests
    # cannot generate multiple OTP challenges during the cooldown.
    with transaction.atomic():
        User.objects.select_for_update().get(pk=user.pk)

        if not can_request_login_otp(user):
            return Response(
                {
                    "error": (
                        "Please wait 60 seconds before requesting "
                        "another verification code."
                    )
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Generate the OTP and its separate secure resend credential.
        otp_record, otp_code, resend_token = create_login_otp(user)

    try:
        send_login_otp(user, otp_code)
    except Exception:
        # Record the actual email delivery error for backend debugging.
        logger.exception("Failed to send login OTP email.")

        # Invalidate the OTP challenge when sending fails.
        otp_record.is_used = True
        otp_record.save(update_fields=["is_used"])

        return Response(
            {"error": "Unable to send verification code. Please try again."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
    )

    # Return the challenge ID, not the authentication token.
    return Response(
        {
            "message": "Verification code sent to your email.",
            "otp_id": otp_record.id,

            # The frontend must keep this credential private.
            # It will be required when requesting another OTP.
            "resend_token": resend_token,

            "requires_otp": True
        },
        status=status.HTTP_200_OK
    )

@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([OTPVerificationThrottle])
def verify_otp(request):
    """
    Verify the login OTP and issue an authentication token
    only when the OTP challenge is successfully completed.
    """

    otp_id = request.data.get("otp_id")
    otp_code = str(request.data.get("otp_code") or "").strip()

    # Validate the submitted challenge ID and six-digit OTP.
    if not str(otp_id).isdigit() or not (
        len(otp_code) == 6 and otp_code.isascii() and otp_code.isdigit()
    ):
        return Response(
            {"error": "A valid OTP ID and six-digit code are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Lock the OTP record during verification to prevent
    # simultaneous requests from successfully reusing the same code.
    with transaction.atomic():
        otp_record = (
            LoginOTP.objects
            .select_for_update()
            .select_related("user")
            .filter(id=otp_id)
            .first()
        )

        if otp_record is None:
            return Response(
                {"error": "Invalid or expired verification code."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # The helper checks the code, expiry, attempt limit and reuse.
        if not verify_login_otp(otp_record, otp_code):
            return Response(
                {"error": "Invalid or expired verification code."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = otp_record.user
        payload = _user_payload(user)

        # Confirm the account is still active and has a valid Scout role.
        if not user.is_active or payload["role"] is None:
            return Response(
                {"error": "This account cannot log in."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Only issue the authentication token after OTP verification.
        token, _ = Token.objects.get_or_create(user=user)

    return Response(
        {
            "message": "Login successful.",
            "token": token.key,
            "user": payload
        },
        status=status.HTTP_200_OK
    )

@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([OTPResendThrottle])
def resend_otp(request):
    """
    Resend a login OTP only when the requester provides
    the correct secret credential for the challenge.
    """

    otp_id = request.data.get("otp_id")
    resend_token = request.data.get("resend_token")

    # Validate both required inputs.
    if (
        not str(otp_id).isdigit()
        or not isinstance(resend_token, str)
        or not resend_token
    ):
        return Response(
            {"error": "Invalid verification request."},
            status=status.HTTP_400_BAD_REQUEST
        )

    with transaction.atomic():

        # Find the original challenge.
        original = LoginOTP.objects.filter(id=otp_id).first()

        if original is None:
            return Response(
                {"error": "Invalid verification request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Lock the user row to serialize concurrent OTP requests.
        user = User.objects.select_for_update().get(
            pk=original.user_id
        )

        # Reload the challenge after obtaining the lock so concurrent
        # requests cannot act on stale challenge information.
        original.refresh_from_db()

        # Reject challenges that are already used, exhausted,
        # or belong to inactive accounts.
        if (
            original.is_used
            or original.attempts >= MAX_OTP_ATTEMPTS
            or not user.is_active
            or _user_payload(user)["role"] is None
        ):
            return Response(
                {"error": "Invalid verification request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Compare the supplied secret with the stored hash.
        # Old challenges without a resend token are rejected.
        if (
            not original.resend_token_hash
            or not check_password(
                resend_token,
                original.resend_token_hash
            )
        ):
            return Response(
                {"error": "Invalid verification request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Stop issuing replacement codes after three resends.
        if original.resend_count >= MAX_OTP_RESENDS:
            return Response(
                {"error": "Resend limit reached. Please log in again."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Enforce the existing 60-second cooldown.
        if not can_request_login_otp(user):
            return Response(
                {
                    "error": (
                        "Please wait 60 seconds before requesting "
                        "another verification code."
                    )
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Carry the resend count into the replacement challenge.
        otp_record, otp_code, new_resend_token = create_login_otp(
        user, resend_count=original.resend_count + 1
        )

    try:
        send_login_otp(user, otp_code)

    except Exception:
        logger.exception("Failed to resend login OTP email.")

        otp_record.is_used = True
        otp_record.save(update_fields=["is_used"])

        return Response(
            {"error": "Unable to send verification code."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    return Response(
        {
            "message": "A new verification code has been sent.",
            "otp_id": otp_record.id,

            # Rotate the resend credential with each replacement OTP.
            "resend_token": new_resend_token,

            "requires_otp": True,

            "resends_remaining": MAX_OTP_RESENDS - otp_record.resend_count,
        },
        status=status.HTTP_200_OK
    )

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

