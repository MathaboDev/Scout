"""
core/auth_utils.py

The single place that turns an authenticated request into the current
student's profile fetched from the database.

Every view that needs eligibility-relevant data should use this module
rather than trusting profile information supplied by the client.
"""
"""
Authentication and student lookup utilities for Scout.

This module provides the central security boundary between Django
authentication and Scout's Student/Profile database records.

Flow:
    Request
        -> TokenAuthentication
        -> request.user
        -> authuserid in student table
        -> studentid
        -> profile

The authenticated Django user is used to determine which Student record
belongs to the request. Profile information is always retrieved from the
database rather than being trusted from request data.

Other endpoints that need to determine the current student should use
these functions instead of accepting student IDs or profile information
directly from the client.
"""

from django.db import connection
from rest_framework.exceptions import NotFound, PermissionDenied


def get_student_profile(user) -> dict:
    """
    Return the authenticated student's profile from the database.

    Raises:
        PermissionDenied: If the user is not authenticated.
        NotFound: If the student does not have a profile yet.
    """

    if not user or not user.is_authenticated:
        raise PermissionDenied("Authentication required.")

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT p.*
            FROM profile p
            JOIN student s ON s.studentid = p.studentid
            WHERE s.authuserid = %s
            """,
            [user.id],
        )

        columns = [col[0] for col in cursor.description]
        row = cursor.fetchone()

    if row is None:
        raise NotFound(
            "No profile found for this student. Complete profile setup first."
        )

    return dict(zip(columns, row))


def get_student_id(user) -> int:
    """
    Return the authenticated student's StudentID.
    """

    if not user or not user.is_authenticated:
        raise PermissionDenied("Authentication required.")

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT studentid
            FROM student
            WHERE authuserid = %s
            """,
            [user.id],
        )

        row = cursor.fetchone()

    if row is None:
        raise NotFound("No student record found for this account.")

    return row[0]