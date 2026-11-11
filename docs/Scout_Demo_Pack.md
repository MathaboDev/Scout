# Scout — Demonstration Pack

**Group 3 · PRT252S · 20 minutes · 6 presenters · Microsoft Teams**

Read your part aloud as written. `[Square brackets]` are instructions, not words to say. User stories are quoted word for word from our system documentation.

## Four rules

1. **Say "we".** We built it, we decided. "I'll show you" is only for when you're moving the mouse.
2. **One student, start to finish.** Bonginkosi registers John live. Everyone then logs into John's account on their own computer and the whole student side is shown on him.
3. **Never click "Log out" on John's account.** Logging out deletes the token everyone shares, and the others get kicked out on their next click. If it happens, just log in again. Use a private window for any other account.
4. **Only the presenter clicks.** Applying and status changes can't be undone.

## Run sheet

| Clock | Presenter | Time | User story | What happens |
|---|---|---|---|---|
| 0:00 | Mathabo | 0:45 | — | The problem and what Scout does |
| 0:45 | Keanu | 2:15 | — | Landing page and design choices |
| 3:00 | Bonginkosi | 2:15 | US1 | Registers John, verifies the email |
| 5:15 | Mathabo | 2:15 | US3, US4 | John's profile, documents, what he qualifies for |
| 7:30 | Bonginkosi | 2:15 | US5 | Bookmarks, then applies with the review screen |
| 9:45 | Boitumelo | 2:30 | US7 | Watchlist, receipt, bookmarks, PDF report |
| 12:15 | Tega | 2:45 | US11 | Company records an outcome; John's dashboard updates |
| 15:00 | Mihle | 2:00 | US6 | Missing documents |
| 17:00 | Mathabo | 3:00 | US12 | Admin verifies a listing, the ERD, close |

**The three live chains**

1. Bonginkosi registers John → Mathabo builds his profile → Bonginkosi applies with it.
2. John applies → Tega records the outcome as the company → John's watchlist turns green by itself.
3. A listing sits pending (Tega's dashboard shows it) → Mathabo verifies it → John can now see it.

---

## Tonight — must be done before the demo

- [ ] **Push the latest backend** so the styled verification email is live. Register once with a real address and check it arrives.
- [ ] **Put a listing in the admin queue.** The queue is currently **empty**: "UX design intern" is already verified. Log in as `provider@byteworks.demo`, post a new listing (e.g. *Junior QA tester intern*: Information Technology, Internship, open to Any, no minimum average, closes in 30 days) and **don't verify it**. It shows as "Pending verification" for Tega and waits in Mathabo's queue. Because John qualifies for it, it appears for him once verified.
- [ ] **Get the real test number** for the Q&A. Run `python manage.py system_test` and note the count it prints.
- [ ] **Rehearse on a throwaway student**, never on the presentation account. If you verify the pending listing in rehearsal, post a fresh one afterwards.
- [ ] Mihle's account `student@scout.demo` must stay **document-free**. Nobody uploads to it.

## On the day — Teams setup

- Everyone uses **https://scout-delta-ruby.vercel.app/**, never localhost.
- Share **the browser window only**. One sharer at a time; the hand-over line is the cue to swap.
- Turn off notifications. Close unrelated tabs.
- **Separate private windows, logged in before the call:** Tega has `provider@byteworks.demo`, Mathabo has `admin@scout.demo` (at `/login?as=admin`), and Mihle has `student@scout.demo`. Tega also needs John open in a second window.
- Agree on a backup driver in case someone's connection drops. Join 10 minutes early.

---

## 1 · Mathabo — Opening (0:45)

**On screen:** Keanu shares the landing page; Mathabo talks over it. Nothing is clicked.

Good day, we're Group 3, and this is Scout.

When we spoke to students about finding internships and learnerships, we kept hearing the same story. They type the same details into every application form. They upload the same CV and matric certificate again and again. And afterwards they check company websites one by one to find out what happened.

Scout fixes that. One profile, one set of documents. Scout works out what you actually qualify for, helps you apply, and tracks every outcome on one dashboard.

Each of us will take one of our user stories and show it working, live, on one student.

Keanu will now walk us through what a student sees first.

---

## 2 · Keanu — Landing page and design (2:15)

**On screen:** Landing page at the top → scroll slowly through About, How it works, Privacy → back to the top. Don't log in.

This is the first thing a student sees: "We find what fits for you." We had about three seconds to explain Scout, so the page just says it.

[Point at the background.]
The colour first. The background is a soft gradient, warm peach and coral drifting into blue and pink, and it moves slowly. We wanted it to feel warm and hopeful, because job hunting is stressful. The headline sits on it in big white type, and the buttons are solid black, so you always know where to click.

[Point at "fits".]
The word "fits" shimmers through coral, gold, blue and pink. That's the one word we wanted you to remember.

Once you're signed in, it changes on purpose. A plain cream background, near-black text, and colour only where it means something: amber is pending, green is successful, red is unsuccessful, and everything else is grey. When a student has twenty listings on screen, colour has to tell you something, not just decorate.

[Scroll slowly.]
The motion is short and quiet. Sections slide up as you scroll and lists come in one item at a time, so your eye sees what just arrived. If your phone is set to reduce motion, every animation switches off.

We also leaned on a few design laws. Hick's law says more choices means slower decisions, so once you're in there are just three places to go: Profile, Scouted jobs, Watchlist. Miller's law says people hold only a few things in their head at once, so applying is four short steps with a progress bar, not one long form. Jakob's law says people expect things to work the way they've seen elsewhere, so our login works like every login you've used. And we show a loading state straight away, so an empty screen is never mistaken for a finished one.

Bonginkosi will now demonstrate how a student registers and verifies their email.

---

## 3 · Bonginkosi — Register and verify (2:15)

**On screen:**

1. Get started → full name **John [surname]**, your own email, the agreed password twice → Submit.
2. "Verify your email" screen appears → switch to your inbox.
3. Open the Scout email, read the code, type it in → Verify & continue.
4. Scout logs John straight in and opens **Scouted jobs**.
5. Stop sharing for a moment, post the email and password in the team WhatsApp, and wait for everyone to confirm they're in.

The user story I'll be demonstrating is: "As a student, I want to register and confirm my email with a code, so that my account is protected and I can be contacted about applications."

Let's create a student. We'll call him John.

[Fill in the form, submit.]

Scout doesn't trust the email address yet, so it's sent a six-digit code to prove the inbox is real.

[Switch to the inbox.]

There it is, from Scout. We set up a dedicated email account for the platform, so every message a student gets comes from one address they'll recognise. The code lasts five minutes, and you get five tries. We only store a scrambled version of it, never the code itself.

[Type the code, verify.]

And John's in, with no separate login step. Until he entered that code, his account couldn't be used at all.

[Share the login with the team.]

Mathabo will now demonstrate how John builds his profile and uploads his documents.

---

## 4 · Mathabo — Profile, documents, eligibility (2:15)

**On screen:**

1. Profile → Tertiary Student · Cape Peninsula University of Technology · Information Technology · Year 2 · Average 72 · Internship · Western Cape → Save.
2. Upload a CV (PDF), then a matric certificate (PDF or image). Show both listed.
3. Scouted jobs → note the number on "Eligible for me" → click "View all" → note that number → back to "Eligible for me".

The user stories I'll be demonstrating are: "As a student, I want to enter my academic details and upload my CV and matric certificate once so that I do not retype them for every application." And: "As a student, I want to see only the opportunities I actually qualify for, so that I do not waste time on listings that will reject me."

[Profile, fill in, save.]

Here John tells Scout who he is: second-year IT at CPUT, a 72 average, looking for an internship in the Western Cape. He types this once, and every application reuses it.

[Upload CV and matric.]

Now his CV and matric certificate, also once. They go into private storage that John can't even browse directly. When he opens one, he gets a link that dies after an hour. And if he uploads a newer CV, the old one is kept as history, not deleted.

[Scouted jobs.]

Now the part that saves students the most time. "Eligible for me" shows [number]. "View all" shows [number], every listing on the platform, each one marked whether John qualifies.

How does it decide? It checks his field, the type of opportunity, his year, his average, his qualification and his province against what each company asked for. Anything a company leaves blank doesn't count against him. And the server works this out from his saved profile, not the browser, so nobody can fake their way into a listing.

Bonginkosi will now demonstrate how John bookmarks opportunities and applies.

---

## 5 · Bonginkosi — Bookmark and apply (2:15)

**On screen:**

1. Bookmark two listings John isn't ready for. **Not** the ByteWorks one.
2. Open **Software developer intern — ByteWorks**. Pick the ByteWorks one: there's a similar listing from another company, and Tega can only see ByteWorks applications. → Apply.
3. Step through to the review screen. Show the details and the attached CV and matric.
4. Confirm and submit **once** → the receipt shows the reference number.

The user story I'll be demonstrating is: "As a student, I want the application form filled in from my profile with a review screen before it sends, so that I stay in control of what is submitted."

[Bookmark two.]

John's not ready for these two, so he bookmarks them for later. Boitumelo will show you where they go.

[Open ByteWorks, Apply.]

This one he wants. Notice he isn't typing anything. His name, university, year and average all come from his profile, and his CV and matric are already attached.

[Review screen.]

This is the review screen. It's exactly what ByteWorks will receive, and nothing has been sent yet. John stays in control.

[Confirm.]

Sent. He gets a receipt with a unique reference number, and the same receipt arrives in his inbox. If he tried to apply again, Scout would refuse. The database itself allows only one application per student per listing.

Boitumelo will now demonstrate how John keeps track of his applications.

---

## 6 · Boitumelo — Watchlist and PDF report (2:30)

**On screen:**

1. Watchlist → the ByteWorks application shows **Submitted** → View receipt → close it.
2. Scroll to Bookmarked opportunities.
3. Download PDF report → open it.
4. Leave John's watchlist open. Tega will use it.

The user story I'll be demonstrating is: "As a student, I want all my applications and their statuses on one dashboard, so that I do not check several company portals."

[Watchlist.]

This is John's watchlist. There's the application Bonginkosi just sent, status Submitted.

[View receipt.]

The receipt has the reference number, the company and the time it was sent.

[Bookmarks.]

Here are his two bookmarks with their closing dates. Three days before one closes, Scout reminds him in the app and by email.

[Download PDF.]

And if a bursary office or university asks for proof of what he's applied for, he downloads this report: every application, its status and the totals. When we tested it, we checked the report line by line against the watchlist, and they matched.

This page also checks for updates by itself every fifteen seconds.

Tega will now demonstrate the company's side, and you'll see this page update on its own.

---

## 7 · Tega — The company's side (2:45)

**On screen:**

1. Provider window (already logged in as ByteWorks) → Dashboard: tiles for Awaiting review, Live listings, Total applicants. Point at the listing marked **Pending verification**.
2. Software developer intern → View applicants → John.
3. Show his profile and documents marked attached.
4. Record **Outcome Received → Successful** → Save. **Once.**
5. Switch to John's watchlist window. Within about 15 seconds it shows **Successful** in green, with a new notification.

The user story I'll be demonstrating is: "As a provider, I want to record an outcome so the student is told automatically, so that I do not send individual emails."

[Dashboard.]

This is ByteWorks' side. Up here: applications waiting for review, live listings, total applicants. And see this listing marked pending verification? We posted it, but students can't see it until an administrator checks it. Mathabo will deal with that one.

[Applicants → John.]

Here's John, minutes after he applied. ByteWorks sees his academic profile and that his CV and matric are attached. There's no download link here; we keep the files themselves private.

[Record outcome: Successful.]

Status only moves forward, from Submitted to Under Review to an outcome, and once an outcome is recorded it's locked. I'm recording Successful.

[Switch to John's watchlist.]

And over on John's side, without a refresh, it's turned green: Successful. There's a notification, and an email is on its way. Nobody at ByteWorks had to write it.

Mihle will now demonstrate what happens when something goes wrong.

---

## 8 · Mihle — Missing documents (2:00)

**On screen:**

1. Private window, logged in as `student@scout.demo`. This student has a profile but no documents.
2. Scouted jobs → any listing → Apply → Continue.
3. The documents step shows **"Upload these to continue: CV, Matric certificate"**, and Continue is greyed out. **Do not upload anything.**
4. Watchlist → Notifications shows the "waiting on CV, Matric certificate" message.

The user story I'll be demonstrating is: "As a student, I want to be told when a required document is missing, with a link back to where I was, so that I can finish without starting over."

This student has filled in a profile but never uploaded documents.

[Apply → Continue.]

Scout stops him here and says exactly what's missing: CV and matric certificate. He can't go further until they're uploaded, and he can upload them right on this screen without losing his place.

[Watchlist → Notifications.]

He also gets this notification, plus an email with a link straight back to this step. And it's sent once. Opening the screen again doesn't send it again, because a platform that spams students loses their trust.

Mathabo will now demonstrate how a listing gets approved before students ever see it.

---

## 9 · Mathabo — Admin, ERD, close (3:00)

**On screen:**

1. Admin window → Verification queue → open the pending listing posted last night → Verify. It leaves the queue.
2. *(Optional, 20 s)* John's window → Scouted jobs → refresh. The new listing is there.
3. Open `docs/ScoutERD.drawio.png` full screen.

The user story I'll be demonstrating is: "As an administrator, I want to check listings before students see them, so that unverified content never reaches students."

[Queue → open listing.]

This is the listing Tega pointed out on the ByteWorks dashboard. I can see everything the company wrote: who it's for, the requirements and the closing date. If it looks real, I verify it.

[Verify.]

Done. It leaves the queue and Scout records which administrator approved it, so there's an audit trail. Until this moment no student could see it. Now John can.

[Optional: John's Scouted jobs.]

[ERD.]

Here's what holds it all together. Everything you've seen today lives in these tables. A student has one profile and many documents. Each application connects one student to one listing, and the database allows only one application per pair. That's why John couldn't apply twice. Each listing belongs to one company and records the administrator who verified it.

And under POPIA, if a student asks us to delete their account, these links carry the delete through: profile, documents, applications, bookmarks and notifications all go with it. We also only collect what an application needs. No ID numbers, no home addresses, no banking details.

So that's Scout. One profile, one set of documents, only the listings that fit, a review before anything is sent, and every outcome in one place. It's live at scout-delta-ruby.vercel.app, running on Supabase, with Brevo sending the emails.

Thank you. We're happy to take questions.

---

## Likely questions

**Can a student fake their eligibility?** No. The server works it out from the profile saved in the database. The browser only says which listing it's asking about.

**Can one student open another's documents?** No. Scout only gives you a link to your own files, and asking for someone else's document returns "not found". The links also expire after an hour.

**What happens when a listing or account is deleted?** Deleting a listing removes its applications and bookmarks. Deleting a student removes everything linked to them, including their stored files.

**Why does an admin verify listings?** So fake or careless listings never reach students. Unverified listings don't appear in either student view.

**Are companies themselves vetted?** Not yet. A company verifies its email like a student does, and each listing is checked by an admin. Vetting companies at registration is our next step.

**How do you know it works?** We wrote an automated system test that runs every requirement through the real system ([number] checks), and we tested the failure cases by hand: oversized files, wrong file types, applying twice, opening another student's document, moving a status backwards. All were refused.

**What would you build next?** Company vetting, daily "new listings that fit you" alerts, and analytics for companies.
