"""
Scout authentication/profile helpers.

These functions determine the authenticated Scout student from
request.user and fetch data directly from the database.

Views should never trust student/profile identity supplied by
the client.
"""

from django.db import connection
from rest_framework.exceptions import NotFound, PermissionDenied


def get_student_profile(user) -> dict:
    """
    Return the authenticated student's profile.

    The student is identified through student.authuserid,
    which links the Scout student record to Django's auth_user.
    """

    if not user or not user.is_authenticated:
        raise PermissionDenied("Authentication required.")

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT p.*
            FROM profile p
            JOIN student s
                ON s.studentid = p.studentid
            WHERE s.authuserid = %s
            """,
            [user.id],
        )

        columns = [column[0] for column in cursor.description]
        row = cursor.fetchone()

    if row is None:
        raise NotFound(
            "No profile found for this student. "
            "Complete profile setup first."
        )

    return dict(zip(columns, row))


def get_student_id(user) -> int:
    """
    Return the authenticated student's Scout student ID.
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