# Scout: Diagram and Document Revision Brief

Use this to update the existing System Documentation PDF and the drawio diagrams. Each section lists what is now out of date, what to add, and what to remove. Where the code is the source of truth, the file is named.

Status key: **Built** = working in code. **Planned** = designed, not built. Only draw Planned items if they are labelled as planned.

---

## 0. Decisions needed before editing

1. **Requirement numbering.** The PDF uses FR1 to FR11 with one numbering. The revised requirements file (`docs/Functional & Non-Functional Requirements.md`) uses a different one. Pick one and use it everywhere. Mapping:

| PDF (current) | Revised file | Topic |
|---|---|---|
| FR1 | FR1 | Registration and verification |
| FR2 | FR1 (login) | Login and logout |
| FR3 | FR1 | Profile |
| FR4 | FR4 | Documents |
| FR5 | FR2 | Browse eligible and all |
| FR6 | FR2 | Eligibility |
| FR7 | FR10 | Provider |
| FR8 | FR3 | Assisted apply |
| FR9 | FR7 | Bookmark and reminders |
| FR10 | FR6 | Tracking |
| FR11 | FR9 | Admin verification |
| (none) | FR11 | Role-based access |

2. **Reset Password.** It appears in the use case diagram but is not built. Remove it or mark it Planned.
3. **Admin suspension (FR10).** Not built. Mark Planned or remove it from the sequence diagram.

---

## 1. Use case diagram (`Scout_Use_Case_Diagram.pdf`)

**Add**
- Provider: *Register (provider)*, *Log in*, *Post listing*, *Edit or remove listing*.
- Student: *Verify email (OTP)* and *Resend code* as an include of *Register*.
- Admin: *Log in*, *Review verification queue*, *Verify listing*. Connect *Verify listing* to the queue with an include or extend.
- Email Service: *Send OTP email* (Brevo SMTP).

**Change**
- *Verify Email* becomes *Verify email (6-digit OTP)*. The student enters a code. There is no link.
- *Log in* has no OTP step. Login is email and password only.
- *Manage Users* and *Monitor Platform* are Planned. Mark them or remove them.

**Remove or mark Planned**
- Reset Password (Planned).
- Auto-Fill, Attach Documents, Review Application and Generate Receipt are Planned for the apply flow. Mark them Planned if they stay on the diagram.

---

## 2. Class diagram (`Class Diagram.drawio.pdf`)

**Source of truth:** `backend/*/models.py` and `core/permissions.py`.

**Add**
- `LoginOTP`: `id`, `user` (FK auth_user), `code_hash`, `resend_token_hash`, `resend_count`, `attempts`, `is_used`, `expires_at`. Methods: `verify()`, `expire()`.
- `Token` (DRF authtoken): `key`, `user`.
- Permission classes: `IsStudent`, `IsProvider`, `IsAdmin` (`core/permissions.py`). Each attaches the role row to the request.

**Change**
- Rename `Admin` to `PlatformAdmin` (`providers_admin/models.py`). Attributes: `admin_id`, `email`, `role`, `is_active`. Note that it is linked to `auth_user` by email plus `is_staff`, not by a foreign key.
- `Provider` gets `auth_user` (1:0..1) to match the student model.
- `Opportunity.is_eligible(profile)` is **not** a function in a file called `opportunity_eligibility.py`. That file does not exist. Matching is in `opportunities/matching.py` (`list_opportunities`, `get_opportunity`). Update the text and the diagram note.
- `User` (Django auth) replaces the generic `User` box. Methods: `authenticate()`, `is_staff`.

**Remove**
- Generic `User.Register()` and `Logout()` methods. Registration is in `accounts/views.register`. Logout is `accounts/views.logout`.
- `Notification.deleteNotification()` and `sendStatusUpdate()` are Planned. Mark them or remove them.

---

## 3. Activity diagram (`SCOUT_ActivityDiagram_StudentFlow.drawio.pdf`)

**Source of truth:** `frontend/src/pages/Register.jsx`, `Login.jsx`, `accounts/views.py`.

**Change the registration lane**
- *Send Verification Email* becomes *Send 6-digit OTP email*.
- *Verify Email* becomes *Enter OTP on the check-email screen*.
- *Email Verified? No → Retry Verification* becomes *Invalid or expired code → Resend code (max 3 resends, 60 second cooldown)*.
- *Activate Account* sets `is_active = TRUE` and logs the user in. The student goes straight to the dashboard.

**Change the login lane**
- Remove any OTP step from login. Login is one step: email and password, then a token.
- Add the branch: inactive account → *Please verify your email first*.

**Add an Admin swimlane**
- Admin logs in (`/login?as=admin`), opens `/admin/verify`, reviews the queue, and clicks *Verify listing*. `is_verified` becomes TRUE and `admin_id` is recorded.

**Add a Provider signup path**
- *Register as provider* (`/register?as=provider`), then OTP, then log in, then *Post listing* (pending verification).

**Mark Planned**
- *Auto-apply*, *Missing document alert*, *Save as incomplete*, *Bookmark reminder*, and *Download summary* are Planned, unless they are built before the final submission.

---

## 4. Sequence diagram (`Scout_Sequence_Diagram.drawio.pdf`)

**Change**
- *Send verification email* and *Receive verification link* become *Send 6-digit OTP* and *Enter the code*. There is no link.
- *Verify email address* and *Grant full platform access* become *Submit OTP*, then *Account activated, token issued*.
- *Opportunity Listing Verification*: the provider posts a listing, which is stored as pending. The admin opens the queue, reviews it, and clicks Verify. Scout sets the verified flag and records the admin. The sequence should show Scout as the only writer of `is_verified`.
- *Admin Platform Monitoring*: Planned. Mark it or remove it.

**Add**
- A Login block: credentials in, token out. Show the 403 branch for unverified accounts.
- Provider registration as a separate block, using the same OTP steps.

**Remove or mark Planned**
- The *Email Service* lane should be labelled *Brevo SMTP*.
- *Assisted Application* and *Receipt & Forwarding* are Planned. Mark them if they stay.
- *Final Decision* (Accepted and Rejected) is Planned. Mark it.

---

## 5. ERD (`Scout_ERD.pdf`)

**Source of truth:** `database/schema.sql` plus `login_otp` and `provider.authuserid`. See the note below about `schema.sql`.

**Add**
- `login_otp` table (all columns in `docs/Data Dictionary.md` section 10).
- `provider.authuserid` (INTEGER, UNIQUE, FK to `auth_user.id`).
- `auth_user` and `authtoken_token` as Django-managed tables, shown separately.

**Fix**
- `Application.ReceivedAt` does not exist. Use `submittedat`, `reviewedat`, `outcomereceivedat`, `outcomeresult`, `updatedat`.
- `Opportunity.MininumAverage` is misspelled. The column is `minimumaverage`.
- `Opportunity` is missing `requiredqualification`.
- `Profile` is missing `studenttype`, `graduatetype` and `qualification`. `Institution`, `FieldOfStudy` and others need lowercase column names to match the schema.
- `Student.PasswordHash` is a legacy column. Mark it as unused, since Django's `auth_user.password` is the real credential store.
- `Admin.Password` matches the schema, but note that admins sign in through `auth_user`.

**Note on `schema.sql`**
The repo `database/schema.sql` does **not** yet contain `provider.authuserid`, although the live database and the code both use it. Add it to `schema.sql` so the file stays the source of truth. This is a documentation fix and needs no database change.

---

## 6. Application architecture (`system architecture` figure, PDF page 6)

This is the diagram you said you liked. It is good but incomplete. Add the following.

**Add**
- **Brevo SMTP** as an external service, with the arrow labelled "OTP and notification email (SMTP 587, STARTTLS)". Check the value against `backend/scout_backend/settings.py`.
- **OTP flow** inside `accounts`: `register`, `verify-otp`, `resend-otp`, `login`. Show `login_otp` in the database box.
- **Admin endpoints** inside `providers_admin`: `listings/pending/` and `listings/<id>/verify/`, guarded by `IsAdmin`.
- **Permission layer** (`core/permissions.py`): `IsStudent`, `IsProvider`, `IsAdmin`, sitting between the URL router and the views.
- **Frontend pages**: Login, Register (student and provider), Eligible, Profile, AdminVerify. Replace the current "Browse" box with `Eligible.jsx`.

**Change**
- The `providers_admin` box label: "Provider listings and admin verification queue".
- The `applications` and `notifications` boxes: mark them Planned, since their endpoints are not complete.
- The hosting labels (Netlify, Railway or Render) are team decisions. Confirm them before publishing.

**Remove**
- Any "Browse.jsx" label. The file does not exist. Use `Eligible.jsx`.

---

## 7. Written sections of the PDF

**Section 1 (requirements table)**
- FR1: "receives an email verification prompt" becomes "must verify a 6-digit email code before the account activates". Status: Built.
- FR7: "Built (provider login pending)" becomes **Built**. Provider login and self-registration work.
- FR11: "Database ready, interface pending" becomes **Built**. The admin verification queue is at `/admin/verify`.
- Add an NFR for OTP security: five attempts, five minute expiry, 60 second cooldown, three resends, IP rate limiting. Source: `accounts/otp_utils.py`.

**Section 3.3 (backend folder structure)**
- `accounts`: add "signup and login OTP (`otp_utils.py`)".
- `providers_admin`: "Provider models, admin verification queue and verify endpoints". Remove "provider listing CRUD" if that now lives in `opportunities/views.py`. Check this before writing it.
- `opportunities`: replace `opportunity_eligibility.py` with `matching.py`.

**Section 6 (database)**
- Table count: add `login_otp`. Ten application tables, not nine.
- Appendix A: regenerate from the current `schema.sql` after the provider fix above.

**Section 7 (frontend structure)**
This table is out of date. Rewrite it from the current files:

| File | Purpose |
|---|---|
| `pages/Landing.jsx` | Public landing: hero, about tile collage, how it works, POPIA, CTA |
| `pages/Register.jsx` | Student or provider sign-up, then 6-digit OTP step |
| `pages/Login.jsx` | Email and password login. `?as=provider` and `?as=admin` change the wording only |
| `pages/Eligible.jsx` | Eligible and All toggle for students |
| `pages/JobDetails.jsx`, `Apply.jsx`, `Watchlist.jsx` | Opportunity detail, apply, bookmarks |
| `pages/Profile.jsx` | Student profile, completion, documents (with loading state) |
| `pages/Dashboard.jsx`, `PostListing.jsx`, `ViewApplicants.jsx` | Provider dashboard |
| `pages/AdminVerify.jsx` | Admin verification queue with detail panel |
| `components/RequireAuth.jsx` | Role routing (`HOME_FOR_ROLE`) |
| `lib/api.js` | All API calls, including `verifyOtp` and `resendOtp` |
| `lib/constants.js` | Shared option lists. Replaces the `formOptions.js` named in the PDF |
| `lib/useReveal.js` | Scroll reveal hook for landing animations |

Remove the reference to `formOptions.js`. It does not exist.

**Section 8 (setup and troubleshooting)**
- Environment variables: the PDF says `SUPABASE_KEY`, but `settings.py` reads `SUPABASE_SERVICE_KEY`. Use the name in the code.
- Add `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `DEFAULT_FROM_EMAIL`.
- Seeding: the PDF says `seed_opportunities.sql`. The current route is `python manage.py seed_demo`, with `database/seed.sql` as the SQL alternative. Confirm which one the team uses.
- Troubleshooting additions:
  - *OTP email not received*: check the Brevo login and key, and check spam. Check that `EMAIL_BACKEND` is the SMTP backend, not console.
  - *"Please verify your email first"*: the account is still inactive. Complete the signup OTP, or resend the code.
  - *"Unable to send verification code"* (503): SMTP failed. Check the server log.
  - *Admin cannot see the queue*: the user needs `is_staff = TRUE` and a matching active row in `admin` (same email).

**Section 9 (testing and limitations)**
- Known limitations: remove "Provider login not yet connected" and "Admin verification interface not built". Both are now built.
- Keep "Email verification relies on Django's email backend being configured for production". Update it to say Brevo SMTP is configured and tested for student sign-up.
- Testing table: add **OTP** (valid code, wrong code, expired, reused, resend, cooldown), **Admin** (queue, verify, audit field set), and **Provider sign-up**.
- Only write "Passed" for a test that has been run. Current status:
  - Student signup OTP delivered to a real inbox and verified: **Passed** (manual test).
  - Provider sign-up and login: **not yet recorded**.
  - Admin login and verify: **not yet recorded**.
  - Resend, expiry, reuse and rate limit: **not yet recorded**.

---

## 8. Checklist for each team member

- [ ] Use the agreed FR numbering (section 0).
- [ ] Mark anything Planned or remove it. Do not draw unbuilt features as built.
- [ ] Check each element against the source file named above.
- [ ] Keep names consistent: `PlatformAdmin`, `login_otp`, `Eligible.jsx`, `matching.py`.
- [ ] Do not use em dashes in document text.
- [ ] Update the diagram version and date in the title block.
