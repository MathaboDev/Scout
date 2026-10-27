# Scout handover (27 Oct, before the 28 Oct demo)

Everything works end to end: sign up → profile → matching → apply → provider review → status update → PDF report. All automatic tests passed with no errors.

## 1. Get it running

```powershell
git pull

# backend (from backend/, venv active)
pip install -r requirements.txt     # new: reportlab + pillow for the PDF report
python manage.py check              # must say "no issues"
python manage.py seed_demo          # safe to re-run
python manage.py runserver          # http://127.0.0.1:8000

# frontend (from frontend/)
npm install                         # new: @fontsource/roboto
npm run dev                         # http://localhost:5173
```

You need `backend/.env`. Ask Mathabo for it; it is not in git.

**Demo logins** (password `ScoutDemo-2026` for all):

| Login | Who |
|---|---|
| `student@scout.demo` | IT student, the main demo account |
| `graduate@scout.demo` | Commerce Honours graduate |
| `health@scout.demo` | Health Sciences student |
| `provider@byteworks.demo` | Main demo provider |
| `provider@kopano.demo`, `@mzansirail`, `@indaba`, `@umoya`, `@lekgotla`, `@sizwe`, `@fynbos`, `@brightfutures`, `@karoo` (all `.demo`) | One company per field of study |

**Before the demo, run `python manage.py smoke_test`.** It should end with "All 72 checks passed". It changes nothing.

## 2. Frontend changes, folder by folder (`frontend/`)

| Folder / file | Change |
|---|---|
| `package.json` | Added `@fontsource/roboto` (font now bundled, works offline) |
| `index.html` | Scout logo as the browser-tab icon |
| `tailwind.config.js` | Colours switched to the new neutral palette. Restart `npm run dev` after editing. |
| `src/App.jsx` | Rewritten: the one router, every route, student/provider access guards |
| `src/main.jsx` | Now only renders `<App />` |
| `src/index.css` | Bundled Roboto; landing gradient animation |
| `src/assets/` | **New:** `scout-logo.png` |
| `src/lib/` | `api.js`: added the PDF report download |
| `src/context/` | No change |
| `src/components/` | **New:** `AuthLayout`, `landing.jsx`, `ui.jsx` (company logos, tags). **Rewritten:** `Navbar`, `Footer`, `AuthNavbar`, `AppShell`, `SideBar`, `Logo`, `Button`, `FormField`. **Restyled:** `ProviderShell`, `StatusBadge`. **Removed:** radar, marquee, count-up, feature card, duplicate `Sidebar.jsx`, `api/dataService.js` |
| `src/pages/` | Folder renamed `Pages` → `pages`. **Rebuilt:** `Landing`. **New layout:** `Login`, `Register`. `Eligible`: greeting banner, search + filters. `JobDetails`: new layout. `Watchlist`: PDF instead of CSV. Others: style only. Bookmark double-click bug fixed. |

## 3. Backend changes, folder by folder (`backend/`)

| Folder / file | Change |
|---|---|
| `requirements.txt` | Added `reportlab`, `pillow` |
| `scout_backend/` | `settings.py`: CORS fix (no longer overwrites the `.env` value) |
| `core/` | **New:** `smoke_test` command (full API test, leaves no data behind) and `assets/scout-logo.png` |
| `opportunities/` | `matching.py`: qualification is now "required **or higher**". `seed_demo` extended with a new `_demo_catalogue.py` (10 companies, 3 students, and 6 ByteWorks applicants at every status for the provider demo) |
| `applications/` | **New:** `report_pdf.py` (letterhead PDF). `views.py` + `urls.py`: new `GET /api/applications/mine/summary/pdf/` |
| `notifications/` | Fixed: reminder command files were missing `.py`, so `send_bookmark_reminders` never ran |
| `accounts/`, `documents/`, `providers_admin/` | No change |
| `database/schema.sql` | No change. It is still the source of truth, so never run makemigrations for app tables. |

## 4. Not built yet (don't start tonight)

Email verification (FR1), audit table for status changes (NFR5), admin UI (FR9/FR10), provider self-registration, POPIA view/delete endpoints (FR8), a reminder scheduler.

## 5. Understand your side before tomorrow (any AI chat in the browser)

1. Open a new chat (ChatGPT, Gemini, claude.ai...).
2. Paste the prompt for your side.
3. Then paste the files listed below, one after another. Put each file's name on the line above its code. If the chat says the message is too long, send the files over two or three messages and say "more files coming" until the last one.
4. **Never paste `backend/.env`.** It holds passwords.

**Frontend team: files to copy** (from `frontend/src/`)

`App.jsx`, `lib/api.js`, `lib/constants.js`, `context/AuthContext.jsx`, `components/RequireAuth.jsx`, `components/AppShell.jsx`, `components/ProviderShell.jsx`, then the pages: `Login.jsx`, `Register.jsx`, `Eligible.jsx`, `JobDetails.jsx`, `Apply.jsx`, `Watchlist.jsx`, `Profile.jsx`, `Dashboard.jsx`, `ApplicantDetails.jsx`

```text
I'm a second-year student on a team building "Scout", a React (Vite + Tailwind)
website that matches South African students to internships and lets companies
review applicants. Our demo is tomorrow. I know Python and Java well but
JavaScript/React less well. I'm about to paste our frontend files.
After the last file, give me a short, plain-language summary:
1. Every page (route), who can open it, and which backend calls it makes.
2. How a student goes from sign up to a submitted application, screen by screen.
3. How a company reviews an applicant and updates the status.
4. The React ideas used here (useState, useEffect, props, routing), explained simply.
5. Three questions a lecturer might ask about the frontend, with short answers.
Keep it under one page.
```

**Backend team: files to copy** (from `backend/` unless noted)

`../database/schema.sql`, `core/choices.py`, `core/permissions.py`, `core/sql.py`, `opportunities/matching.py`, `opportunities/views.py`, `applications/views.py`, `applications/queries.py`, `notifications/utils.py`, plus every `urls.py` (`scout_backend/`, `accounts/`, `opportunities/`, `applications/`, `notifications/`, `documents/`)

```text
I'm a second-year student on a team building "Scout", a Django REST Framework
API (PostgreSQL on Supabase, token login) that matches South African students
to internships and lets companies review applicants. Our demo is tomorrow.
I'm about to paste our backend files.
After the last file, give me a short, plain-language summary:
1. Every API endpoint, who may call it (student / provider), and what it does.
2. Exactly how eligibility matching decides who qualifies, rule by rule.
3. How an application's status moves (Submitted → Under Review → Outcome
   Received) and who gets notified.
4. How the code stops one user seeing or changing another user's data.
5. Three questions a lecturer might ask about the backend, with short answers.
Keep it under one page.
```
