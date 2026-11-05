import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from django.utils import timezone

from .models import LoginOTP

# OTP configuration
OTP_EXPIRY_MINUTES = 5
MAX_OTP_ATTEMPTS = 5
MAX_OTP_RESENDS = 3

# Minimum waiting period before requesting another login OTP.
OTP_COOLDOWN_SECONDS = 60

def can_request_login_otp(user):
    """
    Prevent repeated OTP requests within the cooldown period.
    Returns True when the user may request another OTP.
    """

    # Find the most recently generated OTP for this account.
    latest_otp = (
        LoginOTP.objects
        .filter(user=user)
        .order_by("-created_at", "-id")
        .first()
    )

    if latest_otp is None:
        return True

    # Allow another OTP only after the cooldown has elapsed.
    cooldown_ends = latest_otp.created_at + timedelta(
        seconds=OTP_COOLDOWN_SECONDS
    )

    return timezone.now() >= cooldown_ends

def create_login_otp(user, resend_count=0):
    """
    Generate a six-digit OTP and a secure resend token.
    Store only their hashes in the database.
    """

    # Invalidate previous unused OTP challenges for this user.
    LoginOTP.objects.filter(
        user=user,
        is_used=False
    ).update(is_used=True)

    # Generate a six-digit verification code.
    otp_code = f"{secrets.randbelow(1000000):06d}"

    # Generate an unpredictable credential for requesting a resend.
    # This is separate from the six-digit OTP.
    resend_token = secrets.token_urlsafe(32)

    # Store hashes instead of plaintext credentials.
    otp_record = LoginOTP.objects.create(
        user=user,
        resend_count=resend_count,
        code_hash=make_password(otp_code),
        resend_token_hash=make_password(resend_token),
        expires_at=timezone.now() + timedelta(
            minutes=OTP_EXPIRY_MINUTES
        )
    )

    # The plaintext values are returned only for immediate use.
    return otp_record, otp_code, resend_token

def send_login_otp(user, otp_code):
    """
    Send the login verification code to the user's email address.
    """

    subject = "Scout - Login Verification Code"

    message = (
        f"Hello {user.first_name or 'there'},\n\n"
        f"Your Scout login verification code is: {otp_code}\n\n"
        f"This code expires in {OTP_EXPIRY_MINUTES} minutes.\n"
        "If you did not attempt to log in, please ignore this email.\n\n"
        "Scout Team"
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False
    )


def verify_login_otp(otp_record, otp_code):
    """
    Validate an OTP challenge, including expiration,
    attempt limits, and single-use protection.
    """

    # Reject codes that have already been used or have expired.
    if otp_record.is_used or timezone.now() >= otp_record.expires_at:
        return False

    # Reject challenges that have reached the maximum number of attempts.
    if otp_record.attempts >= MAX_OTP_ATTEMPTS:
        return False

    # Count every verification attempt, including incorrect codes.
    otp_record.attempts += 1

    if not check_password(otp_code, otp_record.code_hash):
        otp_record.save(update_fields=["attempts"])
        return False

    # Mark a successfully verified OTP as used.
    otp_record.is_used = True
    otp_record.save(update_fields=["attempts", "is_used"])

    return True