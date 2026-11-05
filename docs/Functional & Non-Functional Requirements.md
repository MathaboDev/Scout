# Scout — Functional & Non-Functional Requirements

**Status:** Current (reflects the admin side, provider self-registration, and email OTP verification shipped in this build).

---

## Functional Requirements

**FR1. Registration, Email Verification & Profile Setup**
Students and providers both self-register through the platform. A one-time password (OTP) is sent to the registered email address; the account remains inactive and cannot sign in until the OTP is verified. After verification, the user is authenticated automatically. Student profiles contain only professional information: name, email, field of study, institution, year of study, academic average, and opportunity preference. Explicitly excluded: ID numbers, home address, banking details, health information, race, salary expectations. Students upload their CV and matric certificate once; documents are reused across applications and may be updated at any time.

**FR2. Eligibility-Based Opportunity Matching & View Toggle**
Students see opportunities through two views, toggled by the student: **Eligible Opportunities** (default), showing only verified active listings that match the student's profile, and **View All Opportunities**, showing every verified active listing regardless of eligibility. Expired listings are hidden from both views.

**FR3. Assisted Application**
The system pre-fills application forms using stored profile data and attaches relevant documents. A mandatory review screen displays all pre-filled information and attachments before any submission is accepted.

**FR4. Missing Document Detection & Notification**
When a required document is missing, the system notifies the student via email with a direct link to upload it. Once uploaded, the application flow resumes with the mandatory review screen.

**FR5. Application Receipt, Submission Report & Downloadable Summary**
Each successful submission produces a receipt (student name, opportunity, provider, submission date, reference number) accessible from the dashboard and emailed to the student. A downloadable summary report lists all applications, status breakdown and reference numbers.

**FR6. Application Tracking**
A centralised dashboard displays every submitted application and its current status (Submitted, Under Review, Outcome Received), updating when a provider changes an application's status.

**FR7. Bookmarking, Deadline Reminders & Notifications**
Students may bookmark opportunities. A reminder is sent via email and in-app notification three days before a bookmarked opportunity closes. Real-time notifications also fire on submission, missing documents, status changes and outcome updates.

**FR8. Data Privacy and POPIA Compliance**
The system strictly separates professional information from sensitive personal information. Sensitive fields are never shared without explicit consent. Users can view, restrict and delete their personal data at any time, with clear communication of what is stored and how it is used, in line with POPIA (Act 4 of 2013).

**FR9. Verified and Current Listings**
Every opportunity listing is held in an administrator verification queue until an admin approves it; only verified, active, un-expired listings reach students. Verification is performed through the admin dashboard, with the responsible administrator's ID recorded on the listing as an audit trail.

**FR10. Provider & Administrator Capabilities**
Providers create, edit and remove their own listings, view eligible applicants, and update application outcomes. Administrators review and verify pending listings before they go live and keep an audit trail of who verified what.

**FR11. Role-Based Access**
Three roles exist: student, provider and administrator. Each role has its own entry point, dashboard and permitted actions. A user's role is determined by the backend (never the client) from their underlying database record.

---

## Non-Functional Requirements

**NFR1. Security & Data Protection**
All data encrypted in transit (HTTPS) and at rest (Supabase-hosted PostgreSQL). OTP codes are only ever stored as salted hashes; plaintext OTPs never appear in logs or API responses. Sensitive personal information is never logged. Authentication is token-based (DRF `TokenAuthentication`); tokens can be invalidated by the user via logout.

**NFR2. Reliability & Notification Accuracy**
Target 99% uptime, particularly during peak application periods. Deadline reminders are delivered within one minute of scheduled time; status notifications reach the student within 30 seconds of a provider status change.

**NFR3. Usability**
A first-time user completes registration, email verification, profile setup and their first application within ten minutes without external guidance. The interface is fully responsive across desktop and tablet. Error messages are plain, actionable and specific.

**NFR4. Performance**
Opportunity listings load within two seconds under normal network conditions. The system supports at least 500 concurrent users without response-time degradation.

**NFR5. Data Integrity**
Duplicate application submissions are prevented at the database level via a unique `(studentid, opportunityid)` constraint. Application status changes are timestamped and reflected on the student dashboard within 30 seconds.

**NFR6. Maintainability & Scalability**
Modular Django app structure, component-based React frontend, RESTful API. Database and backend services run on Supabase and can be scaled horizontally. Role logic is centralised in `core.permissions`; adding a new role is a localised change.

**NFR7. Authentication Hardening**
OTP verification enforces a maximum of five code-entry attempts, five-minute code expiry, a 60-second cooldown between code issues, and a maximum of three resends per challenge. Verification and resend endpoints are rate-limited per IP.
