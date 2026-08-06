# Scout — Project Structure Guide

**Purpose of this doc:** so everyone knows exactly where their code goes, why it goes there, and doesn't have to guess or ask in the group chat. Read once before Week 1 kickoff, keep it open as a reference after that.

---

## 1. The full tree, at a glance

```
scout/
├── README.md
├── .gitignore
│
├── docs/                    # planning docs, wireframes, diagrams — not code
├── database/                # single source of truth for the DB schema
├── backend/                 # Django REST API
└── frontend/                # React (Vite) app
```

Four top-level folders. Everything you write lives in one of the last three — `docs/` is reference material, not code you run.

---

## 2. Why a monorepo (one repo, four folders)?

Instead of three separate GitHub repos, we keep frontend, backend, and database schema in **one repo**. Reasons:
- One `git clone` gets the whole project — no juggling multiple repos for a 6-person team
- The DB schema, backend, and frontend evolve together; keeping them in one place means one commit can update all three if a change touches everything
- Easier for whoever writes the progress report to show the *whole* project in one place

---

## 3. `docs/` — planning material, not code

```
docs/
├── requirements-fr-nfr.md
├── architecture-and-plan.md
├── data-dictionary.md
├── erd.png
├── wireframes/
└── progress-reports/
```

If it's a decision, a diagram, or something you'd hand to a marker/lecturer — it goes here. Nobody should ever need to read backend code to understand *why* we made a decision; it should be written down here instead.

---

## 4. `database/` — the schema lives here, and only here

```
database/
├── schema.sql               # the actual CREATE TABLE statements
├── seed.sql                 # sample data for local testing
└── queries/
    ├── matching_query.sql   # raw SQL #1 — eligibility matching
    └── tracking_query.sql   # raw SQL #2 — tracking dashboard
```

**The rule:** nobody edits tables directly in the Supabase dashboard without updating `schema.sql` first and committing it. If `schema.sql` and what's actually in Supabase ever disagree, `schema.sql` is wrong and needs fixing — Supabase is not the source of truth, this file is.

Why this matters practically: if your laptop dies or someone new joins, they run `schema.sql` in a fresh Supabase project and have the exact same database everyone else has. No tribal knowledge required.

---

## 5. `backend/` — Django REST API

This is the part that trips people up, so here's the full breakdown.

```
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
```

### What's an "app"?

A Django **app** is a folder, not a file. Each one is a self-contained slice of functionality, and each one gets a **person or pair on the backend track assigned as its owner**. Every app folder looks the same inside:

```
opportunities/
├── models.py         # table definitions — mirrors a table in schema.sql, set to managed = False
├── views.py            # the actual logic — what happens when a request hits this endpoint
├── serializers.py        # converts model data ↔ JSON for the API response
└── urls.py                 # maps a URL like /api/opportunities/ to a function in views.py
```

**Why split into 5 apps instead of one big folder?** Two people can work on `students/` and `applications/` at the same time without touching the same file — merge conflicts stay rare. It also mirrors the FR document 1:1, so when someone asks "who's building FR6 tracking," the answer is "whoever owns `applications/`."

### What goes in each app

| App | FRs | Owns |
|---|---|---|
| `students/` | FR1, FR8 | Registration, email verification, profile, document uploads |
| `opportunities/` | FR2, FR9 | Eligible/all view toggle, the raw SQL matching query, listing verification |
| `applications/` | FR3–FR6 | Review screen, assisted submit, raw SQL tracking dashboard, receipts |
| `notifications/` | FR7 | Bookmarks, deadline reminders, in-app/email alerts |
| `providers_admin/` | FR10 | Provider listing management, admin moderation — *deferred past the 3-week checkpoint, Django admin panel used as placeholder for now* |

### `core/` vs an app — how to decide

Ask: **"Would more than one app need this?"**
- Yes → `core/`. Example: `auth_utils.py`'s token-lookup function is needed by `opportunities/` (eligibility check) *and* `applications/` (submitting on someone's behalf) — so it lives in `core/`, not duplicated in both.
- No, this is specific to one feature → put it in that app's own folder.

### `scout_backend/` vs an app — how to decide

`scout_backend/` is **not a feature you're building** — it's Django's own project shell. You'll only touch it to:
- register a new app in `settings.py` after creating one with `python manage.py startapp <name>`
- add a new app's routes into the top-level `urls.py`

Nobody "owns" `scout_backend/` the way someone owns `opportunities/` — it's shared config, edited briefly whenever a new app is added.

---

## 6. `frontend/` — React (Vite)

```
frontend/
├── src/
│   ├── api/
│   │   └── client.js          # one place all API calls go through, attaches the auth token automatically
│   ├── context/
│   │   └── AuthContext.jsx      # stores ONLY the token — never profile data (see security note below)
│   ├── components/                # reusable pieces — a card, a button, a badge
│   └── pages/                       # one file per screen — Login, Profile, Opportunities, etc.
```

**Rule of thumb:** if it's a full screen someone navigates to, it's a `page`. If it's a reusable piece used across multiple screens (like an opportunity card or a status badge), it's a `component`.

---

## 7. The one security rule that spans every folder

This is the single most important thing to internalize, because it's the one bug we already caught and fixed once:

> **The frontend never sends profile data (field of study, year, average) to the backend. It sends only the auth token. Django looks up the student's current profile itself, server-side, every single time.**

This shows up in the file structure as:
- `frontend/src/context/AuthContext.jsx` stores a token and nothing else
- `backend/core/auth_utils.py` is the *only* sanctioned way any view gets a student's profile — always a fresh database read, never trusting anything in the request

If you're writing a new endpoint and you find yourself reading `field_of_study` or `average` out of `request.GET` or `request.data` — stop, that's the bug. Pull it from `auth_utils.py`'s lookup instead.

---

## 8. Quick reference — "I want to build X, where does it go?"

| You're building... | Goes in... |
|---|---|
| A new database table | `database/schema.sql`, then re-run in Supabase |
| A new API endpoint for opportunities | `backend/opportunities/views.py` + `urls.py` |
| A helper function used by 2+ apps | `backend/core/` |
| A new React screen | `frontend/src/pages/` |
| A reusable UI piece (card, badge, toggle) | `frontend/src/components/` |
| A raw SQL query | `database/queries/`, called via `core/db_utils.py` |
| A planning decision or diagram | `docs/` |

---

## 9. Non-negotiables (apply regardless of which folder you're in)

- `.env` holds all secrets — never committed, always `.gitignore`'d
- Raw SQL always uses `%s` parameterized placeholders — never Python f-strings
- Sensitive fields (ID numbers, banking, health info) never touch the same table/response as professional profile data
- Every hand-built table's Django model sets `managed = False`
- Profile data for eligibility is always looked up server-side — never trusted from the browser
