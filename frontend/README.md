# Scout, frontend

React (Vite) + Tailwind. Built from the approved wireframes for FR1–FR3
(registration, profile, assisted application groundwork).

## Screens included

- **Landing** (`/`), explains what Scout is and why it exists, links to
  sign up / log in.
- **Register** (`/register`), FR1 registration with email-verification
  notice.
- **Login** (`/login`).
- **Profile** (`/profile`, requires login), FR1 profile creation and
  management: professional profile form for tertiary students and graduates, required CV and
  matric certificate uploads, optional supporting documents, and a live
  completion meter.

Eligible jobs, watchlist and settings are stubbed in the sidebar as "soon"
,  not wired up yet, this pass only covers auth + profile.

## Running it

```bash
cp .env.example .env      # point VITE_API_BASE_URL at the Django backend
npm install
npm run dev
```

## Wiring to the real backend

All API calls go through `src/lib/api.js`. The endpoint paths there
(`/api/accounts/register/`, `/login/`, `/profile/`, `/documents/`) are
guesses matching the accounts app, update the `ENDPOINTS` object in that
one file once `urls.py` is final, nothing else needs to change.

`api.login()` expects `{ token, user }` back; `api.getProfile()` is
expected to return either `{ academic: {...}, documents: {...} }` or a flat
object with the same academic-info keys. Adjust the shape in
`src/pages/Profile.jsx` if the backend response looks different.

If the backend isn't running yet, `/profile` still renders, it just opens
straight into edit mode with empty fields so you can develop the UI in
isolation.

## Design tokens

Colors, type (Roboto) and radii live in
`tailwind.config.js`, carried over from the wireframe. `src/components/Logo.jsx`
holds the placeholder mark, swap it for the real logo file whenever design
delivers one; every other component references `<Logo />`, not an image
path, so that's the only file that needs to change.
