from django.urls import path
from .views import ProfileView, register, login, logout


urlpatterns = [
    path("register/", register, name="register"),
    path("login/", login, name="login"),
    path("logout/", logout, name="logout"),
    path("profile/", ProfileView.as_view(), name="profile"),
]