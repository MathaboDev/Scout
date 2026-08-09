"""
core/auth_utils.py

The single place that turns "an authenticated request" into "this
student's current profile, fetched from the database." Every view that
needs eligibility-relevant data (field of study, year level, academic
average, etc.) must go through this module — never accept those fields
from request.data / request.GET / anything the browser sent directly.

    Browser -> auth token -> Django -> identify student -> fetch profile
    -> THEN perform eligibility / authorization logic

This is Scout's core security boundary (Rule 20, and the concrete lesson
in Rule 46 — profile data used to be trusted from the client, which was a
real bug that's since been fixed). Every future eligibility or ownership
check should call get_student_profile() / get_student_id() rather than
re-deriving "who is this student" some other way.

Usage inside a DRF view (request.user is already populated by
TokenAuthentication + IsAuthenticated before your view method runs):

    from core.auth_utils import get_student_profile

    class EligibleOpportunitiesView(APIView):
        def get(self, request):
            profile = get_student_profile(request.user)
            # profile["field_of_study"], profile["year_level"], etc.
            ...

ASSUMPTION FLAGGED (Rule 45 — source discipline):
This implementation assumes the `student` table has a column linking it
back to Django's own auth_user table (here called `auth_user_id`), since
the project uses Django's built-in auth for login/tokens but also has a
separate `student` entity in schema.sql. I have not seen schema.sql, so
the actual column name may differ (or the link may not exist yet). Please
confirm the real column name against schema.sql / the Data Dictionary and
update the two queries below accordingly — everything else in this file
is independent of that detail.
"""

from django.db import connection
from rest_framework.exceptions import NotFound, PermissionDenied


def get_student_profile(user) -> dict:
    """
    Given the Django auth user attached to an authenticated request,
    return that student's profile row as a dict, fetched fresh from the
    database on every call — never from anything the client sent, and
    never cached across requests (profile data changes, and caching an
    authorization-relevant value is explicitly flagged as risky — Rule 14).

    Raises:
        PermissionDenied: if `user` is not authenticated. Views should
            normally already enforce this via IsAuthenticated, but this
            function checks independently rather than assuming the caller
            got it right.
        NotFound: if the authenticated user has no matching student
            profile yet (e.g. registered but hasn't completed FR1 profile
            setup). Callers should treat this as "profile not complete",
            not as a generic server error.
    """
    if not user or not user.is_authenticated:
        raise PermissionDenied("Authentication required.")

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT p.*
            FROM profile p
            JOIN student s ON s.id = p.student_id
            WHERE s.auth_user_id = %s
            """,
            [user.id],
        )
        columns = [col[0] for col in cursor.description]
        row = cursor.fetchone()

    if row is None:
        raise NotFound("No profile found for this student. Complete profile setup first.")

    return dict(zip(columns, row))


def get_student_id(user) -> int:
    """
    Lightweight variant for the common case where a caller only needs the
    student's own ID — e.g. to check "does this application/bookmark
    belong to me?" for an IDOR/BOLA check (Rule 19) — without needing the
    full profile.
    """
    if not user or not user.is_authenticated:
        raise PermissionDenied("Authentication required.")

    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT studentid FROM student WHERE authuserid = %s",
            [user.id],
        )
        row = cursor.fetchone()

    if row is None:
        raise NotFound("No student record found for this account.")

    return row[0]