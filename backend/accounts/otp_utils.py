import secrets
from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from django.utils.html import escape

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

    email = _BrandedEmail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
    email.attach_alternative(_otp_html(user.first_name or "there", otp_code), "text/html")
    email.send(fail_silently=False)


# Same file as the PDF report letterhead; embedded so it shows without a hosted URL.
LOGO_PATH = Path(__file__).resolve().parent.parent / "core" / "assets" / "scout-logo.png"


class _BrandedEmail(EmailMultiAlternatives):
    def message(self, *args, **kwargs):
        msg = super().message(*args, **kwargs)
        msg.get_body(("html",)).add_related(
            LOGO_PATH.read_bytes(), "image", "png",
            cid="<scout-logo>", disposition="inline", filename="scout-logo.png",
        )
        return msg


def _otp_html(first_name, otp_code):
    name = escape(first_name)
    return f"""\
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#F3F3F1;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F3F1;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:Roboto,'Helvetica Neue',Arial,sans-serif;color:#101014;">

<tr><td style="background:#101014;border-radius:14px 14px 0 0;padding:20px 28px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="vertical-align:middle;"><img src="cid:scout-logo" width="40" height="40" alt="Scout" style="display:block;border-radius:50%;"></td>
<td style="vertical-align:middle;padding-left:12px;font-size:20px;font-weight:700;color:#FFFFFF;">Scout</td>
</tr></table>
</td></tr>

<tr><td style="background:#FFFFFF;padding:36px 28px 28px;border-left:1px solid #E5E5E2;border-right:1px solid #E5E5E2;">
<p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6B6B6B;">Verify your email</p>
<h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:700;">Hi {name}, here's your code.</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3A3A3F;">Enter this six-digit code on Scout to continue.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td align="center" style="background:#F3F3F1;border:1px solid #E5E5E2;border-radius:12px;padding:22px 12px;">
<span style="font-size:36px;font-weight:700;letter-spacing:12px;font-family:'Roboto Mono',Consolas,Menlo,monospace;color:#101014;">{otp_code}</span>
</td></tr></table>

<p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#3A3A3F;">This code expires in <strong>{OTP_EXPIRY_MINUTES} minutes</strong>.</p>
<p style="margin:8px 0 0;font-size:13px;line-height:1.6;color:#6B6B6B;">Didn't request this? You can safely ignore this email.</p>
</td></tr>

<tr><td style="background:#101014;border-radius:0 0 14px 14px;padding:24px 28px;">
<p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#FFFFFF;">We find what <span style="color:#E16041;">fits</span> for you.</p>
<p style="margin:0;font-size:12px;line-height:1.6;color:#A8A8AD;">The one-profile platform for South African students to find, apply for and track internships, learnerships and graduate programmes.</p>
</td></tr>

<tr><td align="center" style="padding:18px 8px 0;font-size:11px;color:#8A8A8F;">
Scout &middot; Group 3 &middot; Sent to you because this email was used on Scout.
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


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