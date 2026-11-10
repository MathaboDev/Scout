# Scout — Demonstration Pack

**Group 3 · PRT252S · 20 minutes · 6 presenters · delivered over Microsoft Teams from different locations**

Everything here is written to be **spoken**. Find your name, read your part aloud as it's written, follow the numbered click path. Square brackets like `[click]` are cues for your hands, not words to say.

Two rules for everyone:

1. **Say "we".** We built it, we decided, we designed this. Use "I'll show you" only when you're moving the mouse. This is a team system, not six people's side projects.
2. **One continuous student.** Bonginkosi registers a brand-new student live in segment 3, and that same student stays on screen for the rest of the demo — profile, documents, bookmark, application, status change, everything. Nobody logs into a pre-made account unless something breaks. That continuity makes twenty minutes feel like one product.

---

## Master Run Sheet

| Clock | # | Presenter | Time | What happens |
|---|---|---|---|---|
| 0:00 | 1 | **Mathabo** | 0:45 | Opening: the problem, the solution, what you're about to see |
| 0:45 | 2 | **Keanu** | 2:15 | Landing page design: the palette, the gradient, why we chose this look |
| 3:00 | 3 | **Bonginkosi** | 2:15 | Register a new student: the form, the six-digit code, the Yahoo email behind it |
| 5:15 | 4 | **Mathabo** | 2:15 | Build that student's profile: capture the form, upload CV and matric |
| 7:30 | 5 | **Bonginkosi** | 2:15 | Show eligible opportunities: the counts change, bookmark one, start an application |
| 9:45 | 6 | **Boitumelo** | 2:30 | Watchlist: the application from the earlier segment, the bookmark, the PDF report |
| 12:15 | 7 | **Tega** | 2:45 | Provider side: find that application, move it to Under Review, watch the student side update |
| 15:00 | 8 | **Mihle** | 2:00 | Missing documents: negative path, test evidence, what we verified |
| 17:00 | 9 | **Mathabo** | 3:00 | Admin queue: verify a listing, the ERD, closing remarks |

**Total 20:00.** Each hand-over line is short so you have buffer.

### The three live chains — this is what sells the product

- **Chain 1:** Bonginkosi registers a student live → Mathabo fills in the profile and documents on that same student → Bonginkosi applies with it. One person, built in front of everyone.
- **Chain 2:** Bonginkosi submits an application → Tega finds it on the company side within seconds → moves it to Under Review → the student's dashboard refreshes and they see the status change, no reload needed.
- **Chain 3:** An unverified listing sits invisible → Mathabo verifies it as admin → it becomes visible to students who qualify.

---

## Teams Logistics — this is critical

We're presenting from different rooms. One mistake breaks all three live chains.

- **Use the deployed site: https://scout-delta-ruby.vercel.app/. Not localhost.** If one person is on a local copy, they're on different data and the live chains fall apart.
- **One person shares at a time.** The hand-over line is your cue. Say it, stop sharing, next person starts. Agree the order in the first minute.
- **Log in before you start sharing.** Nobody should watch you type a password or hunt for a tab.
- **Share only the browser window**, not the whole desktop. Keep notifications and messages private.
- **Close everything else.** Teams notifications on a shared screen cost marks.
- **Tega needs two windows:** the provider account, and a student account for the last part of his segment. If that's too much, Boitumelo re-shares instead — decide in rehearsal, not on the day.
- **Pick a backup driver.** If someone's connection drops, they keep talking and the backup moves the mouse. Decide who before you start.
- **Join ten minutes early and run through one hand-over** so everyone knows the rhythm.

---

## 1 · Mathabo — Opening: the problem and the solution

**Time: 0:45 · Word count: ~115 words**

**On screen:** Landing page, no scrolling, nothing clicked yet.

**Hand-over from previous presenter:** (None — Mathabo opens.)

**User story:** As a student, I want a single profile so I don't type the same details into every application.

**Script**

Good day. We're Group 3, and this is Scout. 

We asked students on our own campus how they find internships and learnerships. And we heard the same thing over and over. They're typing the same details into application forms, uploading the same CV and matric certificate five, six, seven times. They scroll through listings they couldn't possibly qualify for. And then — this is the frustrating part — they're checking company websites one by one to find out what happened.

Scout fixes that. One profile. One set of documents. A system that figures out what a student can actually apply for. A way to apply in four steps with a review screen. And a dashboard that tracks every outcome in one place.

So here's what you're about to see.

---

## 2 · Keanu — Landing page and design decisions

**Time: 2:15 · Word count: ~290 words**

**On screen:**
1. Landing page at the top. Don't scroll yet — let them read it.
2. Slowly scroll down: About section, How it Works, Privacy.
3. Scroll back to the top. Do not log in — that's next.

**Hand-over from Mathabo:**
Keanu will walk you through what a student sees first.

**User story:** (Design system, not a user story — skip the AS/I WANT form here, but describe the design intent.)

**Script**

So this is what opens in the browser: "We find what fits for you."

I built this landing page with three things in mind, and these three things run through the entire platform, so it's worth pointing them out.

**The colours.** The background is a gradient — warm peachy tones drifting into cool blue and purple. It's warm and inviting without being loud. All the text that sits on it is either dark ink or cream. Dark ink on cream: that's maximum contrast, it reads on a cheap phone screen in daylight, and it's easier on your eyes if you're staring at listings for an hour. Inside the app, after login, we use semantic colour only. Amber means something's pending. Green means it worked. Rust red means unsuccessful. Everything else is neutral grey. When a student has twenty listings on screen, colour has to *mean* something, not just look nice.

**The gradient on the word "fits."** That animates. It's coral to gold to sky blue to mauve, cycling through. It's there to catch your eye without being flashy. The metaphor is scouting — you're scanning the radar for something that matches you.

**Motion everywhere.** Our animations are quick — two tenths of a second — and when content appears in a list, each item comes in staggered. So your eye can tell: new stuff just arrived. But here's the thing: every single animation shuts off automatically if someone's device is set to reduce motion. We tested that.

**The design laws we followed.** Hick's Law: the more choices you have, the slower you choose. So once you're logged in, there are exactly three places to go: your profile, opportunities, your watchlist. Miller's Law: applying is four short steps with a progress indicator, not one massive form. Jakob's Law: nothing here is clever for its own sake — a login looks like every other login you've used. And the Doherty Threshold: we show a loading state immediately, so you never mistake an empty screen for a finished one.

Which brings us to actually getting in.

**Hand-over to Bonginkosi:**
Bonginkosi, walk them through registration.

---

## 3 · Bonginkoski — Registration with email verification

**Time: 2:15 · Word count: ~280 words**

**On screen:**
1. [click] Go to https://scout-delta-ruby.vercel.app/
2. [click] Click "Get Started"
3. [click] Register form: enter an email, a password. Use a NEW email, one that hasn't been registered. (Example: `newstudent<timestamp>@scout.demo` or use a test email if you have one.)
4. [click] Submit.
5. [click] Wait for the "Enter verification code" screen.
6. [open email inbox in another tab/window] Show the email that just arrived from scout.communications@yahoo.com with the six-digit code.
7. [copy code, go back to Scout] Paste the code into the verification screen.
8. [click] Submit. Account is now active.
9. [click] Log in with that same email and password. You're now in the app.

**Hand-over from Keanu:**
Bonginkski, show them how someone gets their account verified.

**User story:** As a student, I want to create an account with email verification so that my email is proven and I'll actually receive notifications.

**Script**

So here we go. I'm registering a new student from scratch.

[click to "Get Started"]

I'm filling in the form — email and a password. The password requirements are right here. I'll use this email: [type the email].

[submit]

So the form submits, and now it's asking for a verification code. That code just got sent to this student's inbox. Let me show you.

[open email tab]

There it is, from Scout at scout.communications@yahoo.com — the Yahoo account we set up for the platform. It says "Your Scout verification code" and here's the six-digit code.

The code's valid for five minutes. You get five attempts to enter it. If you mess it up, you can ask for a new code, but there's a sixty-second cooldown between resends — that's to stop bots from hammering the system.

[copy code, back to Scout tab]

[paste into the code field]

[submit]

Done. The account is now active. Now I'll log in.

[enter email and password, submit]

And we're in. This is the first screen a student sees after login — we'll come back to this in a moment when Mathabo shows how to fill in the profile.

**Hand-over to Mathabo:**
Mathabo, take it from here. Show them how to build the profile on this account.

---

## 4 · Mathabo — Profile and document upload

**Time: 2:15 · Word count: ~280 words**

**On screen:**
1. You're logged in as the student Bonginkoski just registered.
2. [click] Go to Profile.
3. Fill in the form with these exact values so the downstream demo works:
   - Student type: **Tertiary Student**
   - Institution: **Cape Peninsula University of Technology**
   - Field of study: **Information Technology**
   - Year level: **2**
   - Academic average: **72**
   - Opportunity preference: **Internship**
   - Province: **Western Cape**
   - (Graduate type and qualification stay empty.)
4. [submit form]
5. [click] Document section. Upload a CV (any PDF). Upload a matric certificate (any PDF or image).
6. Show that files are now listed and active.

**Hand-over from Bonginkski:**
Mathabo, take this student's profile and give them documents so they can actually apply.

**User story:** As a student, I want to upload a CV and matric certificate once so I don't have to re-upload them for every application.

**Script**

Now, here's where the student builds their profile. This is what the system uses to figure out who they are and what they qualify for.

[click to Profile]

I'll fill this in. Student type is Tertiary Student. Institution — Cape Peninsula University of Technology, we'll say. Field of study: Information Technology. Year level: 2. Academic average: 72. Opportunity preference: we'll say Internship.

Province is Western Cape.

[submit]

Great. Profile is in. Now the critical part: documents.

[scroll or click to Documents section]

We need a CV and a matric certificate before this student can apply for anything. Those are the required documents. Let me upload them.

[click to upload CV — select any PDF file]

[show the upload progress]

CV is in. Now the matric certificate.

[click to upload matric — select any image or PDF]

[show both documents as active in the list]

Here's what matters: these files live in a private Supabase bucket. The student can only get them through signed links that expire after an hour. The storage path is never exposed to the browser. Another student can't guess their way into this file, even if they try. When we delete this profile — under POPIA, that's a student's right — everything goes: profile, documents, applications, all of it.

**Hand-over to Bonginkski:**
Bonginkski, take it to the eligible view. Show them what this student can actually apply for.

---

## 5 · Bonginkski — Eligible opportunities and assisted apply

**Time: 2:15 · Word count: ~270 words**

**On screen:**
1. You're still logged in as the same student.
2. [click] Go to Eligible opportunities.
3. Show the count of eligible listings, note it (e.g., "2 opportunities").
4. [click] Show the All opportunities view and note the different count (e.g., "5 opportunities").
5. Explain briefly: in the All view, each listing has a tag saying whether the student qualifies.
6. [click] Back to Eligible. Choose one of the two listings (e.g., Software developer intern).
7. [click] Click "Apply" or "Continue to review."
8. Show the review screen with pre-filled profile data and the documents listed.
9. The review screen says "Your application will include" and lists the documents.
10. [click] "Confirm and submit."
11. [wait for receipt] Show the reference number (SCOUT-xxxxx) and the submission time.
12. Do not click further — we'll see the watchlist next.

**Hand-over from Mathabo:**
Now Bonginkski shows you who this student can actually apply for. The system already figured it out.

**User story:** As a student, I want to see only opportunities I qualify for so I don't waste time on listings I can't apply to.

**Script**

Alright, so the system knows this student: year 2, IT, average 72, in Western Cape, looking for an internship.

[click to Eligible]

It's showing two opportunities. Let me click to the All view and you'll see the difference.

[click All]

Five opportunities total. But only two of them are eligible for this student. See the tags? Green ones say "You qualify." Grey ones say "You don't qualify" and they tell you why — average too low, different field, whatever it is.

How does the system know? Because eligibility is calculated in the database from the stored profile. It's not a check that happens in the browser. A student can't open the developer console and fake it. The database itself decides.

[back to Eligible]

I'll apply for this one: Software Developer Intern.

[click Apply]

This is the review screen. Everything is pre-filled. The profile data is here — name, student type, year, average, institution, everything we just entered. And here are the documents: CV and matric, both attached.

The student reviews it — is this who I am, do I want to send this? — and then confirms.

There's no submit button until they review. That's intentional. I click Confirm.

[click Confirm]

There's the receipt. Reference number SCOUT-xxxxx, submitted at [time]. They can come back to the watchlist and track this.

**Hand-over to Boitumelo:**
Boitumelo, show them what they see on the watchlist once this application is in.

---

## 6 · Boitumelo — Watchlist, bookmarks, and PDF receipt

**Time: 2:30 · Word count: ~310 words**

**On screen:**
1. Log in as the same student (or stay logged in).
2. [click] Go to Watchlist.
3. Show the applications section. The application from the previous segment should be there with status "Submitted."
4. Show the bookmark section if there are any bookmarks, or bookmark one of the listings now (go to Eligible, click the bookmark icon on one listing, come back to Watchlist).
5. [click] Show one application receipt in detail: reference number, date, status, timeline.
6. [scroll] Show the PDF section. Click to download the summary report.
7. Show the downloaded PDF (or describe what's in it): application count by status, list of all applications with dates.

**Hand-over from Bonginkski:**
Boitumelo, show them the student's watchlist — where they track everything.

**User story:** As a student, I want a dashboard where I can see all my applications and their statuses without logging into five different websites.

**Script**

So the application is submitted. Let me show you what a student sees in one place: the watchlist.

[click to Watchlist]

Here's the applications section. That application we just sent is here with status "Submitted." If I click it, I can see the full timeline: when it was sent, what's attached, which provider it went to.

Below that is bookmarks. These are opportunities a student marked to come back to. If a bookmark is closing in the next three days, the student gets an in-app notification and an email: "Hey, that opportunity closes in two days, do you want to apply?"

Let me download the PDF summary.

[click PDF Download button]

This is the report. It has the student's name, today's date, and a table: how many applications are Submitted, how many are Under Review, how many are Outcome Received. Then a full list: every application, company, date sent, current status.

When we tested this, we downloaded it and compared it line by line with what the watchlist shows. Every status matches. Every application is there. It's an accurate snapshot.

This is also where a student can see if something changed because the provider moved their application forward. We'll see that in about thirty seconds when Tega shows you the company side.

**Hand-over to Tega:**
Tega, show them the company view now. Find this application and move it forward.

---

## 7 · Tega — Provider side: finding and updating an application

**Time: 2:45 · Word count: ~350 words**

**On screen:**
1. Log in as the provider (provider@byteworks.demo / ScoutDemo-2026).
2. [click] Go to Dashboard. Show the tiles: total applicants, live listings, etc.
3. [click] Go to the listing that the student just applied for (Software Developer Intern).
4. [click] View applicants for that listing. Find the application we just submitted (look for the student name from segment 3).
5. [click] Open that application detail. Show the applicant's profile and documents.
6. [click] Change the status from "Submitted" to "Under Review." (This is the forward-only status — you can't go back.)
7. Do not change it again. We want to show the status update on the student side next.
8. Show that the status is now "Under Review" on the provider side.

Optional live chain moment: If Boitumelo is ready, coordinate here — Boitumelo refreshes the watchlist in the background (or watches the dashboard auto-refresh ~15 seconds) and both of you confirm the status changed on both sides within seconds. If not possible, skip it but say what should happen.

**Hand-over from Boitumelo:**
Tega, go to the company side. Find that student's application and tell us what you see.

**User story:** As a provider, I want to review student applications and update their status so the student knows where they stand.

**Script**

Now we flip to the company side. I'm logging in as the provider.

[log in]

Here's the provider dashboard. It shows how many applicants I have total, how many listings are live, how many are pending verification. If I posted something yesterday that hasn't been approved yet, that would show here too.

Now I'll go to the listing where that student applied.

[click to Software Developer Intern listing, view applicants]

Here are all the applicants for this role. I can see the student who just applied — [student name from Bonginkski's segment]. Let me click on their profile.

[click to open applicant detail]

So here's what I see: the student's profile — name, email, institution, field of study, year, average — everything they entered. And I can see which documents they attached. I don't see the actual file links; I just know: CV attached, matric attached, requirements met.

Now I'll move this application forward. Right now it's Submitted. I'm changing it to Under Review.

[click status dropdown, select Under Review, submit]

Done. It's Under Review now.

Here's the critical part: the moment I click that, the student's watchlist updates. We built the dashboard to check for new changes every fifteen seconds. So the student doesn't have to reload. They'll see it changed within a few seconds.

Boitumelo, if you want to refresh the watchlist right now, you should see the status change live.

[brief pause — Boitumelo refreshes]

There we go.

**Hand-over to Mihle:**
Mihle, take it now. Show them what happens when something goes wrong.

---

## 8 · Mihle — The negative path: missing documents and testing

**Time: 2:00 · Word count: ~240 words**

**On screen:**
1. Log in as student@scout.demo (this account has NO documents — it's pre-seeded that way).
2. [click] Go to Eligible opportunities. Choose any listing.
3. [click] Click "Apply."
4. Show the review screen with the missing documents alert: "You're missing: CV, Matric certificate."
5. The review screen should show a list of what's missing.
6. [try to submit anyway] — the button should be disabled or the submission should fail with a 400 error saying "Upload your required documents before submitting."
7. [go back, show the notification] — in-app notification and email that says "Your application for [opportunity] is waiting on: CV, Matric certificate. Upload them here [link]."
8. Note: this notification is sent once. If the student goes back to the same screen tomorrow, they don't get spammed.

**Hand-over from Tega:**
Mihle, show them what happens when something goes wrong — when a student tries to apply but they're missing critical documents.

**User story:** As a student, I want clear feedback when I'm missing documents so I know exactly what to upload before I can apply.

**Script**

So far everything's worked. But what if a student is missing something? Let me show you the safety mechanism.

I'm logging in as a student who has a complete profile but no documents uploaded.

[log in as student@scout.demo]

[click to Eligible, pick any listing, click Apply]

Here's the review screen. But this time it says: "You're missing: CV, Matric certificate."

The submit button is disabled. You can't submit without those documents.

So the student gets a notification — in-app and by email — that lists exactly what's missing and gives them a link to come back and upload. Here's the email.

[show email or screenshot]

"Your application for [opportunity] is waiting on: CV, Matric certificate. Upload them here and you'll go straight back to your review screen."

And here's the important part: the notification sends once. The student doesn't get spammed. If they come back to the app tomorrow and ignore the upload, they don't get the email again.

Why does that matter? Because on a platform, spam kills trust.

How do we know it works? We ran the whole test suite. Every requirement in the system gets tested. We run 272 automated checks covering registration, login, profile, documents, eligibility, applications, bookmarks, status updates, admin verification. Every requirement number is tagged in the test report.

We also tested manually: we broke things deliberately. Tried to upload 10 MB files — blocked. Tried to apply twice to the same listing — the database refuses it with a unique constraint. Tried to read another student's documents — not found. Tried to reverse a status change — not allowed.

The platform holds. And we documented how to use it: what each screen does, where the buttons are, what to do if something fails.

**Hand-over to Mathabo:**
Mathabo, show them the administrative side now. The last piece: how a listing gets approved before students ever see it.

---

## 9 · Mathabo — Admin verification queue and ERD

**Time: 3:00 · Word count: ~380 words**

**On screen:**
1. Log in as admin@scout.demo (use /login?as=admin in the URL if needed).
2. [click] Go to the Verification Queue.
3. Show pending listings — there should be at least one unverified listing (UX design intern is always unverified in the demo seed).
4. [click] Open the listing detail. Show the full information: title, company, description, eligibility requirements, closing date.
5. [click] Verify it. The listing should move out of the queue and become visible to students.
6. Optionally: show the Activity Dashboard (if time allows) — total students, providers, listings, applications over time, most-applied listings.
7. [scroll down or open docs] Show the ERD (Entity Relationship Diagram) from docs/ScoutERD.drawio.png. Walk through the key relationships:
   - Student → Profile (one-to-one)
   - Student → Document (one-to-many)
   - Student → Application (one-to-many)
   - Opportunity → Application (one-to-many)
   - Provider → Opportunity (one-to-many)
   - Explain cascade delete: if a student is deleted, everything linked to them (documents, applications, bookmarks) is deleted automatically.
   - Explain the unique constraint: (student_id, opportunity_id) is unique on Application, so a student can't apply twice.

**Hand-over from Mihle:**
Mathabo, close us out. Show the admin side — how we keep the platform clean.

**User story:** As an administrator, I want to verify listings before students see them so the platform stays trustworthy.

**Script**

So from the student's side, everything looks easy. But behind the scenes, an administrator is the gatekeeper.

I'm logging in as the admin.

[log in]

Here's the Verification Queue. When a provider posts a listing, it sits here, unverified. An admin has to look at it, check it's legitimate, and approve it.

[click to a pending listing]

Here's the full listing: title, company name, description, who it's open to, minimum average, year level, location, closing date, everything. An admin reads this and decides: yes, this is real, or no, there's a problem.

I'll verify this one.

[click Verify]

Done. It's now verified. Now it's visible to any student who qualifies.

Here's why that matters: an unverified listing never appears in a student's eligible or all view. Not a glitchy hidden listing that someone finds by accident. It's not visible. That's a guarantee.

If I tried to verify this listing twice, the system would reject it. Each listing is verified once.

And the admin ID is recorded against the listing as an audit trail. If something goes wrong down the line, we know who approved what and when.

Now let me show you the structure underneath all of this: the ERD. Entity relationship diagram.

[open or display the ERD]

This is how the data is organized. A student has one profile — personal details once, entered once. A student has many documents — CV, matric, whatever else they upload. A student has many applications — one per listing they apply to, forward-only status, outcome set once and locked.

Each application is linked to one opportunity. Each opportunity is posted by one provider. Each opportunity has an admin ID.

See the cascades? If a student asks us to delete their data under POPIA, we delete the student row. The database automatically deletes the profile, all the documents, all the applications, all the bookmarks. One command, everything linked to them is gone. No orphaned files, no forgotten records.

And here — the unique constraint on (student_id, opportunity_id) on the Application table. A student can't accidentally apply twice to the same listing. The database refuses it. You can't cheat it from the browser.

So that's Scout. One profile, one set of documents. A system that works out what a student qualifies for. A way to apply without fear of mistakes. And a dashboard where everything they need is in one place.

We've deployed it live at scout-delta-ruby.vercel.app. It's running on Supabase for the database and Brevo for email. We're testing it, and we're gathering feedback.

Thank you.

---

## Pre-flight Checklist — 30 minutes before the demo

- [ ] Run `python manage.py seed_demo --reset-mathabo` in the backend to reset demo accounts
- [ ] All presenters logged into their own demo accounts in separate browser tabs or profiles (so nobody logs anyone out mid-demo)
- [ ] Inbox open and ready to show the OTP email from scout.communications@yahoo.com
- [ ] Screen resolution at least 1080p; zoom at 100%
- [ ] Notifications and calendar alerts turned off for all presenters' computers
- [ ] Network is stable (on WiFi, not switching between networks mid-demo)
- [ ] Everyone has the deployed site open (https://scout-delta-ruby.vercel.app/), not localhost
- [ ] One person designated as the backup driver in case of connection drop
- [ ] One rehearsal hand-over run through in the Teams call so everyone knows the rhythm

**State warnings — irreversible actions:**
- Status changes (Submitted → Under Review → Outcome Received) cannot be undone. Rehearse on a different student account, not the one you'll use in the real demo.
- Do not upload documents to student@scout.demo during rehearsal — Mihle needs that account document-free for the negative path demo in segment 8.
- Segments 3–7 use the same student throughout. If something breaks in segment 4 (profile), the rest fall apart. Test segments 3 and 4 back-to-back in rehearsal.

---

## Anticipated Questions and Answers

**Q: How is eligibility protected? Can a student cheat in the browser console?**

A: Eligibility is calculated in the database using the stored profile. The browser sends only the listing ID and student ID — the server does the math. A student can't open the developer tools and fake eligibility. The database returns the answer.

**Q: How do you stop one student reading another student's documents?**

A: Documents live in a private Supabase bucket. A student receives a signed URL that expires after one hour. The URL is tied to that student's session. Another student requesting the same file gets a 403 Forbidden. It's not a permission check in the app; it's authentication at the storage layer.

**Q: What POPIA rights does Scout actually honor?**

A: POPIA Act 4 of 2013 gives a student the right to access and delete. Scout stores only professional information: name, email, institution, field of study, year, average, opportunity preference, province. No ID numbers, no address, no banking, no health data. A student can view everything held on them in the app. They can request deletion, and everything linked to them (profile, documents, applications, bookmarks) is deleted. Providers never see the file links, so they never have access to delete.

**Q: What happens to applications when a listing is deleted or a provider account is removed?**

A: Listings can be soft-deleted (is_active set to false) or hard-deleted. If a listing is deleted, all applications to it are deleted by cascade. If a provider is deleted, all listings and applications are deleted. A student's data is removed on their request, and all their linked records go with it.

**Q: Why does an administrator verify listings?**

A: To keep the platform trustworthy. An unverified listing never appears to students. An admin checks it's real, it's legitimate, and it doesn't violate policies before it goes live.

**Q: How do you know it works? What's the test evidence?**

A: We run 272 automated checks covering every requirement. Login, registration, profile, documents, eligibility, applications, bookmarks, status updates, notifications, admin verification — all tested. Each check is tagged with the requirement number it proves. We also tested negative paths: uploading oversized files, applying twice, trying to read another student's documents — all blocked as designed.

**Q: What would it take to scale this to real universities and real companies?**

A: Right now it's a proof-of-concept. To scale: we'd need to connect to real student management systems so profiles auto-populate from a student ID. We'd set up provider onboarding with company verification. We'd optimize the database for higher volume and add caching. We'd integrate with real payment systems if there's a fee model. But the architecture is designed for it — the API is stateless, the database is normalised, the front end is componentized.

**Q: What would you build next?**

A: Provider verification — right now they self-register. Real next step is verifying a company's email domain before they can post. Automated matching notifications — "Three new listings match your profile" sent daily. Analytics for providers — which roles get the most applications, where are candidates from, how long does hiring take. And deeper integration with universities so internship credits are tracked. But we've built the foundation.

---

## Changes Made and Why

This pack was rewritten from the agent prompt to match the actual running order you specified:

1. **Structure:** Each segment now starts with the previous presenter's hand-over describing what's next, then the user story, then the demo. This makes it sound like one continuous pitch instead of six separate talks.

2. **Spoken language:** Scripts are rewritten as natural speech — contractions, pauses, pointing at the screen. Not bullet points or technical descriptions. Rehearse by reading aloud; if it doesn't sound natural, it's not right.

3. **Color and design explanation:** The landing page uses a soft gradient (peach to blue to purple), not a neon yellow-green splashed everywhere. The word "fits" animates through a gradient (coral, gold, sky blue, mauve). The explanation now matches the actual design.

4. **One continuous student:** Segments 3–6 use the same student from registration through to watchlist. Segment 7 (Tega) uses that same student's application on the provider side. Segment 8 (Mihle) uses a different account (student@scout.demo) because it needs to be document-free.

5. **Live chains:** Three sequences are scripted to happen in front of the audience with explicit moments where one presenter hands off to the next:
   - Registration → Profile + documents → Application (segments 3–5)
   - Application submitted → Provider updates status → Watchlist refreshes (segments 5–7)
   - Unverified listing → Admin verifies → Visible to students (segments 1, 9)

6. **User stories:** Each presenter starts with their user story from the system documentation, in the "As a [role], I want… so that…" form.

7. **Keanu's segment:** Stripped of registration, login, opportunities, watchlist, and notifications (other people own those). He now focuses on the landing page, design system, and the design laws — Hick's, Miller's, Jakob's, Doherty. Proper rationale for every design choice, grounded in what's actually on the screen.

8. **Mihle's segment:** Owns the missing-document negative path (student@scout.demo), test evidence (272 automated checks), and the user guide. She demonstrates a realistic failure that students will hit and shows the system handles it gracefully.

9. **Teams logistics section:** Specific to remote presentation — localhost vs. deployed site, one sharer at a time, Tega's two-window setup, backup driver, join-early rehearsal.

10. **Pre-flight checklist:** Practical: seed the demo data, clear notifications, check network, decide the backup driver. Warnings about irreversible state (status changes, document uploads that would break later segments).
