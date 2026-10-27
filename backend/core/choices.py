"""
Single source of truth for every fixed value the API accepts.

frontend/src/lib/constants.js holds the SAME lists. If you change one,
change the other in the same commit, or eligibility matching silently
stops matching (e.g. "Bachelor Degree" vs "Bachelor").
"""

STUDENT_TYPES = ["Tertiary Student", "Graduate"]
GRADUATE_TYPES = ["Undergraduate", "Postgraduate"]

# Must match chk_profile_qualification / chk_opportunity_requiredqualification
UNDERGRAD_QUALIFICATIONS = ["Higher Certificate", "Diploma", "Bachelor"]
POSTGRAD_QUALIFICATIONS = ["Honours", "Masters", "Doctorate"]
ALL_QUALIFICATIONS = UNDERGRAD_QUALIFICATIONS + POSTGRAD_QUALIFICATIONS

# FR1: internship, learnership, graduate programme
OPPORTUNITY_TYPES = ["Internship", "Learnership", "Graduate programme"]

FIELD_OF_STUDY_OPTIONS = [
    "Information Technology",
    "Computer Science",
    "Engineering",
    "Commerce & Accounting",
    "Health Sciences",
    "Law",
    "Humanities & Social Sciences",
    "Natural Sciences",
    "Education",
    "Other",
]

PROVINCES = [
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "Northern Cape",
    "North West",
    "Western Cape",
]

# opportunity.eligibilitytype
ELIGIBILITY_ANY = "Any"
ELIGIBILITY_TYPES = [ELIGIBILITY_ANY, "Tertiary Student", "Graduate"]

# FR5 / FR6: exactly three statuses
STATUS_SUBMITTED = "Submitted"
STATUS_UNDER_REVIEW = "Under Review"
STATUS_OUTCOME_RECEIVED = "Outcome Received"
APPLICATION_STATUSES = [STATUS_SUBMITTED, STATUS_UNDER_REVIEW, STATUS_OUTCOME_RECEIVED]

# application.outcomeresult (only set once status is Outcome Received)
OUTCOME_RESULTS = ["Successful", "Unsuccessful"]

# FR1 / FR4: documents an application cannot go out without.
# Keys must match the document_type values the documents app stores.
REQUIRED_DOCUMENTS = [
    ("cv", "CV"),
    ("matric_certificate", "Matric certificate"),
]

