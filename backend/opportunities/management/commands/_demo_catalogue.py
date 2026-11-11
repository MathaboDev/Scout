"""
Extra demo data used by seed_demo: more providers, listings in every field
of study, and two more test students.

The leading underscore stops Django treating this file as a command.
All companies are fictional. Values must match core/choices.py.
"""


def listing(title, opportunity_type, field, description, days, **criteria):
    """One listing. `days` = days from now until it closes.
    `criteria` may set minimum_average, year_level_required,
    required_qualification, eligibility_type (default "Any"), province."""
    return {
        "title": title,
        "opportunity_type": opportunity_type,
        "field_of_study": field,
        "description": description,
        "days": days,
        "eligibility_type": criteria.pop("eligibility_type", "Any"),
        **criteria,
    }


# login email -> company, plus that company's listings
PROVIDERS = [
    {
        "email": "provider@kopano.demo",
        "company_name": "Kopano Analytics",
        "industry": "Data & Analytics",
        "province": "Gauteng",
        "listings": [
            listing("Junior data engineer intern", "Internship", "Computer Science",
                    "Build data pipelines that feed dashboards for retail clients.", 18,
                    minimum_average=60),
            listing("Machine learning graduate programme", "Graduate programme", "Computer Science",
                    "Two rotations across our forecasting and NLP teams.", 45,
                    eligibility_type="Graduate", required_qualification="Honours"),
            # Eligible for the demo student (IT internship, no restrictions)
            listing("Web analytics intern", "Internship", "Information Technology",
                    "Set up tracking and build reports for client websites. Remote-friendly.", 14),
            # NOT eligible for Mathabo: Gauteng only, she is in the Western Cape
            listing("Johannesburg IT helpdesk intern", "Internship", "Information Technology",
                    "Support staff at our Sandton office with laptops, accounts and printers.", 23,
                    province="Gauteng"),
            # NOT eligible for Mathabo: needs 4th year, she is in 3rd year
            listing("Final-year systems developer intern", "Internship", "Information Technology",
                    "Build internal tools with our platform team. For final-year students.", 27,
                    eligibility_type="Tertiary Student", year_level_required=4),
            # IT graduate programmes at every qualification level, for the
            # Masters demo student (Mathabo Nongwe, 71% average)
            listing("Junior IT graduate programme", "Graduate programme", "Information Technology",
                    "A 12-month programme across our support, networks and cloud teams.", 34,
                    eligibility_type="Graduate", required_qualification="Diploma"),
            listing("Data platform graduate programme", "Graduate programme", "Information Technology",
                    "Design and run the data warehouse behind our client dashboards.", 38,
                    eligibility_type="Graduate", required_qualification="Honours", minimum_average=70),
            listing("Cybersecurity graduate programme", "Graduate programme", "Information Technology",
                    "Threat monitoring, incident response and security reviews for clients.", 42,
                    eligibility_type="Graduate", required_qualification="Masters"),
            listing("Applied ML graduate programme", "Graduate programme", "Information Technology",
                    "Build and deploy forecasting models with our data science team.", 46,
                    eligibility_type="Graduate", required_qualification="Masters", minimum_average=75),
            listing("AI research fellowship", "Graduate programme", "Information Technology",
                    "A two-year research post publishing on applied machine learning.", 58,
                    eligibility_type="Graduate", required_qualification="Doctorate"),
        ],
    },
    {
        "email": "provider@mzansirail.demo",
        "company_name": "Mzansi Rail & Power Engineering",
        "industry": "Engineering",
        "province": "Gauteng",
        "listings": [
            listing("Civil engineering intern", "Internship", "Engineering",
                    "Join site inspections and help prepare structural reports.", 21,
                    minimum_average=60, year_level_required=3),
            listing("Electrical engineering learnership", "Learnership", "Engineering",
                    "A 12-month NQF 5 learnership on substation maintenance.", 35,
                    eligibility_type="Tertiary Student"),
            listing("Engineer-in-training graduate programme", "Graduate programme", "Engineering",
                    "Rotate through design, project and site teams towards ECSA registration.", 50,
                    eligibility_type="Graduate", required_qualification="Bachelor", minimum_average=65),
        ],
    },
    {
        "email": "provider@indaba.demo",
        "company_name": "Indaba Ledger Accountants",
        "industry": "Financial Services",
        "province": "Gauteng",
        "listings": [
            listing("Audit trainee intern", "Internship", "Commerce & Accounting",
                    "Support audit teams at small and medium clients.", 12,
                    minimum_average=60),
            listing("SAICA trainee accountant programme", "Graduate programme", "Commerce & Accounting",
                    "A three-year training contract towards your CA(SA).", 40,
                    eligibility_type="Graduate", required_qualification="Honours", minimum_average=60),
            listing("Bookkeeping learnership", "Learnership", "Commerce & Accounting",
                    "Learn payroll, VAT and month-end close for small businesses.", 30),
            # IT, but a learnership: not eligible for the demo student (wants internships)
            listing("IT systems learnership", "Learnership", "Information Technology",
                    "Look after our accounting software, backups and user accounts.", 26),
        ],
    },
    {
        "email": "provider@umoya.demo",
        "company_name": "Umoya Community Health",
        "industry": "Healthcare",
        "province": "KwaZulu-Natal",
        "listings": [
            listing("Community health intern", "Internship", "Health Sciences",
                    "Run screening days and health-education talks at local clinics.", 16,
                    province="KwaZulu-Natal"),
            listing("Pharmacy assistant learnership", "Learnership", "Health Sciences",
                    "Work in a dispensary while completing your Pharmacist Assistant qualification.", 33),
            listing("Public health graduate programme", "Graduate programme", "Health Sciences",
                    "Analyse clinic data and help design outreach programmes.", 55,
                    eligibility_type="Graduate", required_qualification="Bachelor"),
            # Eligible for the demo student
            listing("Health records IT intern", "Internship", "Information Technology",
                    "Help move paper patient records to our new digital system.", 9),
        ],
    },
    {
        "email": "provider@lekgotla.demo",
        "company_name": "Lekgotla Legal Chambers",
        "industry": "Legal Services",
        "province": "Gauteng",
        "listings": [
            listing("Legal research intern", "Internship", "Law",
                    "Research case law and draft memos for our litigation team.", 19,
                    minimum_average=65, year_level_required=3),
            listing("Candidate attorney programme", "Graduate programme", "Law",
                    "A two-year articles programme across commercial and labour law.", 60,
                    eligibility_type="Graduate", required_qualification="Bachelor", minimum_average=60),
            listing("Paralegal learnership", "Learnership", "Law",
                    "Learn legal admin, filing and client intake at our community office.", 27,
                    eligibility_type="Tertiary Student"),
        ],
    },
    {
        "email": "provider@sizwe.demo",
        "company_name": "Sizwe Youth Research Institute",
        "industry": "Non-profit Research",
        "province": "Eastern Cape",
        "listings": [
            listing("Social research intern", "Internship", "Humanities & Social Sciences",
                    "Run interviews and code survey data on youth unemployment.", 22),
            listing("Communications intern", "Internship", "Humanities & Social Sciences",
                    "Write articles, newsletters and social posts about our research.", 11,
                    province="Eastern Cape"),
            listing("Policy analyst graduate programme", "Graduate programme", "Humanities & Social Sciences",
                    "Turn research into briefs for local and provincial government.", 48,
                    eligibility_type="Graduate", required_qualification="Honours"),
        ],
    },
    {
        "email": "provider@fynbos.demo",
        "company_name": "Fynbos BioLabs",
        "industry": "Biotechnology",
        "province": "Western Cape",
        "listings": [
            listing("Laboratory assistant intern", "Internship", "Natural Sciences",
                    "Prepare samples and run routine tests in our plant-extract lab.", 17,
                    minimum_average=65),
            listing("Environmental monitoring learnership", "Learnership", "Natural Sciences",
                    "Collect and analyse water samples across the Western Cape.", 29,
                    province="Western Cape"),
            listing("Research scientist graduate programme", "Graduate programme", "Natural Sciences",
                    "Join a product-development team working on natural skincare compounds.", 52,
                    eligibility_type="Graduate", required_qualification="Masters"),
        ],
    },
    {
        "email": "provider@brightfutures.demo",
        "company_name": "Bright Futures Schools Trust",
        "industry": "Education",
        "province": "Limpopo",
        "listings": [
            listing("Teaching assistant intern", "Internship", "Education",
                    "Support Grade 4–7 maths and English teachers in our partner schools.", 15),
            listing("Early childhood development learnership", "Learnership", "Education",
                    "Train as an ECD practitioner at one of our community crèches.", 31,
                    province="Limpopo"),
            listing("Foundation phase teacher programme", "Graduate programme", "Education",
                    "A paid first-year teaching post with a mentor teacher.", 44,
                    eligibility_type="Graduate", required_qualification="Bachelor"),
        ],
    },
    {
        "email": "provider@karoo.demo",
        "company_name": "Karoo Craft Studios",
        "industry": "Creative & Media",
        "province": "Northern Cape",
        "listings": [
            listing("Graphic design intern", "Internship", "Other",
                    "Design packaging and social content for local craft brands.", 13),
            listing("Hospitality and events learnership", "Learnership", "Other",
                    "Help plan and run markets, festivals and guest stays.", 24),
            # Eligible for the demo student
            listing("E-commerce website intern", "Internship", "Information Technology",
                    "Keep our online shop running and add new product pages.", 20,
                    minimum_average=60),
        ],
    },
]


# Demo student for the file-upload and eligibility-matching walkthrough.
# Profile is complete, but she has NO documents, so applying is blocked
# until she uploads a CV and matric certificate (FR4).
#
# She is a current Diploma in IT student, so she is stored as a
# "Tertiary Student". The schema only allows `qualification` for
# graduates (chk_profile_studenttype_fields), so "Diploma" is not stored.
#
# Expected result in the "Eligible" view (closing dates permitting):
#   eligible  : Software developer intern (min 65, year 2+), IT support intern
#               (Western Cape), Web analytics intern, Health records IT intern,
#               E-commerce website intern (min 60)
#   excluded  : Cloud engineering intern (min 80 > 68), Graduate developer
#               programme (graduates only), Data analyst intern (Computer
#               Science), IT systems learnership (she wants internships),
#               Johannesburg IT helpdesk intern (Gauteng only), Final-year
#               systems developer intern (needs 4th year), UX design intern
#               (not verified, hidden from everyone)
MATHABO = {
    "email": "mathabo@scout.demo",
    "first_name": "Mathabo",
    "last_name": "Mabunu",
    "profile": {
        "student_type": "Tertiary Student",
        "year_level": 3,
        "institution": "Cape Peninsula University of Technology",
        "field_of_study": "Information Technology",
        "academic_average": 68,
        "opportunity_preference": "Internship",
        "province": "Western Cape",
    },
}

# Demo student for the "qualification or higher" rule. A Masters graduate
# sees graduate listings that ask for a Diploma, Bachelor, Honours or
# Masters, but not one that asks for a Doctorate. No documents uploaded.
#
# Expected IT graduate programmes in her "Eligible" view:
#   eligible  : Junior IT graduate programme (Diploma), Graduate developer
#               programme (Bachelor), Data platform graduate programme
#               (Honours, min 70), Cybersecurity graduate programme (Masters)
#   excluded  : AI research fellowship (Doctorate > Masters), Applied ML
#               graduate programme (Masters, but min 75 > 71), every
#               internship (she wants a graduate programme)
MATHABO_NONGWE = {
    "email": "mathabo.nongwe@scout.demo",
    "first_name": "Mathabo",
    "last_name": "Nongwe",
    "profile": {
        "student_type": "Graduate",
        "graduate_type": "Postgraduate",
        "qualification": "Masters",
        "institution": "University of Cape Town",
        "field_of_study": "Information Technology",
        "academic_average": 71,
        "opportunity_preference": "Graduate programme",
        "province": "Western Cape",
    },
}

# Accounts that `seed_demo --reset-mathabo` puts back to their seeded state.
RESETTABLE_STUDENTS = [MATHABO, MATHABO_NONGWE]

# Extra students so other fields can be tested from the student side too.
STUDENTS = [
    MATHABO,
    MATHABO_NONGWE,
    {
        "email": "graduate@scout.demo",
        "first_name": "Naledi",
        "last_name": "Khumalo",
        "profile": {
            "student_type": "Graduate",
            "graduate_type": "Postgraduate",
            "qualification": "Honours",
            "institution": "University of Johannesburg",
            "field_of_study": "Commerce & Accounting",
            "academic_average": 68,
            "opportunity_preference": "Graduate programme",
            "province": "Gauteng",
        },
    },
    {
        "email": "health@scout.demo",
        "first_name": "Sipho",
        "last_name": "Dlamini",
        "profile": {
            "student_type": "Tertiary Student",
            "year_level": 3,
            "institution": "Durban University of Technology",
            "field_of_study": "Health Sciences",
            "academic_average": 74,
            "opportunity_preference": "Internship",
            "province": "KwaZulu-Natal",
        },
    },
]


# Demo applicants for the PROVIDER screens (ByteWorks, provider@byteworks.demo),
# one at every stage so the dashboard, applicant list and status flow have
# something to show. Each tuple: listing title, status, outcome, days since
# applied. Statuses must match core/choices.py.
_IT_STUDENT = {
    "student_type": "Tertiary Student",
    "field_of_study": "Information Technology",
    "opportunity_preference": "Internship",
}
DEMO_APPLICANTS = [
    {
        "email": "lerato.nkosi@scout.demo", "first_name": "Lerato", "last_name": "Nkosi",
        "profile": {**_IT_STUDENT, "institution": "University of Cape Town", "academic_average": 78,
                    "province": "Western Cape", "year_level": 3},
        "application": ("Software developer intern", "Under Review", None, 6),
    },
    {
        "email": "thabo.mokoena@scout.demo", "first_name": "Thabo", "last_name": "Mokoena",
        "profile": {**_IT_STUDENT, "institution": "Tshwane University of Technology", "academic_average": 69,
                    "province": "Gauteng", "year_level": 2},
        "application": ("Software developer intern", "Submitted", None, 1),
    },
    {
        "email": "ayesha.patel@scout.demo", "first_name": "Ayesha", "last_name": "Patel",
        "profile": {**_IT_STUDENT, "institution": "Stellenbosch University", "academic_average": 84,
                    "province": "Western Cape", "year_level": 3},
        "application": ("Cloud engineering intern", "Outcome Received", "Successful", 14),
    },
    {
        "email": "sibusiso.zulu@scout.demo", "first_name": "Sibusiso", "last_name": "Zulu",
        "profile": {**_IT_STUDENT, "institution": "Cape Peninsula University of Technology", "academic_average": 71,
                    "province": "Western Cape", "year_level": 2},
        "application": ("IT support intern", "Outcome Received", "Unsuccessful", 10),
    },
    {
        "email": "kagiso.molefe@scout.demo", "first_name": "Kagiso", "last_name": "Molefe",
        "profile": {"student_type": "Graduate", "graduate_type": "Undergraduate", "qualification": "Bachelor",
                    "field_of_study": "Information Technology", "opportunity_preference": "Graduate programme",
                    "institution": "University of the Witwatersrand", "academic_average": 74, "province": "Gauteng"},
        "application": ("Graduate developer programme", "Under Review", None, 8),
    },
    {
        "email": "zanele.mthembu@scout.demo", "first_name": "Zanele", "last_name": "Mthembu",
        "profile": {"student_type": "Tertiary Student", "field_of_study": "Computer Science",
                    "opportunity_preference": "Internship", "institution": "University of KwaZulu-Natal",
                    "academic_average": 76, "province": "KwaZulu-Natal", "year_level": 3},
        "application": ("Data analyst intern", "Submitted", None, 2),
    },
]


# Listings for the admin verification demo. seed_demo posts them as
# UNVERIFIED, so they wait in the admin queue and no student can see them.
# Each tuple: provider login email, listing.
#
# Built for John, the student registered live in the demo:
#   Tertiary Student, CPUT, Information Technology, Western Cape,
#   year 2, 72% average, wants an Internship.
# The first four match him, so each one appears in his "Eligible" view as
# soon as the admin verifies it. The last one does not (Gauteng only), to
# show that verifying a listing does not mean every student sees it.
#
# To put them back in the queue after a rehearsal:
#     python manage.py seed_demo --reset-queue
PENDING_LISTINGS = [
    ("provider@byteworks.demo",
     listing("Junior QA tester intern", "Internship", "Information Technology",
             "Write test cases and find bugs in our client web apps before each release.", 30)),
    ("provider@kopano.demo",
     listing("Dashboard developer intern", "Internship", "Information Technology",
             "Build Power BI dashboards for retail clients with our analytics team.", 26,
             minimum_average=70)),
    ("provider@fynbos.demo",
     listing("Lab systems IT intern", "Internship", "Information Technology",
             "Look after the lab's computers, network and sample-tracking software.", 21,
             eligibility_type="Tertiary Student", province="Western Cape")),
    ("provider@umoya.demo",
     listing("Mobile app developer intern", "Internship", "Information Technology",
             "Help build the Android app our nurses use to book clinic visits.", 33,
             year_level_required=2, minimum_average=65)),
    # NOT eligible for John: Gauteng only, he is in the Western Cape
    ("provider@mzansirail.demo",
     listing("Network support intern (Johannesburg)", "Internship", "Information Technology",
             "Support the network and radio systems at our Johannesburg depot.", 28,
             province="Gauteng")),
]
