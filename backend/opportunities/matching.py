"""
FR2: eligibility matching (raw SQL query #1).

One query powers both views:
  - "eligible" view: only rows where ELIGIBLE_PREDICATE is true
  - "all" view:      every verified, active, open row, each one flagged
                     with `eligible` so the UI can show a badge

The student's profile is joined in the database from the authenticated
student id. Nothing about eligibility ever comes from the browser.

Rules (every criterion the provider left NULL is "no restriction"):
  field of study     must equal the student's field of study
  opportunity type   must equal the student's opportunity preference
  eligibility type   'Any', or equal to the student's type
  minimum average    student's average >= minimum
  year level         tertiary students only, year >= required year
  qualification      student's qualification is the required one OR HIGHER
                     (a Masters graduate qualifies for a Bachelor listing).
                     Order: Higher Certificate < Diploma < Bachelor < Honours
                     < Masters < Doctorate, taken from core/choices.py.
  province           student's province == listing province
"""

from core.choices import ALL_QUALIFICATIONS
from core.sql import fetch_all, fetch_one

# SQL array of qualifications from lowest to highest. Built from our own
# fixed list in core/choices.py (never from user input), so it is safe to
# put in the query text. array_position() turns a qualification into its
# rank (1 = Higher Certificate ... 6 = Doctorate).
_QUAL_ORDER = "ARRAY[" + ", ".join(f"'{q}'" for q in ALL_QUALIFICATIONS) + "]::text[]"

ELIGIBLE_PREDICATE = """
    COALESCE((
        p.profileid IS NOT NULL
        AND o.fieldofstudy = p.fieldofstudy
        AND o.opportunitytype = p.opportunitypreference
        AND (o.eligibilitytype = 'Any' OR o.eligibilitytype = p.studenttype)
        AND (o.minimumaverage IS NULL OR p.academicaverage >= o.minimumaverage)
        AND (
            o.yearlevelrequired IS NULL
            OR (p.studenttype = 'Tertiary Student' AND p.yearlevel >= o.yearlevelrequired)
        )
        AND (
            o.requiredqualification IS NULL
            OR array_position({qual}, p.qualification::text)
               >= array_position({qual}, o.requiredqualification::text)
        )
        AND (o.province IS NULL OR o.province = p.province)
    ), FALSE)
""".replace("{qual}", _QUAL_ORDER)

_SELECT = f"""
    SELECT
        o.opportunityid          AS opportunity_id,
        o.title                  AS title,
        o.opportunitytype        AS opportunity_type,
        o.fieldofstudy           AS field_of_study,
        o.province               AS province,
        o.description            AS description,
        o.closingdate            AS closing_date,
        o.postedat               AS posted_at,
        o.minimumaverage         AS minimum_average,
        o.yearlevelrequired      AS year_level_required,
        o.requiredqualification  AS required_qualification,
        o.eligibilitytype        AS eligibility_type,
        pr.companyname           AS company_name,
        {ELIGIBLE_PREDICATE}     AS eligible,
        EXISTS (
            SELECT 1 FROM bookmark b
            WHERE b.opportunityid = o.opportunityid AND b.studentid = %s
        )                        AS bookmarked,
        EXISTS (
            SELECT 1 FROM application a
            WHERE a.opportunityid = o.opportunityid AND a.studentid = %s
        )                        AS applied,
        (o.closingdate < NOW())  AS is_closed
    FROM opportunity o
    JOIN provider pr ON pr.providerid = o.providerid
    LEFT JOIN profile p ON p.studentid = %s
    WHERE o.isactive = TRUE
      AND o.isverified = TRUE
"""


def list_opportunities(student_id, eligible_only):
    # FR2 / FR9: expired listings never appear in either browse view.
    sql = _SELECT + " AND o.closingdate >= NOW()"
    if eligible_only:
        sql += f" AND {ELIGIBLE_PREDICATE}"
    sql += " ORDER BY o.closingdate ASC"
    return fetch_all(sql, [student_id, student_id, student_id])


def get_opportunity(student_id, opportunity_id):
    """
    Single listing for the details / apply screens. Closed listings are
    still returned (flagged is_closed) so a bookmark that has expired
    can show "this closed on ..." instead of a 404.
    """
    sql = _SELECT + " AND o.opportunityid = %s"
    return fetch_one(sql, [student_id, student_id, student_id, opportunity_id])

