from django.urls import path

from .views import (
    StudentProfileView,
    login,
    logout,
    register,
)


urlpatterns = [
    path(
        "register/",
        register,
        name="register",
    ),
    path(
        "login/",
        login,
        name="login",
    ),
    path(
        "logout/",
        logout,
        name="logout",
    ),
    path(
        "profile/",
        StudentProfileView.as_view(),
        name="student-profile",
    ),
]