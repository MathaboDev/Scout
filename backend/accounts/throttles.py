from rest_framework.throttling import SimpleRateThrottle


class OTPVerificationThrottle(SimpleRateThrottle):
    """
    Limit OTP verification requests to reduce brute-force attempts.
    Requests are grouped by the client's IP address.
    """

    scope = "otp_verify"

    def get_cache_key(self, request, view):
        # Identify the client and apply the dedicated OTP rate limit.
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }

class OTPResendThrottle(SimpleRateThrottle):
    """
    Limit OTP resend requests per client IP address.
    """

    scope = "otp_resend"

    def get_cache_key(self, request, view):
        # Use the client's IP to group resend requests.
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }