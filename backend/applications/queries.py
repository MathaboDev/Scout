"""
Raw SQL query #2 (FR6 tracking) and #3 (FR5 summary report aggregation),
plus the provider-side applicant reads (FR10). Every query is scoped by
an id that came from the auth token, never from the request body.
"""

from core.sql import fetch_all, fetch_one

_TRACKING_SELECT = """
    SELECT
        a.applicationid        AS application_id,
        a.referencenumber      AS reference_number,
        a.status               AS status,
        a.outcomeresult        AS outcome_result,
        a.submittedat          AS submitted_at,
        a.reviewedat           AS reviewed_at,
        a.outcomereceivedat    AS outcome_received_at,
        a.updatedat            AS updated_at,
        o.opportunityid        AS opportunity_id,
        o.title                AS opportunity_title,
        o.opportunitytype      AS opportunity_type,
        o.closingdate          AS closing_date,
        pr.companyname         AS company_name,
        s.firstname            AS first_name,
        s.lastname             AS last_name,
        s.email                AS email
    FROM application a
    JOIN opportunity o ON o.opportunityid = a.opportunityid
    JOIN provider pr   ON pr.providerid   = o.providerid
    JOIN student s     ON s.studentid     = a.studentid
    WHERE a.studentid = %s
"""


def student_applications(student_id):
    return fetch_all(_TRACKING_SELECT + " ORDER BY a.submittedat DESC", [student_id])


def student_application(student_id, application_id):
    return fetch_one(_TRACKING_SELECT + " AND a.applicationid = %s", [student_id, application_id])


def student_summary_counts(student_id):
    return fetch_one(
        """
        SELECT
            COUNT(*)                                                 AS total,
            COUNT(*) FILTER (WHERE status = 'Submitted')             AS submitted,
            COUNT(*) FILTER (WHERE status = 'Under Review')          AS under_review,
            COUNT(*) FILTER (WHERE status = 'Outcome Received')      AS outcome_received,
            COUNT(*) FILTER (WHERE outcomeresult = 'Successful')     AS successful,
            COUNT(*) FILTER (WHERE outcomeresult = 'Unsuccessful')   AS unsuccessful
        FROM application
        WHERE studentid = %s
        """,
        [student_id],
    )


_APPLICANT_SELECT = """
    SELECT
        a.applicationid          AS application_id,
        a.referencenumber        AS reference_number,
        a.status                 AS status,
        a.outcomeresult          AS outcome_result,
        a.submittedat            AS submitted_at,
        a.reviewedat             AS reviewed_at,
        a.outcomereceivedat      AS outcome_received_at,
        a.studentid              AS student_id,
        o.opportunityid          AS opportunity_id,
        o.title                  AS opportunity_title,
        s.firstname              AS first_name,
        s.lastname               AS last_name,
        s.email                  AS email,
        p.studenttype            AS student_type,
        p.institution            AS institution,
        p.fieldofstudy           AS field_of_study,
        p.yearlevel              AS year_level,
        p.graduatetype           AS graduate_type,
        p.qualification          AS qualification,
        p.academicaverage        AS academic_average,
        p.province               AS province
    FROM application a
    JOIN opportunity o ON o.opportunityid = a.opportunityid
    JOIN student s     ON s.studentid     = a.studentid
    LEFT JOIN profile p ON p.studentid    = a.studentid
    WHERE o.providerid = %s
"""


def provider_applicants(provider_id, opportunity_id):
    return fetch_all(
        _APPLICANT_SELECT + " AND o.opportunityid = %s ORDER BY a.submittedat DESC",
        [provider_id, opportunity_id],
    )


def provider_applicant(provider_id, application_id):
    return fetch_one(_APPLICANT_SELECT + " AND a.applicationid = %s", [provider_id, application_id])


def student_bookmarks(student_id):
    return fetch_all(
        """
        SELECT
            b.bookmarkid            AS bookmark_id,
            b.savedat               AS saved_at,
            o.opportunityid         AS opportunity_id,
            o.title                 AS title,
            o.opportunitytype       AS opportunity_type,
            o.province              AS province,
            o.closingdate           AS closing_date,
            (o.closingdate < NOW()) AS is_closed,
            pr.companyname          AS company_name
        FROM bookmark b
        JOIN opportunity o ON o.opportunityid = b.opportunityid
        JOIN provider pr   ON pr.providerid   = o.providerid
        WHERE b.studentid = %s
          AND o.isactive = TRUE
        ORDER BY o.closingdate ASC
        """,
        [student_id],
    )

