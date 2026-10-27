"""
Role checks shared by every app.

Each permission looks the caller up server-side from request.user (the
auth token), never from anything the browser sends, and attaches the
matching row to the request so views don't repeat the lookup:

    request.student   -> accounts.models.Student
    request.provider  -> providers_admin.models.Provider
"""

from rest_framework.permissions import BasePermission

from accounts.models import Student
from providers_admin.models import Provider


def get_student(user):
    if not user or not user.is_authenticated:
        return None
    return Student.objects.filter(auth_user=user).first()


def get_provider(user):
    if not user or not user.is_authenticated:
        return None
    return Provider.objects.filter(auth_user=user).first()


class IsStudent(BasePermission):
    message = "This action is only available to student accounts."

    def has_permission(self, request, view):
        student = get_student(request.user)
        request.student = student
        return student is not None


class IsProvider(BasePermission):
    message = "This action is only available to provider accounts."

    def has_permission(self, request, view):
        provider = get_provider(request.user)
        request.provider = provider
        return provider is not None

