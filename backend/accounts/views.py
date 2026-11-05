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

from core.permissions import IsStudent, get_admin, get_provider, get_student
from core.choices import PROVINCES

from providers_admin.models import Provider

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
    side of the app the user lands on: 'student', 'provider', or 'admin'.
    Admin takes precedence (is_staff users are platform admins first, even
    if a stale student/provider row happens to share their auth_user).
    """
    admin = get_admin(user)
    student = None if admin else get_student(user)
    provider = None if admin or student else get_provider(user)

    role = "admin" if admin else "student" if student else "provider" if provider else None

    payload = {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "role": role,
    }
    if provider:
        payload["company_name"] = provider.company_name
    return payload


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def register(request):
    """
    Create a Scout account. Defaults to a student account, which keeps every
    existing frontend call working unchanged. Pass role="provider" to create
    a provider account with company_name, industry and province.
    """
    role = (request.data.get("role") or "student").strip().lower()
    if role not in ("student", "provider"):
        return Response(
            {"error": "Account role must be 'student' or 'provider'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    confirm_password = request.data.get("confirm_password") or ""

    if not email or not password or not confirm_password:
        return Response(
            {"error": "Email, password and confirm password are all required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if password != confirm_password:
        return Response({"error": "Passwords don't match."}, status=status.HTTP_400_BAD_REQUEST)

    if len(password) < MIN_PASSWORD_LENGTH:
        return Response(
            {"error": f"Use at least {MIN_PASSWORD_LENGTH} characters for your password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Any existing account (student OR provider OR auth_user) with this email blocks reuse.
    if (
        User.objects.filter(username=email).exists()
        or Student.objects.filter(email=email).exists()
        or Provider.objects.filter(email=email).exists()
    ):
        return Response(
            {"error": "An account with this email already exists. Try logging in instead."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if role == "student":
        full_name = (request.data.get("full_name") or "").strip()
        if not full_name:
            return Response(
                {"error": "Full name is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        name_parts = full_name.split()
        if len(name_parts) < 2:
            return Response(
                {"error": "Please enter your first and last name."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        first_name, last_name = name_parts[0], " ".join(name_parts[1:])

        try:
            with transaction.atomic():
                # is_active=False blocks login until the email is verified
                # via OTP. verify_otp flips it to True on first success.
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    is_active=False,
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
                otp_record, otp_code, resend_token = create_login_otp(user)
        except Exception:
            return Response(
                {"error": "We couldn't create your account right now. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    else:
        # Provider branch.
        company_name = (request.data.get("company_name") or "").strip()
        industry = (request.data.get("industry") or "").strip()
        province = (request.data.get("province") or "").strip()
        phone = (request.data.get("phone") or "").strip() or None

        if not company_name or not industry or not province:
            return Response(
                {"error": "Company name, industry and province are all required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if province not in PROVINCES:
            return Response(
                {"error": "Choose a valid South African province."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=password,
                    first_name=company_name[:30],
                    last_name="",
                    is_active=False,
                )
                Provider.objects.create(
                    company_name=company_name,
                    email=email,
                    phone=phone,
                    industry=industry,
                    province=province,
                    auth_user=user,
                )
                otp_record, otp_code, resend_token = create_login_otp(user)
        except Exception:
            return Response(
                {"error": "We couldn't create your account right now. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # Deliver the signup verification code. Account stays inactive until
    # verify_otp succeeds, so a delivery failure is not silently discarded.
    try:
        send_login_otp(user, otp_code)
    except Exception:
        logger.exception("Failed to send signup OTP email.")
        otp_record.is_used = True
        otp_record.save(update_fields=["is_used"])
        return Response(
            {"error": "Unable to send verification code. Please try again."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response(
        {
            "message": "Verification code sent to your email.",
            "otp_id": otp_record.id,
            "resend_token": resend_token,
            "requires_verification": True,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def login(request):
    """
    Authenticate the user's credentials and issue an authentication token.

    Email verification (OTP) happens once at signup, not on every login, so
    an activated account logs in with email + password alone. authenticate()
    returns None for is_active=False accounts, which means a user who has
    not completed signup verification cannot slip past this check.
    """

    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""

    if not email or not password:
        return Response(
            {"error": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(request=request, username=email, password=password)

    if user is None:
        # Could be: wrong password, no such account, or an unverified account.
        # If an inactive account matches the password, redirect the user to
        # finish signup verification instead of showing a generic error.
        pending = User.objects.filter(username=email, is_active=False).first()
        if pending and pending.check_password(password):
            return Response(
                {"error": "Please verify your email first. Check your inbox for the signup code."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(
            {"error": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    payload = _user_payload(user)
    if payload["role"] is None:
        return Response(
            {"error": "User account is not linked to a Scout role."},
            status=status.HTTP_403_FORBIDDEN,
        )

    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {"message": "Login successful.", "token": token.key, "user": payload},
        status=status.HTTP_200_OK,
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

        # First successful OTP activates the account (signup verification).
        # Idempotent for any future OTP use on an already-active account.
        if not user.is_active:
            user.is_active = True
            user.save(update_fields=["is_active"])

        # Mirror activation on the Student row so is_email_verified reflects
        # reality. Provider has no equivalent field.
        Student.objects.filter(auth_user=user, is_email_verified=False).update(
            is_email_verified=True
        )

        payload = _user_payload(user)

        if payload["role"] is None:
            return Response(
                {"error": "This account cannot log in."},
                status=status.HTTP_403_FORBIDDEN
            )

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

        # Reject challenges that are already used or exhausted.
        # Inactive accounts are allowed here because signup verification
        # itself happens on an inactive account — users need to be able
        # to resend the activation code if the first email was missed.
        if (
            original.is_used
            or original.attempts >= MAX_OTP_ATTEMPTS
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

