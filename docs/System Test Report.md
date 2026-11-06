# Scout System Test Report

Run on 06 November 2026 at 12:04 (SAST) with `python manage.py system_test`. 421 checks: **418 passed, 3 warnings, 0 failed** in 675 seconds.

Every check runs through the real API against the Supabase database inside one transaction that is rolled back afterwards. Email is captured in memory, and test files uploaded to storage are deleted. WARN marks a known limitation or a target that could not be measured locally, not a defect.


## 1. Environment and setup

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 1.01 | Django system check has no issues |  | PASS |
| 1.02 | Database reachable |  | PASS |
| 1.03 | All 10 application tables exist | NFR12 | PASS |
| 1.04 | provider.authuserid column exists | NFR12 | PASS |
| 1.05 | Demo data present (run seed_demo if this fails) |  | PASS |
| 1.06 | An administrator exists (staff user + active admin row) | FR27 | PASS |
| 1.07 | CORS allows FRONTEND_URL |  | PASS |
| 1.08 | Reminder middleware is installed | FR21 | PASS |

## 2. Student registration and email verification

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 2.01 | Register student -> 201 with a verification step | FR1 | PASS |
| 2.02 | New account is created inactive | FR1 | PASS |
| 2.03 | Student row starts unverified | FR1 | PASS |
| 2.04 | Name split into first and last name |  | PASS |
| 2.05 | Six-digit code is emailed | FR2 | PASS |
| 2.06 | Code does not appear in the API response | NFR1 | PASS |
| 2.07 | Correct code activates the account and signs in | FR2 | PASS |
| 2.08 | Signed in as role student | FR2 | PASS |
| 2.09 | Account is now active | FR2 | PASS |
| 2.10 | Student row marked email-verified | FR2 | PASS |
| 2.11 | Token from verification works on /me |  | PASS |
| 2.12 | Same email again is refused | FR1 | PASS |
| 2.13 | Same email in capitals is refused | FR1 | PASS |
| 2.14 | Password under 10 characters is refused | FR1 | PASS |
| 2.15 | Mismatched passwords are refused | FR1 | PASS |
| 2.16 | Single-word name is refused | FR1 | PASS |
| 2.17 | Missing name is refused | FR1 | PASS |
| 2.18 | Missing email is refused | FR1 | PASS |
| 2.19 | Self-registering as admin is refused | FR1 | PASS |
| 2.20 | Email used by an existing student is refused | FR1 | PASS |
| 2.21 | Email used by a provider is refused (unique across roles) | FR1 | PASS |
| 2.22 | Abandoned (never verified) sign-up can register again | FR1 | PASS |
| 2.23 | ...and the new code activates it | FR2 | PASS |

## 3. Verification code security

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 3.01 | Only a salted hash of the code is stored | FR2 / NFR1 | PASS |
| 3.02 | Resend token stored as a hash | NFR1 | PASS |
| 3.03 | Code expires 5 minutes after issue | FR2 | PASS |
| 3.04 | Wrong code is refused | FR2 | PASS |
| 3.05 | Five-digit code is refused | FR2 | PASS |
| 3.06 | Non-numeric code is refused | FR2 | PASS |
| 3.07 | Non-numeric code id is refused | FR2 | PASS |
| 3.08 | Unknown code id is refused | FR2 | PASS |
| 3.09 | Expired code is refused | FR2 | PASS |
| 3.10 | Account stays inactive after a refused code | FR2 | PASS |
| 3.11 | Correct code refused after 5 wrong attempts | FR2 | PASS |
| 3.12 | Attempts counter stops at 5 | FR2 | PASS |
| 3.13 | A used code cannot be used again | FR2 | PASS |

## 4. Resend limits and rate limits

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 4.01 | Resend inside the 60-second cooldown is refused | FR2 | PASS |
| 4.02 | Resend with a wrong resend token is refused | FR2 | PASS |
| 4.03 | Resend 1 of 3 succeeds | FR2 | PASS |
| 4.04 | Resend 2 of 3 succeeds | FR2 | PASS |
| 4.05 | Resend 3 of 3 succeeds | FR2 | PASS |
| 4.06 | Fourth resend is refused (limit 3) | FR2 | PASS |
| 4.07 | The original code no longer works after a resend | FR2 | PASS |
| 4.08 | The newest code works | FR2 | PASS |
| 4.09 | Verify endpoint limited to 5 requests per minute | NFR3 | PASS |
| 4.10 | Resend endpoint limited to 5 requests per minute | NFR3 | PASS |
| 4.11 | Anonymous requests limited to 20 per minute | NFR3 | PASS |

## 5. Login and logout

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 5.01 | Set-up: register login student |  | PASS |
| 5.02 | Set-up: verify login student |  | PASS |
| 5.03 | Verified user logs in with email + password only | FR3 | PASS |
| 5.04 | Login payload carries the role | FR5 | PASS |
| 5.05 | Login records last_login (used by activity monitoring) |  | PASS |
| 5.06 | Email is case-insensitive at login | FR3 | PASS |
| 5.07 | Wrong password -> 401 | FR3 | PASS |
| 5.08 | Unknown email -> same 401 (no account discovery) | FR3 / FR5 | PASS |
| 5.09 | Missing password -> 400 |  | PASS |
| 5.10 | Unverified account with the right password is told to verify | FR3 | PASS |
| 5.11 | Unverified account with a wrong password gets the generic error | FR3 | PASS |
| 5.12 | Logging in twice returns the same token |  | PASS |
| 5.13 | Logout -> 200 | FR4 | PASS |
| 5.14 | Token is deleted on the server | FR4 | PASS |
| 5.15 | Old token is refused afterwards | FR4 | PASS |
| 5.16 | Logout without a token is refused | FR4 | PASS |

## 6. Provider registration

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 6.01 | Register provider -> 201 | FR1 | PASS |
| 6.02 | Provider row linked to auth_user | FR1 | PASS |
| 6.03 | Phone number stored | FR1 | PASS |
| 6.04 | Provider account starts inactive | FR1 | PASS |
| 6.05 | Missing company name is refused | FR1 | PASS |
| 6.06 | Missing industry is refused | FR1 | PASS |
| 6.07 | Invalid province is refused | FR1 | PASS |
| 6.08 | Phone number is optional | FR1 | PASS |
| 6.09 | Provider verifies and is signed in as provider | FR2 | PASS |
| 6.10 | Payload includes the company name |  | PASS |
| 6.11 | New provider reaches an empty dashboard | FR23 | PASS |
| 6.12 | Provider logs in again with email + password | FR3 | PASS |

## 7. Roles and permissions

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 7.01 | Set-up: register perm student |  | PASS |
| 7.02 | Set-up: verify perm student |  | PASS |
| 7.03 | Set-up: perm profile saved |  | PASS |
| 7.04 | Set-up: register perm provider |  | PASS |
| 7.05 | Set-up: verify perm provider |  | PASS |
| 7.06 | Anonymous users get 401 on every protected endpoint | FR5 | PASS |
| 7.07 | Provider cannot use student endpoints | FR5 | PASS |
| 7.08 | Student cannot use provider endpoints | FR5 | PASS |
| 7.09 | Student cannot use admin endpoints | FR5 | PASS |
| 7.10 | Provider cannot use admin endpoints | FR5 | PASS |
| 7.11 | Admin cannot use student endpoints | FR5 | PASS |
| 7.12 | Admin /me reports role admin | FR5 | PASS |
| 7.13 | A made-up token is refused | FR5 | PASS |
| 7.14 | Set-up: register staff student |  | PASS |
| 7.15 | Set-up: verify staff student |  | PASS |
| 7.16 | Staff flag without an admin row does not grant admin access | FR5 | PASS |

## 8. Student profile

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 8.01 | Set-up: register profile student |  | PASS |
| 8.02 | Set-up: verify profile student |  | PASS |
| 8.03 | Empty profile loads before first save | FR6 | PASS |
| 8.04 | First save without all required fields is refused | FR6 | PASS |
| 8.05 | Tertiary student without a year is refused | FR6 | PASS |
| 8.06 | Graduate without graduate type is refused | FR6 | PASS |
| 8.07 | Undergraduate with an Honours qualification is refused | FR6 | PASS |
| 8.08 | Postgraduate with a Diploma is refused | FR6 | PASS |
| 8.09 | Average above 100 is refused | FR6 | PASS |
| 8.10 | Negative average is refused | FR6 | PASS |
| 8.11 | Unknown province is refused | FR6 | PASS |
| 8.12 | Unknown field of study is refused | FR6 | PASS |
| 8.13 | Year of study above 6 is refused | FR6 | PASS |
| 8.14 | Save Tertiary Student profile | FR6 | PASS |
| 8.15 | Graduate-only fields are cleared for a tertiary student | FR6 | PASS |
| 8.16 | Switch to Graduate profile | FR6 | PASS |
| 8.17 | Partial update keeps other fields | FR6 | PASS |
| 8.18 | Still exactly one profile row | FR6 | PASS |
| 8.19 | Profile holds no sensitive personal fields | FR7 | PASS |
| 8.20 | Database rejects a graduate with a year of study | FR6 / NFR5 | PASS |
| 8.21 | Database rejects a Postgraduate with a Diploma | FR6 / NFR5 | PASS |
| 8.22 | Database rejects an unknown student type | FR6 / NFR5 | PASS |

## 9. Documents and storage

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 9.01 | Set-up: register docs student |  | PASS |
| 9.02 | Set-up: verify docs student |  | PASS |
| 9.03 | Set-up: docs profile saved |  | PASS |
| 9.04 | Set-up: register docs-other student |  | PASS |
| 9.05 | Set-up: verify docs-other student |  | PASS |
| 9.06 | Set-up: docs-other profile saved |  | PASS |
| 9.07 | Document list starts empty | FR8 | PASS |
| 9.08 | Executable file is refused | FR8 | PASS |
| 9.09 | Word document is refused | FR8 | PASS |
| 9.10 | File over 5 MB is refused | FR8 | PASS |
| 9.11 | Unknown document type is refused | FR8 | PASS |
| 9.12 | Upload without a file is refused | FR8 | PASS |
| 9.13 | Upload PDF CV | FR8 | PASS |
| 9.14 | Upload response hides the storage path | FR9 | PASS |
| 9.15 | Upload PNG replacement CV | FR8 | PASS |
| 9.16 | Replacing a document retires the old row (not deleted) | FR8 | PASS |
| 9.17 | List shows only the active CV | FR8 | PASS |
| 9.18 | Optional transcript (JPG) upload | FR8 | PASS |
| 9.19 | Signed link issued, valid for one hour | FR9 | PASS |
| 9.20 | Signed link does not contain the service key | FR9 | PASS |
| 9.21 | Another student cannot get a link to this document (404) | FR5 / FR9 | PASS |
| 9.22 | Another student's list does not show it | FR5 | PASS |

## 10. Eligibility matching

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 10.01 | Set-up: register match student |  | PASS |
| 10.02 | Set-up: verify match student |  | PASS |
| 10.03 | Set-up: match profile saved |  | PASS |
| 10.04 | Set-up: register match provider |  | PASS |
| 10.05 | Set-up: verify match provider |  | PASS |
| 10.06 | Listing with no optional criteria: eligible | FR10 / FR11 | PASS |
| 10.07 | Different field of study: not eligible | FR10 / FR11 | PASS |
| 10.08 | Different opportunity type: not eligible | FR10 / FR11 | PASS |
| 10.09 | Eligibility type Graduate: not eligible | FR10 / FR11 | PASS |
| 10.10 | Eligibility type Tertiary Student: eligible | FR10 / FR11 | PASS |
| 10.11 | Minimum average equal to the student's: eligible | FR10 / FR11 | PASS |
| 10.12 | Minimum average above the student's: not eligible | FR10 / FR11 | PASS |
| 10.13 | Year level equal to the student's: eligible | FR10 / FR11 | PASS |
| 10.14 | Year level above the student's: not eligible | FR10 / FR11 | PASS |
| 10.15 | Same province: eligible | FR10 / FR11 | PASS |
| 10.16 | Different province: not eligible | FR10 / FR11 | PASS |
| 10.17 | Tertiary student vs a required qualification: not eligible | FR10 / FR11 | PASS |
| 10.18 | Expired listing hidden from both views | FR11 | PASS |
| 10.19 | Unverified listing hidden from both views | FR11 | PASS |
| 10.20 | Inactive (removed) listing hidden from both views | FR11 | PASS |
| 10.21 | All view is ordered by closing date | FR11 | PASS |
| 10.22 | Every row has bookmarked/applied flags | FR12 | PASS |
| 10.23 | Expired listing detail still opens, flagged closed | FR15 | PASS |
| 10.24 | Unverified listing detail -> 404 | FR24 | PASS |
| 10.25 | Eligibility ignores values sent by the browser | FR10 | PASS |
| 10.26 | Invalid view parameter -> 400 | FR11 | PASS |
| 10.27 | Masters graduate vs Bachelor requirement (higher qualifies): eligible | FR10 | PASS |
| 10.28 | Masters graduate vs Masters requirement: eligible | FR10 | PASS |
| 10.29 | Masters graduate vs Doctorate requirement: not eligible | FR10 | PASS |
| 10.30 | Graduate vs a listing that sets a year level: not eligible | FR10 | PASS |
| 10.31 | Eligibility type Graduate for a graduate: eligible | FR10 | PASS |
| 10.32 | Eligibility type Tertiary Student for a graduate: not eligible | FR10 | PASS |
| 10.33 | Set-up: register noprofile student |  | PASS |
| 10.34 | Set-up: verify noprofile student |  | PASS |
| 10.35 | Student without a profile sees no eligible listings | FR10 | PASS |

## 11. Assisted apply and receipts

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 11.01 | Set-up: register apply student |  | PASS |
| 11.02 | Set-up: verify apply student |  | PASS |
| 11.03 | Set-up: apply profile saved |  | PASS |
| 11.04 | Set-up: register apply provider |  | PASS |
| 11.05 | Set-up: verify apply provider |  | PASS |
| 11.06 | Review screen loads | FR13 | PASS |
| 11.07 | Review blocks submission and lists CV + matric | FR16 | PASS |
| 11.08 | Review is pre-filled from the stored profile | FR13 | PASS |
| 11.09 | Missing-document alert is sent once, even after reopening | FR16 | PASS |
| 11.10 | Alert email links back to the same review screen | FR16 | PASS |
| 11.11 | Confirm without required documents is refused | FR15 | PASS |
| 11.12 | Nothing was created by review alone | FR13 | PASS |
| 11.13 | Upload cv | FR8 | PASS |
| 11.14 | Upload matric_certificate | FR8 | PASS |
| 11.15 | Review now allows submission and attaches the documents | FR13 | PASS |
| 11.16 | Confirm creates the application | FR14 | PASS |
| 11.17 | Status is Submitted | FR14 | PASS |
| 11.18 | Reference number has the form SCOUT-XXXXXXXXXX | FR14 | PASS |
| 11.19 | Receipt has name, opportunity, provider, date, reference, status | FR17 | PASS |
| 11.20 | Receipt is emailed | FR17 | PASS |
| 11.21 | Applying twice -> 409 | FR15 / NFR5 | PASS |
| 11.22 | Database itself rejects a duplicate application | NFR5 | PASS |
| 11.23 | Closed listing -> 410 | FR15 | PASS |
| 11.24 | Ineligible listing -> 403 | FR15 | PASS |
| 11.25 | Set-up: register apply-noprofile student |  | PASS |
| 11.26 | Set-up: verify apply-noprofile student |  | PASS |
| 11.27 | Incomplete profile -> 400 | FR15 | PASS |
| 11.28 | Missing opportunity id -> 400 |  | PASS |
| 11.29 | Unknown opportunity -> 404 |  | PASS |
| 11.30 | Listing now shows as applied | FR12 | PASS |

## 12. Dashboard, summary and PDF

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 12.01 | Apply section produced an application |  | PASS |
| 12.02 | Dashboard lists the application with its status | FR19 | PASS |
| 12.03 | Receipt reopens from the dashboard | FR17 | PASS |
| 12.04 | Set-up: register dash-other student |  | PASS |
| 12.05 | Set-up: verify dash-other student |  | PASS |
| 12.06 | Set-up: dash-other profile saved |  | PASS |
| 12.07 | Another student's receipt -> 404 | FR5 | PASS |
| 12.08 | Another student's dashboard does not show it | FR5 | PASS |
| 12.09 | Summary totals by status | FR18 | PASS |
| 12.10 | PDF summary downloads | FR18 | PASS |
| 12.11 | PDF is offered as a file download | FR18 | PASS |
| 12.12 | PDF works for a student with no applications | FR18 | PASS |

## 13. Bookmarks

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 13.01 | Set-up: register bm student |  | PASS |
| 13.02 | Set-up: verify bm student |  | PASS |
| 13.03 | Set-up: bm profile saved |  | PASS |
| 13.04 | Set-up: register bm provider |  | PASS |
| 13.05 | Set-up: verify bm provider |  | PASS |
| 13.06 | Bookmark a listing | FR20 | PASS |
| 13.07 | Saving again has no extra effect | FR20 / NFR5 | PASS |
| 13.08 | Watchlist shows the closing date | FR20 | PASS |
| 13.09 | Listing shows as bookmarked | FR12 | PASS |
| 13.10 | Bookmarking an unverified listing -> 404 | FR24 | PASS |
| 13.11 | Remove bookmark | FR20 | PASS |
| 13.12 | Removing twice is harmless | FR20 | PASS |

## 14. Provider listings

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 14.01 | Set-up: register listings provider |  | PASS |
| 14.02 | Set-up: verify listings provider |  | PASS |
| 14.03 | Set-up: register listings-other provider |  | PASS |
| 14.04 | Set-up: verify listings-other provider |  | PASS |
| 14.05 | Set-up: register listings student |  | PASS |
| 14.06 | Set-up: verify listings student |  | PASS |
| 14.07 | Set-up: listings profile saved |  | PASS |
| 14.08 | Unknown field of study is refused | FR23 | PASS |
| 14.09 | Closing date in the past is refused | FR23 | PASS |
| 14.10 | Minimum average above 100 is refused | FR23 | PASS |
| 14.11 | Graduate listing with a year level is refused | FR23 | PASS |
| 14.12 | Tertiary listing with a qualification is refused | FR23 | PASS |
| 14.13 | Missing title is refused | FR23 | PASS |
| 14.14 | Create listing with optional criteria | FR23 | PASS |
| 14.15 | New listing is unverified (pending) | FR24 | PASS |
| 14.16 | Provider id comes from the token, not the request | FR23 | PASS |
| 14.17 | Provider cannot self-verify or post for another provider | FR23 / FR24 | PASS |
| 14.18 | Pending listing hidden from students | FR24 | PASS |
| 14.19 | Dashboard lists only this provider's listings | FR23 | PASS |
| 14.20 | Another provider: GET -> 404 | FR23 / FR5 | PASS |
| 14.21 | Another provider: PATCH -> 404 | FR23 / FR5 | PASS |
| 14.22 | Another provider: DELETE -> 404 | FR23 / FR5 | PASS |
| 14.23 | ...and the listing is unchanged | FR23 | PASS |
| 14.24 | Edit own listing | FR23 | PASS |
| 14.25 | Editing sends it back for verification | FR24 | PASS |
| 14.26 | Remove own listing | FR23 | PASS |
| 14.27 | Removal is a soft delete (history kept) | FR23 | PASS |
| 14.28 | Removed listing gone from the dashboard | FR23 | PASS |
| 14.29 | Removed listing gone from the admin queue | FR27 | PASS |

## 15. Applicant review and outcomes

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 15.01 | Apply section produced an application |  | PASS |
| 15.02 | Set-up: register outcome-other provider |  | PASS |
| 15.03 | Set-up: verify outcome-other provider |  | PASS |
| 15.04 | Dashboard counts the applicant as awaiting review | FR25 | PASS |
| 15.05 | Applicant list shows the student | FR25 | PASS |
| 15.06 | Another provider cannot list these applicants | FR25 / FR5 | PASS |
| 15.07 | Applicant detail shows the professional profile | FR25 / FR29 | PASS |
| 15.08 | Applicant detail shows which documents are attached | FR25 | PASS |
| 15.09 | No file links or storage paths reach the provider | FR25 | PASS |
| 15.10 | No internal student id reaches the provider | FR29 | PASS |
| 15.11 | Another provider: applicant detail -> 404 | FR5 | PASS |
| 15.12 | Another provider cannot change the status | FR26 | PASS |
| 15.13 | Unknown status is refused | FR26 | PASS |
| 15.14 | Setting the current status again is refused | FR26 | PASS |
| 15.15 | Outcome without a result is refused | FR26 | PASS |
| 15.16 | Outcome with an unknown result is refused | FR26 | PASS |
| 15.17 | Move to Under Review | FR26 | PASS |
| 15.18 | reviewed_at is recorded | FR26 | PASS |
| 15.19 | Student is emailed about the status change | FR22 | PASS |
| 15.20 | Moving backwards is refused | FR26 / NFR5 | PASS |
| 15.21 | Record outcome Successful | FR26 | PASS |
| 15.22 | Outcome cannot be changed once recorded | FR26 | PASS |
| 15.23 | Student dashboard shows Outcome Received + Successful | FR19 / US11 | PASS |
| 15.24 | Student has submitted, status and outcome notifications | FR22 | PASS |
| 15.25 | Set-up: register outcome2 student |  | PASS |
| 15.26 | Set-up: verify outcome2 student |  | PASS |
| 15.27 | Set-up: outcome2 profile saved |  | PASS |
| 15.28 | Submitted can jump straight to an outcome | FR26 | PASS |

## 16. Administrator verification

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 16.01 | Set-up: register admin provider |  | PASS |
| 16.02 | Set-up: verify admin provider |  | PASS |
| 16.03 | Set-up: register admin student |  | PASS |
| 16.04 | Set-up: verify admin student |  | PASS |
| 16.05 | Set-up: admin profile saved |  | PASS |
| 16.06 | Provider posts a listing | FR27 | PASS |
| 16.07 | New listing enters the verification queue | FR27 | PASS |
| 16.08 | Queue item has the full detail the admin needs | FR27 | PASS |
| 16.09 | Queue is oldest first | FR27 | PASS |
| 16.10 | Admin verifies the listing | FR27 | PASS |
| 16.11 | Listing is verified and stamped with the verifying admin | FR28 / NFR6 | PASS |
| 16.12 | Verified listing is now visible to students | FR28 | PASS |
| 16.13 | Verified listing left the queue | FR27 | PASS |
| 16.14 | Verifying again is refused | FR28 | PASS |
| 16.15 | Verifying an unknown listing -> 404 | FR27 | PASS |
| 16.16 | verify_listings command still works |  | PASS |

## 17. Notifications

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 17.01 | Set-up: register notes student |  | PASS |
| 17.02 | Set-up: verify notes student |  | PASS |
| 17.03 | Set-up: notes profile saved |  | PASS |
| 17.04 | Set-up: register notes-other student |  | PASS |
| 17.05 | Set-up: verify notes-other student |  | PASS |
| 17.06 | Set-up: notes-other profile saved |  | PASS |
| 17.07 | Feed lists in-app notifications with an unread count | FR22 | PASS |
| 17.08 | Newest first | FR22 | PASS |
| 17.09 | Another student cannot mark it read | FR5 | PASS |
| 17.10 | Mark one as read | FR22 | PASS |
| 17.11 | Mark all as read | FR22 | PASS |
| 17.12 | Email copy is sent and logged as an email-channel row | FR22 | PASS |
| 17.13 | Email-channel rows stay out of the in-app feed | FR22 | PASS |
| 17.14 | A mail outage never blocks the in-app notification | NFR7 | PASS |

## 18. Deadline reminders

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 18.01 | Set-up: register remind student |  | PASS |
| 18.02 | Set-up: verify remind student |  | PASS |
| 18.03 | Set-up: remind profile saved |  | PASS |
| 18.04 | Set-up: register remind provider |  | PASS |
| 18.05 | Set-up: verify remind provider |  | PASS |
| 18.06 | Bookmark closing within 3 days is reminded | FR21 | PASS |
| 18.07 | Bookmark closing in 5 days is not reminded yet | FR21 | PASS |
| 18.08 | Student who already applied is skipped | FR21 | PASS |
| 18.09 | Already-closed listing is skipped | FR21 | PASS |
| 18.10 | Reminder appears in the in-app feed | FR21 / FR22 | PASS |
| 18.11 | Reminder is emailed with a link to the listing | FR21 | PASS |
| 18.12 | Running again sends nothing new (once per bookmark) | FR21 | PASS |
| 18.13 | The 5-day bookmark is reminded once it enters the window | FR21 | PASS |
| 18.14 | Automatic check starts once, then waits for the interval | FR21 | PASS |
| 18.15 | REMINDERS_AUTORUN=false switches it off | FR21 | PASS |
| 18.16 | Normal API traffic triggers the check (middleware) | FR21 | PASS |

## 19. Administrator activity monitoring

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 19.01 | Admin gets activity analytics |  | PASS |
| 19.02 | Set-up: register activity student |  | PASS |
| 19.03 | Set-up: verify activity student |  | PASS |
| 19.04 | Set-up: activity profile saved |  | PASS |
| 19.05 | Student total goes up by one after a sign-up |  | PASS |
| 19.06 | Seven-day sign-ups go up by one |  | PASS |
| 19.07 | Active users counts the new login |  | PASS |
| 19.08 | Daily series covers 14 days ending today |  | PASS |
| 19.09 | Today's sign-ups include the new student |  | PASS |
| 19.10 | Newest event in the feed is the sign-up |  | PASS |
| 19.11 | Status breakdown adds up to total applications |  | PASS |
| 19.12 | Status breakdown has exactly the three statuses |  | PASS |
| 19.13 | Top listings has at most 5 rows |  | PASS |
| 19.14 | Feed has at most 15 rows |  | PASS |

## 20. Account deletion and re-registration

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 20.01 | Set-up: register delete student |  | PASS |
| 20.02 | Set-up: verify delete student |  | PASS |
| 20.03 | Set-up: delete profile saved |  | PASS |
| 20.04 | Set-up: register delete-target provider |  | PASS |
| 20.05 | Set-up: verify delete-target provider |  | PASS |
| 20.06 | Wrong password does not delete | FR30 | PASS |
| 20.07 | Missing password does not delete | FR30 | PASS |
| 20.08 | Anonymous delete is refused | FR30 | PASS |
| 20.09 | Admin accounts cannot self-delete | FR30 | PASS |
| 20.10 | Student deletes their account | FR30 | PASS |
| 20.11 | Every row about the student is gone | FR30 | PASS |
| 20.12 | Old token no longer works | FR30 | PASS |
| 20.13 | Old credentials no longer log in | FR30 | PASS |
| 20.14 | Stored files were removed from Supabase Storage | FR30 | PASS |
| 20.15 | Same email can sign up again (acceptance criterion) | FR30 | PASS |
| 20.16 | Returning user verifies and is signed in | FR30 | PASS |
| 20.17 | Returning user starts with a clean account | FR30 | PASS |
| 20.18 | Set-up: register delete-applicant student |  | PASS |
| 20.19 | Set-up: verify delete-applicant student |  | PASS |
| 20.20 | Set-up: delete-applicant profile saved |  | PASS |
| 20.21 | Provider deletes their account | FR30 | PASS |
| 20.22 | Provider, its listings and their applications are gone | FR30 | PASS |
| 20.23 | Affected applicant is told the application was removed | FR30 | PASS |
| 20.24 | Same provider email can sign up again | FR30 | PASS |

## 21. Security

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 21.01 | Set-up: register sec student |  | PASS |
| 21.02 | Set-up: verify sec student |  | PASS |
| 21.03 | Set-up: sec profile saved |  | PASS |
| 21.04 | Passwords are stored hashed by Django | NFR1 | PASS |
| 21.05 | Legacy student.passwordhash column is unused | NFR1 | PASS |
| 21.06 | No password or hash in API responses | NFR1 | PASS |
| 21.07 | SQL injection probe at login refused (' OR '1'='1) | NFR4 | PASS |
| 21.08 | SQL injection probe at login refused (1; DROP TABL) | NFR4 | PASS |
| 21.09 | SQL injection probe at login refused (" OR 1=1 --) | NFR4 | PASS |
| 21.10 | SQL injection probe in a query parameter refused | NFR4 | PASS |
| 21.11 | Non-numeric ids do not reach the database | NFR4 | PASS |
| 21.12 | All 10 tables still exist after the probes | NFR4 | PASS |
| 21.13 | Bad input returns a clean error, not a crash | NFR4 | PASS |
| 21.14 | Error responses carry no stack trace | NFR4 | PASS |
| 21.15 | Uploaded file names cannot choose the storage path | NFR4 | PASS |
| 21.16 | Database connection requires SSL | NFR2 | PASS |
| 21.17 | Authentication tokens expire | NFR3 | **WARN**: Known limitation: tokens are valid until logout |

## 22. Performance

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 22.01 | Set-up: register perf student |  | PASS |
| 22.02 | Set-up: verify perf student |  | PASS |
| 22.03 | Set-up: perf profile saved |  | PASS |
| 22.04 | Eligible view responds in under 2 seconds (716 ms) | NFR9 | PASS |
| 22.05 | All view responds in under 2 seconds (1059 ms) | NFR9 | PASS |
| 22.06 | Dashboard responds in under 2 seconds (532 ms) | NFR9 | PASS |
| 22.07 | Notifications responds in under 2 seconds (721 ms) | NFR9 | PASS |
| 22.08 | Admin activity responds in under 2 seconds (1296 ms) | NFR9 | PASS |
| 22.09 | 500 concurrent users | NFR9 | **WARN**: Not measured: needs a load-testing tool against the deployed site |

## 23. Deployment configuration

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| 23.01 | requirements.txt is plain UTF-8 (hosts can read it) |  | PASS |
| 23.02 | requirements.txt includes django |  | PASS |
| 23.03 | requirements.txt includes djangorestframework |  | PASS |
| 23.04 | requirements.txt includes psycopg2-binary |  | PASS |
| 23.05 | requirements.txt includes django-cors-headers |  | PASS |
| 23.06 | requirements.txt includes python-dotenv |  | PASS |
| 23.07 | requirements.txt includes requests |  | PASS |
| 23.08 | requirements.txt includes reportlab |  | PASS |
| 23.09 | requirements.txt includes gunicorn |  | PASS |
| 23.10 | .env.example lists DJANGO_SECRET_KEY |  | PASS |
| 23.11 | .env.example lists DB_HOST |  | PASS |
| 23.12 | .env.example lists SUPABASE_URL |  | PASS |
| 23.13 | .env.example lists SUPABASE_SERVICE_KEY |  | PASS |
| 23.14 | .env.example lists EMAIL_HOST_PASSWORD |  | PASS |
| 23.15 | .env.example lists FRONTEND_URL |  | PASS |
| 23.16 | SUPABASE_URL has no /rest/v1 suffix |  | PASS |
| 23.17 | Behind a hosting proxy, HTTPS is detected (no redirect loop) | NFR2 | PASS |
| 23.18 | CSRF trusted origins follow the frontend/backend URLs | NFR2 | PASS |
| 23.19 | Frontend reads the API address variable its .env sets |  | PASS |
| 23.20 | DEBUG is off | NFR2 | **WARN**: DEBUG is on in this .env; set DEBUG=False on the server |
| 23.21 | Real SMTP email backend configured | NFR7 | PASS |

## Frontend build

| ID | Check | Requirement | Result |
| --- | --- | --- | --- |
| Frontend.01 | Frontend production build succeeds |  | PASS |
