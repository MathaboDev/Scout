from django.urls import path

from .views import ProfileView, login, verify_otp, resend_otp, logout, me, register

urlpatterns = [
    path("register/", register, name="register"),
    path("login/", login, name="login"),
    path("verify-otp/", verify_otp, name="verify-otp"),
    path("resend-otp/", resend_otp, name="resend-otp"),
    path("logout/", logout, name="logout"),
    path("me/", me, name="me"),
    path("profile/", ProfileView.as_view(), name="profile"),
]

