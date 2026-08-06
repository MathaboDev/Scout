backend/
├── manage.py                 # you'll run commands through this — python manage.py runserver etc.
├── requirements.txt            # every Python package the project needs
├── .env.example                  # template for secrets — copy to .env, fill in real values, never commit .env
│
├── scout_backend/                 # PROJECT CONFIG — not a feature, the shell that holds everything together
│   ├── settings.py                  # DB connection, installed apps, security settings
│   ├── urls.py                        # top-level router — points to each app's own urls.py
│   └── wsgi.py                          # tells a production server how to run this app (auto-generated, don't touch)
│
├── core/                           # SHARED CODE — used by more than one app, belongs to none of them
│   ├── db_utils.py                   # wraps raw SQL calls, enforces parameterized queries
│   └── auth_utils.py                   # token → student profile lookup (this is what makes eligibility checks secure)
│
├── students/                       # APP — FR1, FR8
├── opportunities/                   # APP — FR2, FR9
├── applications/                     # APP — FR3–FR6
├── notifications/                     # APP — FR7
└── providers_admin/                     # APP — FR10

