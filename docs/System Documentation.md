# Scout
## System Documentation

Student opportunity-matching platform for South African students and graduates

| | |
|---|---|
| Project lead | Mathabo Mabunu |
| Team size | 6 second-year students |
| Version | 2.0 (final submission, November 2026) |
| Stack | React (Vite) and Tailwind, Django REST Framework, PostgreSQL on Supabase, Brevo SMTP |

> **How to use this file.** It replaces the text of the System Documentation PDF section by section, keeping the same numbering. Paste each section into the source document and re-export. Figures are not included here: the seven diagrams must be redrawn, and `docs/Diagram Reference Verified.html` shows the target for each one.

---

## Contents and team responsibilities

Each section of this document was written and is owned by one team member. Questions on a section go to its owner.

| Section | Content | Owner |
|---|---|---|
| 1 | Introduction, requirements, user stories, system requirements | Member 2: [Name] |
| 2 | Use case diagram and actor descriptions | Member 2: [Name] |
| 3 | Application architecture, languages and technology choices | Mathabo Mabunu (project lead) |
| 4 | Activity diagrams | Member 3: [Name] |
| 5 | Class diagram and backend module descriptions | Member 4: [Name] |
| 6 | Database design: ERD, tables, constraints | Member 5: [Name] |
| Appendix A | SQL used (schema.sql) | Member 5: [Name] |
| 7 | Frontend structure and user interface components | Member 6: [Name] |
| 8 | Setup, deployment, maintenance and troubleshooting | Mathabo Mabunu (project lead) |
| 9 | Testing summary and known limitations | Member 1: [Name] |

Replace the bracketed names with the real member names before submitting. Project lead duties across the whole project: GitHub repository management, contribution rules, code review of every push, the Supabase database, and the project shell and core modules.

---

## 1. Introduction and system requirements

Scout is a web platform that helps tertiary students and graduates find opportunities they qualify for, apply with one reusable profile, and track outcomes in one place. Providers post opportunities, students browse them, and a platform administrator verifies every listing before students see it. The system exists because students told us they re-enter the same documents repeatedly, scroll past listings they cannot apply for, and check several portals for outcomes.

**Status key.** *Built* means working in the current code. *Built, untested* means implemented with no recorded test. *Partial* means implemented with a stated gap. *Planned* means not implemented.

### 1.1 Functional requirements

**Account and access**

| ID | Requirement | Status |
|---|---|---|
| FR1 | A student registers with full name, email and a password of at least 10 characters. A provider registers with company name, email, password, industry, province and an optional phone number. The email must be unique across students, providers and auth users. The account is created inactive. | Built |
| FR2 | The system emails a six-digit code on registration. The correct code activates the account and signs the user in immediately. The code is valid for 5 minutes, allows 5 entry attempts and 3 resends, with a 60-second cooldown. Only a salted hash of the code is stored. | Built |
| FR3 | A verified user signs in with email and password alone. No code is required on login. An unverified account that supplies the correct password is told to complete verification rather than being given a generic credentials error. | Built |
| FR4 | A user signs out. The server deletes the authentication token so it cannot be reused. | Built |
| FR5 | Three roles exist: student, provider and administrator. Each has its own routes and permitted actions, enforced on the server. Requesting another user's record returns not-found, so users cannot discover each other's data. | Built |

**Profile and documents**

| ID | Requirement | Status |
|---|---|---|
| FR6 | A student records institution, field of study, academic average, opportunity preference and province. A Tertiary Student adds year of study. A Graduate adds graduate type and qualification. The database rejects inconsistent combinations. | Built |
| FR7 | The profile holds professional information only. ID numbers, home address, banking details, health information, race and salary expectations are never collected. | Built |
| FR8 | A student uploads a CV and matric certificate (both required before applying), plus optional transcripts, proof of registration and supporting documents. Accepted types are PDF, JPG, JPEG and PNG up to 5 MB. Replacing a document retires the previous version instead of deleting it. | Built |
| FR9 | Files are stored privately in Supabase Storage and reached through signed links that expire after one hour. The storage key never reaches the browser. | Built |

**Opportunities and matching**

| ID | Requirement | Status |
|---|---|---|
| FR10 | The server calculates eligibility from the student's stored profile, never from values sent by the browser. The full rule is in section 3.4. | Built |
| FR11 | A student switches between an Eligible view and an All view. Both exclude unverified, inactive and expired listings, and both are ordered by closing date. In the All view each listing is flagged with whether the student qualifies. | Built |
| FR12 | Each listing shows whether the student has already bookmarked or applied to it. | Built |

**Applying**

| ID | Requirement | Status |
|---|---|---|
| FR13 | The system pre-fills an application from the stored profile and attaches the student's active documents. A review screen is mandatory. Nothing is submitted until the student confirms on that screen. | Built |
| FR14 | On confirmation the system creates the application with status Submitted and a unique reference number in the form `SCOUT-XXXXXXXXXX`. | Built |
| FR15 | An application is refused when the opportunity has closed, the student is not eligible, the profile is incomplete, a required document is missing, or the student has already applied. | Built |
| FR16 | When a required document is missing, the system lists what is missing, blocks submission, and notifies the student in the application and by email with a link back to the same review screen. The alert is sent once, so reopening the screen does not send repeat emails. | Built |
| FR17 | Each submission produces a receipt with the student's name, opportunity, provider, submission date, reference number and status. It appears on the dashboard and is emailed. | Built |
| FR18 | A student downloads a PDF summary of all applications, with totals by status and every reference number. | Built |

**Tracking and notifications**

| ID | Requirement | Status |
|---|---|---|
| FR19 | A dashboard lists every application with its status: Submitted, Under Review, or Outcome Received. It refreshes automatically every 15 seconds. | Built |
| FR20 | A student saves opportunities to a watchlist and removes them again. The watchlist shows closing dates. Saving the same opportunity twice has no additional effect. | Built |
| FR21 | The system sends a reminder three days before a bookmarked opportunity closes, once per bookmark. Students who have already applied are skipped. | Partial. The reminder is a scheduled command. No scheduler is configured, so reminders do not currently go out unattended. |
| FR22 | The student is notified when an application is submitted, a document is missing, a status changes, an outcome is recorded, and a bookmarked deadline approaches. Notifications appear in the application and, where appropriate, by email. The student can mark one or all as read. | Built |

**Provider**

| ID | Requirement | Status |
|---|---|---|
| FR23 | A provider creates, edits and removes its own listings, and may set optional eligibility criteria. Every provider query is restricted to that provider's own records. | Built, untested |
| FR24 | A new listing is created unverified and is not visible to students until an administrator verifies it. | Built, untested |
| FR25 | A provider sees applicants for its own listings, each with their professional profile and which required documents are attached. File links are not exposed to providers. | Built, untested |
| FR26 | A provider moves an application to Under Review and then records an outcome of Successful or Unsuccessful. Status only moves forward, and an outcome once recorded cannot be changed. | Built, untested |

**Administration and privacy**

| ID | Requirement | Status |
|---|---|---|
| FR27 | Every new listing enters a verification queue. An administrator reviews the queue, opens a listing's full detail and verifies it. | Built, untested |
| FR28 | Verification makes the listing visible to matching students and records the verifying administrator against the listing as an audit trail. A listing already verified cannot be verified again. | Built, untested |
| FR29 | Providers see only a student's professional profile. A student can view everything stored about them through the profile and documents screens. | Built |
| FR30 | POPIA also grants rights to restrict and delete personal data. | Partial. No self-service mechanism. Deletion is a manual database operation. |

**Not implemented**

| Item | Note |
|---|---|
| Password reset | A user who forgets a password cannot recover the account without manual help |
| Administrator user management | No interface to list, edit or deactivate users |
| Listing or account suspension | No way to suspend content that breaches platform rules |
| Platform activity monitoring | No activity dashboard |

### 1.2 Non-functional requirements

| ID | Requirement | How it is met | Status |
|---|---|---|---|
| NFR1 | Credential security | Passwords hashed by Django. Verification codes and resend tokens stored as salted hashes. Neither appears in logs or API responses. Secrets live in environment files excluded from version control. | Built |
| NFR2 | Transport and storage security | Database connection requires SSL. HTTPS redirection and secure cookies enabled whenever debug is off. Documents are private, reached only through signed links expiring after one hour. | Built |
| NFR3 | Authentication hardening | Verification and resend limited to 5 requests per minute per client. Anonymous requests 20 per minute, authenticated 120 per minute. Code entry limited to 5 attempts, 3 resends, 60-second cooldown. | Partial. Tokens do not expire. A token stays valid until logout. |
| NFR4 | Input and query safety | All raw SQL uses parameter placeholders. Fixed value lists in query text come from server-side constants, never user input. Uploads checked for type and size. Internal errors logged, never echoed to the client. | Built |
| NFR5 | Data integrity | Unique constraints prevent duplicate applications and bookmarks at database level, not interface level. Profile field combinations enforced by database constraints. Status transitions validated server-side and cannot move backwards. | Built |
| NFR6 | Auditability | Each verified listing records which administrator verified it. Every provider status change is written to the application log with the provider and a timestamp. | Partial. The status-change audit is a log file, not a queryable table. |
| NFR7 | Notification timeliness | The dashboard polls every 15 seconds, so a provider's change reaches the student within roughly that interval. Emails are sent as soon as the triggering action completes. A mail failure is logged and never blocks the underlying action. | Built |
| NFR8 | Usability | Works across desktop and tablet widths. Validation runs in the browser first, with server errors shown in one plain-language message. Loading states shown while fetching. Animations respect the reduced-motion setting. | Built |
| NFR9 | Performance | Listing results come from a single database query, paginated at 20 records per page. | Built, untested. Two-second load and 500 concurrent users are design targets, not measured results. |
| NFR10 | Reliability | Managed hosting for database, file storage and email. | Built, untested. The 99 percent uptime target has not been measured. |
| NFR11 | Maintainability | Backend split into focused Django applications. Role logic in one shared permissions module. Frontend component-based with a single module for all API calls. | Built |
| NFR12 | Schema ownership | Application tables defined by hand in `schema.sql`. Django models marked unmanaged so Django never alters the schema. | Partial. `schema.sql` is missing the `provider.authuserid` column the live database and code both use. |

### 1.3 User stories

| # | Story | Acceptance |
|---|---|---|
| US1 | As a student, I want to register and confirm my email with a code, so that my account is protected and I can be contacted about applications. | Registration creates an inactive account and emails a six-digit code. The correct code activates the account and signs me in. |
| US2 | As a student, I want to sign in with just my email and password after the first time, so that getting back in is quick. | Login requires no code. An unverified account is told to verify first. |
| US3 | As a student, I want to enter my academic details and upload my CV and matric certificate once, so that I do not retype them for every application. | Profile and documents are saved once and reused. Replacing a document retires the old version. |
| US4 | As a student, I want to see only the opportunities I actually qualify for, so that I do not waste time on listings that will reject me. | The Eligible view applies every criterion the provider set. The All view shows everything live, flagged with whether I qualify. |
| US5 | As a student, I want the application form filled in from my profile with a review screen before it sends, so that I stay in control of what is submitted. | Nothing is submitted until I confirm on the review screen. I get a reference number afterwards. |
| US6 | As a student, I want to be told when a required document is missing, with a link back to where I was, so that I can finish without starting over. | Review lists what is missing, blocks submission, and sends one alert with a link back to the same screen. |
| US7 | As a student, I want all my applications and their statuses on one dashboard, so that I do not check several company portals. | The dashboard lists every application and refreshes every 15 seconds when a provider changes a status. |
| US8 | As a student, I want to save opportunities I am not ready for and be reminded before they close, so that I do not miss a deadline. | Bookmarks appear on the watchlist with closing dates. A reminder is sent three days before closing, once per bookmark. |
| US9 | As a student, I want to download a summary of everything I applied for, so that I have a record for bursary or university paperwork. | A PDF lists every application with status totals and reference numbers. |
| US10 | As a provider, I want to post a listing and see who applied, so that I can fill the position without building my own portal. | I create listings under my own account, see only my own, and view each applicant's professional profile and attached documents. |
| US11 | As a provider, I want to record an outcome so the student is told automatically, so that I do not send individual emails. | Setting an outcome to Successful or Unsuccessful notifies the student in the application and by email. |
| US12 | As an administrator, I want to check listings before students see them, so that unverified content never reaches students. | New listings enter a queue. Verifying one makes it visible and records me against it. |

### 1.4 System requirements

| Component | Requirement |
|---|---|
| End user | Any current browser (Chrome, Edge, Firefox, Safari), an internet connection, and an email address they can access, since an account cannot be activated without receiving the verification code |
| Developer machine | Node.js 18 or newer, Python 3.11 or newer, Git, a code editor |
| Backend libraries | Django 6.1, djangorestframework 3.18, psycopg2-binary, python-dotenv, django-cors-headers, requests, reportlab (PDF summary), pillow |
| Frontend libraries | React, Vite, Tailwind CSS, react-router-dom, lucide-react |
| External services | Supabase project (PostgreSQL and Storage), Brevo account for SMTP |
| Hosting | Static hosting for the frontend, a Python host for Django, Supabase for data and files |

---

## 2. Use case diagram

The diagram shows three human actors and one secondary actor. The student uses the account, profile, browsing, application and tracking features. The provider registers, manages its own listings, reviews applicants and records outcomes. The administrator verifies listings so that unchecked content never reaches students. The email service delivers verification codes, receipts, alerts and reminders.

Registration includes email verification by six-digit code. Resending a code extends verification. Applying includes the mandatory review step, and extends into document upload when a required document is missing. Posting a listing includes the administrator verification queue.

*Figure 1: Use case diagram for Scout.* Redraw from the target in `docs/Diagram Reference Verified.html`, section 1.

---

## 3. Application architecture

Scout is a three-tier web application. The React frontend runs in the browser and talks to the Django REST API over HTTPS using JSON. Django holds all business rules and is the only component that touches the database, file storage and email. Supabase provides managed PostgreSQL and file storage. Brevo delivers outgoing email.

*Figure 2: Application architecture.* Redraw from the target in `docs/Diagram Reference Verified.html`, section 6.

### 3.1 Languages and technology choices

| Layer | Technology | Reason |
|---|---|---|
| Frontend | JavaScript (React with Vite), Tailwind CSS, HTML | Component reuse, fast development, consistent styling. Chosen with AI assistance because the team had no prior JavaScript framework experience. |
| Backend | Python with Django and Django REST Framework | The team already knew Python. Django gives authentication, an ORM and a clear app structure. |
| Database | PostgreSQL on Supabase, SQL | Relational data with strict constraints. Managed hosting removes server upkeep. |
| File storage | Supabase Storage (REST) | Keeps documents out of the database. Signed links control access. |
| Email | Brevo SMTP, through Django's mail layer | A free tier that supports standard SMTP, so changing provider is a configuration change rather than a code change. |
| Version control | Git and GitHub | Pull request review for every push, which also taught the team CI/CD habits. |

### 3.2 Key design decisions

**Django owns authentication, not Supabase Auth.** Credentials stay in Django's `auth_user` table. Supabase Auth was considered and rejected: moving to it would have meant migrating every existing user, replacing token authentication across every protected endpoint, and running two authentication systems during the change. Supabase is used for database and file hosting only.

**Email verification happens once at signup, not on every login.** An earlier build sent a code on every login. That was replaced because it adds friction to a routine action without much security gain once the email is confirmed. The accepted trade-off is that a stolen password alone is enough to sign in, which matches how most consumer platforms work.

**Hand-written schema with unmanaged models.** Tables are created in Supabase from `database/schema.sql`. Django models set `managed = False` and map to lowercase columns with `db_column`, so Django never alters the schema. The SQL file stays the single source of truth.

**Server-side eligibility.** The matching query joins the student's profile from the authenticated user. The browser cannot claim a different average, field or qualification.

**ORM for CRUD, raw SQL for matching and reporting.** The two reporting-style queries are clearer as SQL and use parameter placeholders throughout.

**Ownership checks instead of permission errors.** Any object fetched for a user is filtered by both its own id and the owner id. A mismatch returns not-found, so a user cannot confirm that another user's record exists.

**Administrators are identified by a Django staff flag plus a matching admin row.** This avoided a schema change. The `admin` table remains the audit record referenced by `opportunity.adminid`. The trade-off is that admin identity lives in two places joined by email, rather than by a foreign key as students and providers use.

**Listings are gated at the listing level, not the account level.** Providers self-register without approval. Nothing they post reaches a student until an administrator verifies that specific listing, so an account-level gate would have been a second check in front of one that already exists.

### 3.3 Backend folder structure

| Django app | Responsibility |
|---|---|
| `scout_backend` | Project shell: `settings.py`, `urls.py`, `wsgi.py` |
| `core` | Shared code: `permissions.py` (role checks for all three roles), `choices.py` (fixed value lists), `sql.py` and `db_utils.py` (raw SQL helpers), `auth_utils.py`, and `smoke_test` (end-to-end check) |
| `accounts` | Registration, email verification by code, login, logout, student profile. `otp_utils.py` holds code generation, hashing and expiry. `throttles.py` holds the verification rate limits |
| `opportunities` | Opportunity model, student browse views, provider listing management, and `matching.py` (the eligibility query). Management commands `seed_demo` and `verify_listings` |
| `applications` | Assisted apply, receipts, summary report, bookmarks, provider applicant review. `queries.py` holds the reporting SQL, `report_pdf.py` builds the summary PDF |
| `documents` | Document model, upload and listing views, signed links, and `supabase_storage.py` (the storage adapter) |
| `notifications` | In-app and email notifications through `utils.py`, plus the `send_bookmark_reminders` command |
| `providers_admin` | Provider and PlatformAdmin models, the administrator verification queue and verify action |

### 3.4 Eligibility rule

An opportunity is eligible for a student only when every criterion the provider specified passes. A criterion left blank places no restriction.

| Criterion | Rule |
|---|---|
| Field of study | Must equal the student's field of study |
| Opportunity type | Must equal the student's opportunity preference |
| Eligibility type | `Any`, or equal to the student's type (Tertiary Student or Graduate) |
| Minimum average | The student's average must be at or above it |
| Year level | Tertiary students only, at or above the required year. Graduates are excluded from listings that set one |
| Qualification | The student's qualification must be the required one **or higher**, ranked Higher Certificate, Diploma, Bachelor, Honours, Masters, Doctorate. A Masters graduate therefore qualifies for a Bachelor listing |
| Province | Must equal the listing's province |

Three conditions apply before matching is considered, in both views: the listing must be verified, active, and not past its closing date.

---

## 4. Activity diagrams

Three activity diagrams cover the main flows. Each decision diamond matches a validation or server check in the code.

**Figure 3: Registration and login.** Registration creates an inactive account and emails a six-digit code. A wrong or expired code offers a resend, within the limits in FR2. The correct code activates the account and signs the user in, so the student goes straight to the dashboard without a separate login step. A returning user logs in with email and password alone; an unverified account is told to verify first.

**Figure 4: Profile creation and document upload.** The student chooses Tertiary Student or Graduate, which decides the remaining fields. Uploads are checked for type and size before being stored, and replacing a document retires the previous row.

**Figure 5: Browsing, eligibility and applying.** The server loads the stored profile from the authenticated user, filters for verified, active and unexpired listings, and applies the rule in section 3.4. The student bookmarks or applies. Applying opens the mandatory review screen, which blocks submission when a required document is missing and sends one alert with a link back. Confirming creates the application with a reference number.

*Redraw from the target in `docs/Diagram Reference Verified.html`, section 2.*

---

## 5. Class diagram

The classes mirror the database tables because each Django model maps to one table. Methods show behaviour that lives in views and helper modules rather than on the model itself. Eligibility, for example, is not a model method: it is a SQL predicate in `opportunities/matching.py` that joins the student's profile to each opportunity.

Django's `auth_user` handles login for all three roles. Student and Provider each link to it by a one-to-one foreign key. PlatformAdmin is matched to it by email together with the Django staff flag, which is why that association is drawn as a dependency rather than a foreign key. LoginOtp records the verification codes described in FR2. The permission classes `IsStudent`, `IsProvider` and `IsAdmin` resolve the role on each request and attach the matching row.

*Figure 6: Class diagram.* Redraw from the target in `docs/Diagram Reference Verified.html`, section 4.

---

## 6. Database design

The database is PostgreSQL on Supabase. Ten application tables are created by hand from the data dictionary. Django's own tables (`auth_user`, `authtoken_token`, sessions) are created by migrations and are separate. All application names are lowercase so that Django, raw SQL and Supabase agree.

*Figure 7: Entity relationship diagram.* Redraw from the target in `docs/Diagram Reference Verified.html`, section 5.

### 6.1 Tables

| Table | Purpose | Notable rules |
|---|---|---|
| `student` | One row per registered student | `email` unique, `authuserid` unique foreign key to `auth_user`, `accountstatus` default active. `passwordhash` is a legacy column and is unused |
| `profile` | Academic details used for matching | `studentid` unique (one profile each). CHECK constraints tie `studenttype`, `graduatetype` and `qualification` together |
| `document` | Metadata for files in Supabase Storage | `isactive` false marks a retired upload. Cascade delete with student |
| `provider` | Companies posting opportunities | `email` unique, `authuserid` unique foreign key to `auth_user` |
| `admin` | Administrators who verify listings | `role` default moderator. `email` matches the corresponding `auth_user` |
| `login_otp` | Verification codes issued at signup | Links to `auth_user`. Stores hashes only, never the code itself. Tracks attempts, resends, expiry and whether the code was used |
| `opportunity` | A listing | `providerid` and `adminid` both required. `isverified` and `isactive` default false. Optional eligibility criteria are nullable |
| `application` | A student's application | `referencenumber` unique, `status` default Submitted, UNIQUE(`studentid`, `opportunityid`) |
| `bookmark` | A saved opportunity | UNIQUE(`studentid`, `opportunityid`), `remindersent` flag |
| `notification` | Receipts, alerts, status updates and reminders | `channel` records whether the row is the in-app entry or the email. CHECK that a row links to an application or a bookmark, not both |

### 6.2 Relationships

- An `auth_user` links to at most one student and at most one provider, and may have many `login_otp` rows over time.
- A student has one profile, and many documents, applications, bookmarks and notifications.
- A provider has many opportunities. Every opportunity has exactly one provider.
- An administrator has many opportunities through `adminid`, which records who verified the listing.
- An opportunity has many applications and bookmarks. A student can apply to or bookmark a given opportunity once only.
- A notification belongs to a student and optionally to one application or one bookmark.

### 6.3 Example constraint

The `profile` table prevents inconsistent data at the database level. A Tertiary Student must have a year level and no qualification. A Graduate must have no year level and a qualification that matches the graduate type: Higher Certificate, Diploma or Bachelor for Undergraduate, and Honours, Masters or Doctorate for Postgraduate. The frontend enforces the same rules, so the database acts as a second safety net.

---

## 7. Frontend structure

| File or folder | Purpose |
|---|---|
| `src/pages/Landing.jsx` | Public home page: hero, about section with tile collage, how it works, POPIA section, calls to action |
| `src/pages/Register.jsx` | Student and provider sign-up (`?as=provider`), followed by the six-digit code step |
| `src/pages/Login.jsx` | Email and password login. `?as=provider` and `?as=admin` change only the wording |
| `src/pages/Profile.jsx` | Profile form with completion percentage, conditional Tertiary or Graduate fields, document upload cards, and a loading skeleton |
| `src/pages/Eligible.jsx` | Eligible and All toggle with opportunity cards |
| `src/pages/JobDetails.jsx`, `Apply.jsx`, `Watchlist.jsx` | Listing detail, mandatory review and submit, bookmarks |
| `src/pages/Dashboard.jsx`, `PostListing.jsx`, `ViewApplicants.jsx`, `ApplicantDetails.jsx` | Provider dashboard, listing form, applicant list and detail |
| `src/pages/AdminVerify.jsx` | Administrator verification queue with a detail panel |
| `src/components/` | Reusable parts: AppShell, ProviderShell, AuthLayout, RequireAuth (role routing), Navbar, Button, FormField, JobCard and others |
| `src/context/AuthContext.jsx` | Token and user state, sign in and sign out |
| `src/lib/api.js` | One place for all API calls. Attaches the auth token |
| `src/lib/constants.js` | Shared option lists (provinces, qualifications, fields). Must match `core/choices.py` |
| `src/lib/useReveal.js` | Scroll reveal hook used by the landing page animations |

### 7.1 Interface rules

The interface uses an ink, cream and lime palette with Roboto type and lucide icons. Forms validate in the browser first, then show server errors in a single amber banner. Loading states are shown while data is being fetched, so an empty profile is never mistaken for a loaded one. Animations respect the operating system's reduced-motion setting. The API layer normalises both camelCase and snake_case keys, because the backend returned mixed styles during development.

---

## 8. Setup, maintenance and troubleshooting

### 8.1 Running the system locally

| Step | Action |
|---|---|
| 1 | Clone the repository and create `backend/.env`. Note that `.env.example` is incomplete: add the Supabase and email variables from section 8.2 |
| 2 | Create a virtual environment and run `pip install -r requirements.txt` |
| 3 | Run `python manage.py migrate` for Django's own tables |
| 4 | Run `database/schema.sql` in the Supabase SQL editor for the application tables |
| 5 | Run `python manage.py seed_demo` for demo accounts and listings |
| 6 | Run `python manage.py runserver`. The API runs on port 8000 |
| 7 | In the frontend folder run `npm install` then `npm run dev`. The app runs on port 5173 |

### 8.2 Environment variables

| Variable | Meaning |
|---|---|
| `DJANGO_SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` | Standard Django settings |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | Supabase connection. The user is `postgres.[project-ref]` |
| `DB_SSLMODE`, `DB_CONN_MAX_AGE` | SSL required. Connection age 0 when using the pooled endpoint |
| `SUPABASE_URL` | Project URL only. It must not end in `/rest/v1/` |
| `SUPABASE_SERVICE_KEY` | Storage service key, used by `supabase_storage.py`. Never expose it in the frontend |
| `SUPABASE_BUCKET` | Storage bucket name. It must be created in the dashboard first |
| `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT` | SMTP backend, and the Brevo host on port 587 |
| `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS` | Brevo login and key |
| `DEFAULT_FROM_EMAIL` | Sender address shown on outgoing email |
| `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL` | Allowed browser origin, and the base address used in email links |

### 8.3 Common problems and fixes

| Symptom | Cause | Fix |
|---|---|---|
| Frontend calls localhost after deployment | `api.js` reads `VITE_API_URL`, but the environment file sets `VITE_API_BASE_URL`. Local development works only because the fallback is the same address | Rename one so the two match, then rebuild |
| Backend will not start, missing variable | `.env.example` omits the Supabase variables, two of which are required | Copy the Supabase and email variables from section 8.2 |
| `FATAL: tenant/user postgres.xxxx not found` | Wrong project reference, paused Supabase project, or wrong pooler port | Resume the project and copy the connection details again from the dashboard |
| Verification code never arrives | Wrong Brevo login or key, or `EMAIL_BACKEND` still set to the console backend | Check the Brevo credentials and that the SMTP backend is selected. Check the spam folder |
| `Unable to send verification code` (503) | The mail service rejected the message. The code is invalidated | Read the server log, then register again or resend |
| `Please verify your email first` | The account exists but was never activated | Complete the code step, or resend the code |
| Administrator cannot see the queue | The user needs both the Django staff flag and an active row in `admin` with the same email | Set the staff flag and confirm the admin row exists |
| Upload returns 401 or 403 from storage | Storage requests need both the key and authorization headers | Check both headers in `supabase_storage.py` |
| Upload fails with bucket not found | The bucket does not exist | Create it in the Supabase dashboard with the name in `.env` |
| Storage URL not found | `SUPABASE_URL` contains `/rest/v1/` | Remove that suffix |
| Opportunity missing from the student view | Not verified, not active, or past its closing date | Verify it in the administrator queue and check the date |
| Duplicate application error (409) | The unique constraint working as intended | Show the existing application instead of creating another |

### 8.4 Routine maintenance

- Review every pull request before merge. Check ownership filters, parameterised SQL, and that no secrets are included.
- Change the database only by editing `schema.sql` and then applying the same change in Supabase, so the file stays the source of truth.
- Rotate the Supabase service key and the Brevo SMTP key if either is ever shared or committed by mistake.
- Periodically remove retired documents (inactive rows) from storage and the document table.
- Check the Supabase dashboard for usage, paused projects and backups.

---

## 9. Testing summary and known limitations

An end-to-end check exists as a management command: `python manage.py smoke_test`. It walks the full student and provider journey through the real API, prints pass or fail for every step, rolls back all database changes, and deletes files uploaded during the test. It needs a filled-in `.env`, a reachable database, and `seed_demo` run once. Running it is the fastest way to convert the rows marked *Not yet run* below into recorded results.

| Area | Tests | Results |
|---|---|---|
| Build | Frontend production build, Django system check | Pass. Both complete with no errors |
| Student registration | Register, receive the code by email, verify, land on the dashboard | Pass. Confirmed manually with a real inbox |
| Email delivery | Brevo SMTP delivers the verification code | Pass. Confirmed manually |
| Provider registration | Register with company details, verify, reach the provider dashboard | Not yet run |
| Administrator access | Sign in with a staff account, open the queue, verify a listing, confirm the audit field is set | Not yet run |
| Code security | Wrong code rejected, expired code rejected, used code rejected, attempt limit enforced | Not yet run |
| Resend and rate limits | Resend works, cooldown enforced, resend limit enforced, endpoint rate limit enforced | Not yet run |
| Login | Correct credentials succeed, wrong credentials rejected, unverified account told to verify | Not yet run |
| Profile | Create and update as Tertiary Student and as Graduate, invalid combinations rejected by the database | Not yet run |
| Documents | Valid upload accepted, wrong type rejected, file over 5 MB rejected, re-upload retires the previous row | Not yet run |
| Eligibility matching | Eligible versus All, unverified and expired listings hidden, eligibility flag correct per criterion | Not yet run |
| Assisted apply | Review screen blocks submission, missing document alert sent once, confirm creates the application with a reference number | Not yet run |
| Duplicate protection | Second application to the same listing rejected, second bookmark has no effect | Not yet run |
| Provider listings | Create, edit and delete own listing. Another provider's listing returns not-found | Not yet run |
| Provider outcomes | Status moves forward only, outcome cannot be changed once set, student is notified | Not yet run |
| Notifications | In-app feed updates, email sent, mark as read works | Not yet run |
| Summary report | PDF generates with correct totals and reference numbers | Not yet run |
| Permissions | A student cannot reach provider or administrator endpoints, and the reverse | Not yet run |

Only rows marked Pass were actually executed. No result above is assumed.

### Known limitations

| Area | Limitation | Impact |
|---|---|---|
| Deployment | `api.js` reads `VITE_API_URL` while the environment file sets `VITE_API_BASE_URL` | The frontend will call localhost in production. Fix before any deployment |
| Setup | `.env.example` omits the Supabase and email variables, two of which are required | Anyone following it gets a backend that will not start |
| Schema | `schema.sql` is missing `provider.authuserid`, which the live database and the code both use | The schema file no longer describes the live database, which matters for the ERD |
| Reminders | Deadline reminders only run when a scheduler calls the command, and none is configured | Reminders are not currently sent |
| Sessions | Authentication tokens do not expire | A leaked token stays valid until the user signs out |
| Audit trail | Provider status changes go to a log file, not a database table | The audit is not queryable and is lost if logs rotate |
| POPIA | Restrict and delete rights have no self-service mechanism | Deletion is a manual database operation |
| Account recovery | No password reset | A user who forgets a password needs manual help |
| Administration | No user management, suspension or activity monitoring | An administrator can only verify listings |
| Performance | The two-second and 500-user targets have not been load-tested | They remain design targets, not measured results |

These limitations are recorded so the next team can continue without rediscovering them.

---

## Appendix A. SQL used (schema.sql)

Paste the current contents of `database/schema.sql` here.

**Before pasting, add the missing provider column**, so the file matches the live database:

```sql
ALTER TABLE provider ADD COLUMN authuserid INTEGER UNIQUE
    REFERENCES auth_user(id);
```

The appendix in the previous version of this document is otherwise still correct, except that it predates the `login_otp` table. Re-export the file after both changes so the appendix, the ERD in section 6 and the live database agree.
