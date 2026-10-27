from django.urls import path

from .views import ProfileView, login, logout, me, register

urlpatterns = [
    path("register/", register, name="register"),
    path("login/", login, name="login"),
    path("logout/", logout, name="logout"),
    path("me/", me, name="me"),
    path("profile/", ProfileView.as_view(), name="profile"),
]

