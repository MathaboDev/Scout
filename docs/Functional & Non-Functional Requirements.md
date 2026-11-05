# Scout: Functional and Non-Functional Requirements

**Version 2.0** · Verified against the codebase. This file replaces all earlier requirement lists, including the numbering used in the System Documentation PDF (section 1). A mapping from the old numbering is in Appendix A.

**Status key**

| Status | Meaning |
|---|---|
| Built | Implemented and working in the current codebase |
| Built, untested | Implemented, but not yet verified by a recorded test |
| Partial | Implemented with a stated gap |
| Planned | Designed or discussed, not implemented |

---

## 1. Scope and actors

Scout is a web platform that matches South African tertiary students and graduates to internships, learnerships and graduate programmes. Students build one profile and reuse it across applications. Providers post opportunities. A platform administrator verifies each listing before students can see it.

| Actor | Description |
|---|---|
| Student | Registers, builds a profile, uploads documents, browses and applies for opportunities, tracks outcomes |
| Provider | A company. Registers, posts and manages its own listings, reviews applicants, records outcomes |
| Administrator | Verifies listings before they reach students |
| Email service | Brevo SMTP. Delivers verification codes, receipts, alerts and reminders |

A user's role is determined by the server from their database records, never from the client.

---

## 2. Functional requirements

### Account and access

**FR1. Registration**
*Status: Built*
A student registers with full name, email address and a password of at least 10 characters. A provider registers with company name, email, password, industry, province and an optional phone number. The email address must be unique across students, providers and Django auth users. The account is created inactive and cannot be used to sign in until FR2 is complete.

**FR2. Email verification by one-time code**
*Status: Built*
On registration the system emails a six-digit code to the address given. The user enters the code to activate the account. On success the account becomes active, the student record is marked email-verified, and the user is signed in immediately without a further login step. Code rules:

| Rule | Value |
|---|---|
| Code length | 6 digits |
| Validity | 5 minutes from issue |
| Entry attempts | 5 per code, then the code is locked |
| Resends | 3 per registration |
| Cooldown between issues | 60 seconds |
| Storage | Salted hash only. The plaintext code is never stored or logged |

**FR3. Login**
*Status: Built*
A verified user signs in with email and password alone. No code is required on login. A successful login returns an authentication token and the user's role, and the user is routed to the dashboard for that role. An unverified account that supplies the correct password is told to complete verification rather than being given a generic credentials error.

**FR4. Logout**
*Status: Built*
A user can sign out. The server deletes the authentication token, so it cannot be reused.

**FR5. Role-based access**
*Status: Built*
Three roles exist: student, provider and administrator. Each role has its own routes and permitted actions, enforced server-side on every protected endpoint. A request for a resource belonging to another user returns not-found rather than a permission error, so one user cannot discover another's records.

### Profile and documents

**FR6. Student profile**
*Status: Built*
A student records institution, field of study, academic average, opportunity preference and province. A Tertiary Student also records year of study. A Graduate also records graduate type (Undergraduate or Postgraduate) and qualification. The database rejects an inconsistent combination, for example a Graduate with a year of study, or a Postgraduate holding a Diploma.

The profile holds professional information only. It excludes ID numbers, home address, banking details, health information, race and salary expectations.

**FR7. Document upload**
*Status: Built*
A student uploads documents once and reuses them. A CV and a matric certificate are required before an application can be submitted. Academic transcript, proof of registration and other supporting documents are optional. Accepted file types are PDF, JPG, JPEG and PNG, up to 5 MB each. Replacing a document retires the previous version rather than deleting it. Files are stored in Supabase Storage and reached through time-limited signed links valid for one hour.

### Opportunities

**FR8. Eligibility matching**
*Status: Built*
The server calculates eligibility from the student's stored profile. An opportunity is eligible only when every criterion the provider specified is satisfied. A criterion the provider left blank places no restriction.

| Criterion | Rule |
|---|---|
| Field of study | Must equal the student's field of study |
| Opportunity type | Must equal the student's opportunity preference |
| Eligibility type | `Any`, or equal to the student's type |
| Minimum average | Student's average must be at or above it |
| Year level | Tertiary students only, at or above the required year. Graduates are excluded from listings that set one |
| Qualification | The student's qualification must be the required one or higher, ranked Higher Certificate, Diploma, Bachelor, Honours, Masters, Doctorate |
| Province | Must equal the listing's province |

Eligibility is never accepted from the browser.

**FR9. Browsing with a view toggle**
*Status: Built*
A student switches between two views. **Eligible** shows only opportunities they qualify for. **All** shows every live opportunity, each flagged with whether the student is eligible. Both views exclude unverified, inactive and expired listings, and both are ordered by closing date. Each listing also shows whether the student has bookmarked or already applied to it.

**FR10. Assisted application**
*Status: Built*
The system pre-fills an application from the stored profile and attaches the student's active documents. A review screen is mandatory: nothing is submitted until the student confirms on that screen. On confirmation the system creates the application with status Submitted and a unique reference number in the form `SCOUT-XXXXXXXXXX`.

An application is refused when the opportunity has closed, when the student is not eligible, when the profile is incomplete, when a required document is missing, or when the student has already applied.

**FR11. Missing document detection**
*Status: Built*
When a required document is missing at review time, the system lists what is missing, blocks submission, and notifies the student in the application and by email. The email contains a link that returns the student to the same review screen. The alert is sent once per missing-document situation, so reopening the screen does not send repeat emails.

**FR12. Receipt and summary report**
*Status: Built*
Each submission produces a receipt containing the student's name, opportunity title, provider, submission date, reference number and current status. The receipt is available on the dashboard and emailed to the student. The student can also download a PDF summary of all applications, with totals by status and every reference number.

**FR13. Application tracking**
*Status: Built*
A dashboard lists every application with its current status: Submitted, Under Review, or Outcome Received. The dashboard refreshes automatically every 15 seconds, so a change made by a provider appears without the student checking an external portal.

**FR14. Bookmarks**
*Status: Built*
A student can save an opportunity to a watchlist and remove it again. Saving the same opportunity twice has no additional effect. The watchlist shows closing dates.

**FR15. Deadline reminders**
*Status: Partial*
The system sends a reminder three days before a bookmarked opportunity closes, in the application and by email, once per bookmark. Students who have already applied are skipped.

*Gap:* the reminder runs as a scheduled command (`send_bookmark_reminders`). It only fires when a scheduler calls it. No scheduler is configured yet, so reminders do not currently go out unattended.

**FR16. Notifications**
*Status: Built*
The student receives a notification when an application is submitted, a required document is missing, a status changes, an outcome is recorded, and a bookmarked deadline approaches. Notifications appear in the application and, where appropriate, by email. The student can mark one or all as read.

### Provider

**FR17. Listing management**
*Status: Built, untested*
A provider creates, edits and removes its own listings. A listing may set optional eligibility criteria. Every provider query is restricted to that provider's own records. A new listing is created unverified and is not visible to students until FR19 is complete.

**FR18. Applicant review and outcomes**
*Status: Built, untested*
A provider sees the applicants for its own listings, with each applicant's professional profile and which required documents are attached. Document file links are not exposed to providers. A provider moves an application to Under Review and then records an outcome of Successful or Unsuccessful. Status can only move forward, and once an outcome is recorded it cannot be changed. Every change is logged with the application, the provider, the old and new status, and the time.

### Administration

**FR19. Listing verification**
*Status: Built, untested*
Every new listing enters a verification queue. An administrator reviews the queue, opens a listing's full detail and verifies it. Verification makes the listing visible to matching students and records the verifying administrator against the listing as an audit trail. A listing that has already been verified cannot be verified again.

**FR20. Data privacy and POPIA**
*Status: Partial*
The system separates professional information from sensitive personal information and never collects the sensitive categories listed in FR6. Providers see only a student's professional profile. A student can view everything stored about them through their profile and documents screens.

*Gap:* POPIA also grants rights to restrict and delete personal data. There is no self-service mechanism for either. Deletion is currently a manual database operation.

### Not implemented

| Item | Status | Note |
|---|---|---|
| Password reset | Planned | A user who forgets a password cannot recover the account without manual help |
| Administrator user management | Planned | No interface to list, edit or deactivate users |
| Listing and account suspension | Planned | No way to suspend a listing or account that breaches platform rules |
| Platform activity monitoring | Planned | No dashboard of platform activity |

---

## 3. Non-functional requirements

**NFR1. Credential security**
*Status: Built*
Passwords are hashed by Django and never stored in plaintext. Verification codes and resend tokens are stored as salted hashes. Neither appears in logs or API responses. Secrets live in environment files that are excluded from version control.

**NFR2. Transport and storage security**
*Status: Built*
The database connection requires SSL. HTTPS redirection and secure cookies are enabled whenever debug mode is off. Document files are private, reached only through signed links that expire after one hour. The storage service key is held on the server and never sent to the browser.

**NFR3. Authentication hardening**
*Status: Partial*
Verification and resend endpoints are rate-limited to 5 requests per minute per client. Anonymous requests are limited to 20 per minute and authenticated requests to 120 per minute. Code entry is limited to 5 attempts, resends to 3, with a 60-second cooldown.

*Gap:* authentication tokens do not expire. A token stays valid until the user signs out. An inactivity timeout is not implemented.

**NFR4. Input and query safety**
*Status: Built*
All raw SQL uses parameter placeholders. Fixed value lists used in query text come from server-side constants, never from user input. Uploaded files are checked for type and size before being accepted. Internal errors are logged but never echoed to the client.

**NFR5. Data integrity**
*Status: Built*
The database prevents a student applying to the same opportunity more than once, and bookmarking the same opportunity more than once, through unique constraints rather than interface checks alone. Profile field combinations are enforced by database constraints. Application status transitions are validated server-side and cannot move backwards.

**NFR6. Auditability**
*Status: Partial*
Each verified listing records which administrator verified it. Every provider status change is written to the application log with the responsible provider and a timestamp.

*Gap:* the status-change audit is a log file, not a database table, so it is not queryable from the application and is lost if logs rotate.

**NFR7. Notification timeliness**
*Status: Built*
The student dashboard polls every 15 seconds, so a provider's status change reaches the student within roughly that interval. Emails are handed to the mail service as soon as the triggering action completes. A mail failure is logged and never prevents the underlying action, such as an application submission, from completing.

**NFR8. Usability**
*Status: Built*
The interface works across desktop and tablet widths. Validation runs in the browser first, with server errors shown in a single plain-language message. Loading states are shown while data is being fetched. Animations respect the operating system's reduced-motion setting.

**NFR9. Performance**
*Status: Built, untested*
Listing results are returned by a single database query and paginated at 20 records per page.

*Gap:* the targets of two-second load times and 500 concurrent users have not been load-tested. They remain goals, not measured results.

**NFR10. Reliability**
*Status: Built, untested*
Managed hosting is used for the database, file storage and email. The 99 percent uptime target has not been measured.

**NFR11. Maintainability**
*Status: Built*
The backend is organised into focused Django applications. Role logic lives in one shared permissions module, so adding a role is a localised change. The frontend is component-based with a single module for all API calls. Fixed value lists are defined once on each side and documented as needing to be changed together.

**NFR12. Schema ownership**
*Status: Partial*
Application tables are defined by hand in `database/schema.sql`. Django models that map to them are marked unmanaged, so Django never alters the schema. Django owns only its own authentication and token tables.

*Gap:* `schema.sql` is missing the `provider.authuserid` column that the live database and the code both use. The file needs updating to match.

---

## 4. Technology constraints

| Layer | Technology |
|---|---|
| Frontend | React with Vite, Tailwind CSS, React Router, Lucide icons |
| Backend | Python, Django 6.1, Django REST Framework 3.18, token authentication |
| Database | PostgreSQL, hosted on Supabase, accessed over SSL |
| File storage | Supabase Storage, private bucket with signed links |
| Email | Brevo SMTP over STARTTLS on port 587 |
| PDF generation | ReportLab |
| Version control | Git and GitHub, with review before merge |

**End user:** a current browser and an email address they can access, since an account cannot be activated without receiving the verification code.

---

## Appendix A. Mapping from the old numbering

The System Documentation PDF used a different numbering. Use this to update cross-references.

| PDF | This document | Note |
|---|---|---|
| FR1 | FR1, FR2 | Verification is now a code, and is its own requirement |
| FR2 | FR3, FR4 | Login and logout separated |
| FR3 | FR6 | Profile |
| FR4 | FR7 | Documents |
| FR5 | FR9 | Browsing and the view toggle |
| FR6 | FR8 | Eligibility |
| FR7 | FR17, FR18 | Provider listings and applicants separated |
| FR8 | FR10 | Assisted application |
| FR9 | FR14, FR15 | Bookmarks and reminders separated |
| FR10 | FR13 | Tracking |
| FR11 | FR19 | Administrator verification |
| (new) | FR5 | Role-based access |
| (new) | FR11, FR12, FR16 | Missing documents, receipt and summary, notifications |
| (new) | FR20 | Privacy and POPIA, previously an NFR |

---

## Appendix B. Items needing a decision

1. **FR15 reminders.** A scheduler must be configured, or the requirement should be restated as a manually run command.
2. **NFR3 token expiry.** Either implement an inactivity timeout or remove the claim from the documentation.
3. **FR20 POPIA rights.** Restrict and delete are stated obligations with no mechanism. Decide whether to build a minimal version or document the manual process.
4. **NFR6 audit trail.** Decide whether the status-change log moves into a database table before submission.
5. **NFR9 and NFR10 targets.** Either run a load test and record the numbers, or restate them as design targets.
6. **NFR12 schema drift.** Add `provider.authuserid` to `schema.sql`.
