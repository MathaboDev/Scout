"""
Admin endpoints for FR9: verifying listings before students see them.

A pending listing is one that a provider has posted (is_active=True) but
no admin has reviewed yet (is_verified=False). Verifying a listing stamps
the reviewing admin's admin_id onto the row, so opportunity.adminid is a
real audit trail and not a placeholder.
"""

from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from core.permissions import IsAdmin
from core.sql import fetch_all, fetch_one

from opportunities.models import Opportunity

from .serializers import AdminListingSerializer


@api_view(["GET"])
@permission_classes([IsAdmin])
def pending_listings(request):
    """
    GET /api/providers-admin/listings/pending/

    Returns every listing waiting for admin verification, oldest first so
    the queue drains in the order providers submitted them.
    """
    pending = Opportunity.objects.filter(is_active=True, is_verified=False).order_by("posted_at")
    return Response({"results": AdminListingSerializer(pending, many=True).data})


@api_view(["POST"])
@permission_classes([IsAdmin])
def verify_listing(request, opportunity_id):
    """
    POST /api/providers-admin/listings/<id>/verify/

    Marks a pending listing as verified under the calling admin's admin_id,
    so students will see it from the next eligibility query onwards.
    """
    opportunity = Opportunity.objects.filter(opportunity_id=opportunity_id).first()
    if opportunity is None:
        return Response({"error": "Listing not found."}, status=status.HTTP_404_NOT_FOUND)

    if opportunity.is_verified:
        return Response({"error": "This listing has already been verified."}, status=status.HTTP_400_BAD_REQUEST)

    opportunity.is_verified = True
    opportunity.admin_id = request.admin.admin_id
    opportunity.save(update_fields=["is_verified", "admin_id"])

    return Response(
        {
            "message": "Listing verified.",
            "opportunity_id": opportunity.opportunity_id,
            "verified_at": timezone.now(),
        }
    )


# ---------------------------------------------------------------------------
# Activity monitoring (admin dashboard analytics)
# ---------------------------------------------------------------------------

ACTIVITY_DAYS = 14


@api_view(["GET"])
@permission_classes([IsAdmin])
def activity(request):
    """
    GET /api/providers-admin/activity/

    Read-only platform analytics for the admin dashboard: headline totals,
    a 14-day daily series of sign-ups and applications, application status
    breakdown, the most-applied listings and a recent activity feed.

    Everything is computed from existing tables (no extra audit table).
    All values are passed as %s parameters.
    """
    now = timezone.now()
    tz = settings.TIME_ZONE
    since_7 = now - timedelta(days=7)
    since_series = now - timedelta(days=ACTIVITY_DAYS)

    totals = fetch_one(
        """
        SELECT
          (SELECT COUNT(*) FROM student) AS students,
          (SELECT COUNT(*) FROM student WHERE isemailverified = TRUE) AS verified_students,
          (SELECT COUNT(*) FROM provider) AS providers,
          (SELECT COUNT(*) FROM opportunity
             WHERE isverified = TRUE AND isactive = TRUE AND closingdate >= %s) AS live_listings,
          (SELECT COUNT(*) FROM opportunity
             WHERE isverified = FALSE AND isactive = TRUE) AS pending_listings,
          (SELECT COUNT(*) FROM application) AS applications,
          (SELECT COUNT(*) FROM application WHERE submittedat >= %s) AS applications_7d,
          (SELECT COUNT(*) FROM bookmark) AS bookmarks,
          (SELECT COUNT(*) FROM bookmark WHERE remindersent = TRUE) AS reminders_sent,
          (SELECT COUNT(*) FROM student WHERE createdat >= %s)
            + (SELECT COUNT(*) FROM provider WHERE createdat >= %s) AS signups_7d,
          (SELECT COUNT(*) FROM auth_user
             WHERE is_staff = FALSE AND last_login >= %s) AS active_users_7d
        """,
        [now, since_7, since_7, since_7, since_7],
    )

    status_rows = fetch_all(
        """
        SELECT status, outcomeresult, COUNT(*) AS n
        FROM application
        GROUP BY status, outcomeresult
        """
    )
    by_status = {"Submitted": 0, "Under Review": 0, "Outcome Received": 0}
    outcomes = {"Successful": 0, "Unsuccessful": 0}
    canonical = {key.lower(): key for key in by_status}
    for row in status_rows:
        # Older rows may differ in letter case ("Under review"), so match loosely.
        key = canonical.get((row["status"] or "").lower(), row["status"])
        by_status[key] = by_status.get(key, 0) + row["n"]
        if row["outcomeresult"] in outcomes:
            outcomes[row["outcomeresult"]] += row["n"]

    # Daily series, bucketed by local (SAST) calendar day.
    daily_rows = fetch_all(
        """
        SELECT day, kind, COUNT(*) AS n FROM (
            SELECT (createdat AT TIME ZONE %s)::date AS day, 'signups' AS kind
              FROM student WHERE createdat >= %s
            UNION ALL
            SELECT (createdat AT TIME ZONE %s)::date, 'signups'
              FROM provider WHERE createdat >= %s
            UNION ALL
            SELECT (submittedat AT TIME ZONE %s)::date, 'applications'
              FROM application WHERE submittedat >= %s
        ) t
        GROUP BY day, kind
        """,
        [tz, since_series, tz, since_series, tz, since_series],
    )
    counts = {(r["day"], r["kind"]): r["n"] for r in daily_rows}
    today = timezone.localdate()
    daily = []
    for offset in range(ACTIVITY_DAYS - 1, -1, -1):
        day = today - timedelta(days=offset)
        daily.append(
            {
                "date": day.isoformat(),
                "signups": counts.get((day, "signups"), 0),
                "applications": counts.get((day, "applications"), 0),
            }
        )

    top_listings = fetch_all(
        """
        SELECT o.opportunityid AS opportunity_id, o.title, pr.companyname AS provider_name,
               (SELECT COUNT(*) FROM application a WHERE a.opportunityid = o.opportunityid) AS applications,
               (SELECT COUNT(*) FROM bookmark b WHERE b.opportunityid = o.opportunityid) AS bookmarks
        FROM opportunity o
        JOIN provider pr ON pr.providerid = o.providerid
        WHERE o.isverified = TRUE
        ORDER BY applications DESC, bookmarks DESC, o.postedat DESC
        LIMIT 5
        """
    )

    recent = fetch_all(
        """
        SELECT kind, at, actor, detail FROM (
            SELECT 'student_signup' AS kind, s.createdat AS at,
                   s.firstname || ' ' || s.lastname AS actor, 'joined as a student' AS detail
              FROM student s
            UNION ALL
            SELECT 'provider_signup', p.createdat, p.companyname, 'joined as a provider'
              FROM provider p
            UNION ALL
            SELECT 'listing_posted', o.postedat, pr.companyname, 'posted ' || o.title
              FROM opportunity o JOIN provider pr ON pr.providerid = o.providerid
            UNION ALL
            SELECT 'application', a.submittedat, s.firstname || ' ' || s.lastname,
                   'applied to ' || o.title
              FROM application a
              JOIN student s ON s.studentid = a.studentid
              JOIN opportunity o ON o.opportunityid = a.opportunityid
            UNION ALL
            SELECT 'outcome', a.outcomereceivedat, pr.companyname,
                   'recorded ' || LOWER(COALESCE(a.outcomeresult, 'an')) || ' outcome for ' || o.title
              FROM application a
              JOIN opportunity o ON o.opportunityid = a.opportunityid
              JOIN provider pr ON pr.providerid = o.providerid
              WHERE a.outcomereceivedat IS NOT NULL
        ) feed
        ORDER BY at DESC
        LIMIT 15
        """
    )

    return Response(
        {
            "generated_at": now,
            "totals": totals,
            "applications_by_status": by_status,
            "outcomes": outcomes,
            "daily": daily,
            "top_listings": top_listings,
            "recent_activity": recent,
        }
    )
