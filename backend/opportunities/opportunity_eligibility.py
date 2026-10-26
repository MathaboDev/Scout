"""
Decides whether one student's stored profile meets one opportunity's
eligibility criteria. This never looks at anything sent by the frontend;
it only compares the profile row already looked up server-side (via
get_student_profile in core/auth_utils.py) against the opportunity row
from the database.

Every optional check below follows the same shape: if the opportunity
did not set that requirement, it never blocks the student.
"""


def is_eligible(profile, opportunity) -> bool:
    # field_of_study is required on both opportunity and profile (NOT NULL
    # in schema.sql on both sides), so this is always checked, not
    # conditional like the fields below.
    if profile.fieldofstudy != opportunity.field_of_study:
        return False

    # eligibility_type restricts a listing to one student type. "Both" (the
    # default a provider gets if they don't choose) never blocks anyone.
    if opportunity.eligibility_type != "Both":
        if profile.studenttype != opportunity.eligibility_type:
            return False

    if opportunity.minimum_average is not None:
        if profile.academicaverage is None or profile.academicaverage < opportunity.minimum_average:
            return False

    if opportunity.year_level_required is not None:
        # Assumption: only a Tertiary Student has a year level. A Graduate
        # profile's yearlevel is unused/None, so a year-level requirement
        # will exclude every Graduate, which is usually what you want for
        # an internship aimed at current students.
        if profile.yearlevel != opportunity.year_level_required:
            return False

    if opportunity.required_qualification:
        # Assumption: a Tertiary Student has not completed a qualification
        # yet, so a qualification requirement excludes them. If you want
        # Tertiary Students to be eligible for qualification-gated
        # opportunities too, drop this check for studenttype == "Tertiary Student".
        if profile.qualification != opportunity.required_qualification:
            return False

    if opportunity.province:
        if profile.province != opportunity.province:
            return False

    return True