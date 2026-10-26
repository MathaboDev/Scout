# Scout — Scouter/Provider Side (React)

The five scouter/provider screens, built as a proper React app (matching
your team's Create React App setup) with real routing and component state
— `localStorage` stands in for the backend for now.

## 1. Install the one extra dependency

This uses `react-router-dom` for page navigation. In your project's root
folder, run:

```
npm install react-router-dom
```

(Skip this if a teammate already added it — check your `package.json`
first.)

## 2. Where these files go

Drop everything into your existing `src/` folder like this:

```
src/
├── App.js                        (routes — see note below if you already have one)
├── components/
│   ├── Sidebar.jsx
│   └── StatusBadge.jsx
├── data/
│   └── dataService.js
├── pages/
│   ├── Dashboard.jsx
│   ├── PostListing.jsx
│   ├── ViewApplicants.jsx
│   └── ApplicantDetails.jsx
└── styles/
    └── scout-provider.css
```

**If your team already has an `App.js` with its own `<BrowserRouter>`**
(likely, since the student side needs routing too): don't paste over it.
Instead:
1. Copy the `<Route>` lines from this `App.js` into your existing `<Routes>`.
2. Copy the `import` lines for the four pages into your existing routes file.
3. Wrap just this section's pages in `<div className="scout-provider-app">`
   (or wrap your whole app in it — it only affects things inside it) and
   import `./styles/scout-provider.css` once, at the top level.

## 3. Fonts and icons

The design uses Google Fonts (Space Grotesk + Inter) and Tabler Icons.
Add these two lines inside the `<head>` of `public/index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css">
```

## 4. Run it

```
npm start
```

It opens at `localhost:3000` and redirects straight to `/dashboard`,
seeding 3 dummy listings and 5 dummy applicants into `localStorage` the
first time it loads.

## 5. How the data flows (no backend yet)

`src/data/dataService.js` is the *only* file that touches `localStorage`.
Every page imports functions from it — `getListings()`, `addListing()`,
`getApplicantsForListing()`, `updateApplicantStatus()`, etc. When the real
backend exists, you only need to rewrite the insides of these functions
(swap `localStorage.getItem(...)` for a `fetch()` call) — no page
component needs to change.

## 6. Why the CSS is scoped

All the styling lives under one `.scout-provider-app` wrapper class with
`sp-` prefixed class names (`sp-card`, `sp-btn`, etc.), so it won't
collide with whatever CSS your teammates already have for the student
side or shared components.

## 7. How the screens connect

- **`/dashboard`** — stat cards + a card per listing, each with a "View
  applicants" button.
- **`/post-listing`** — the fixed-template form. Submitting calls
  `addListing()` and navigates back to the dashboard.
- **`/view-applicants/:listingId`** — reads `listingId` from the route and
  only shows applicants for *that* listing, via `getApplicantsForListing`.
- **`/applicant/:id`** — full application info, documents, and the status
  control.
- **Update Applicant Status** isn't a separate route — it's the dropdown +
  button at the bottom of Applicant Details. It writes to the same
  `scout_applicants` key the student-side tracking page reads from, so
  once that's wired up (or you're both on the same backend), a status
  change shows up there too.

## 8. Things to add next

- Auth so `Dashboard` knows *which* provider is logged in (hardcoded to
  "ByteWorks" right now).
- Form validation feedback beyond the browser's built-in `required`.
- A way to close/reopen a listing from the dashboard.
