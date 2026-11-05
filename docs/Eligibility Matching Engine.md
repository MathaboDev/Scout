# Eligibility Matching Engine

How Scout decides which opportunities a student is eligible for, where that logic lives, and how to demo and test it.

---

## 1. The idea in one paragraph

A provider posts a listing using a fixed template. Two fields are **always required**: field of study and opportunity type. "Who may apply" is also always set, but it can be `Any`. Every other criterion is **optional**, and a blank optional criterion means **"no restriction"**: nobody is filtered out by it. A student sees a listing as *eligible* only when their saved profile passes **every** criterion the provider did set. Matching runs as **one SQL query in the database** and uses the profile stored in the database, so a student can't change their eligibility by editing what the browser sends.

---

## 2. The rules, one by one

Code: [backend/opportunities/matching.py:34-51](../backend/opportunities/matching.py#L34-L51) (`ELIGIBLE_PREDICATE`).

| # | Criterion (listing column) | Required for provider? | Rule when set | If the provider leaves it blank |
|---|---|---|---|---|
| 1 | `fieldofstudy` | Yes | Must **equal** the student's field of study | n/a, always set |
| 2 | `opportunitytype` | Yes | Must **equal** the student's opportunity preference (Internship / Learnership / Graduate programme) | n/a, always set |
| 3 | `eligibilitytype` | Yes (`Any`, `Tertiary Student`, `Graduate`) | `Any` lets everyone through. Otherwise it must equal the student's type | `Any` works like "blank": everyone passes |
| 4 | `minimumaverage` | No | Student's average **>=** the minimum | **Everyone passes.** No minimum average means every student who meets the other rules sees it |
| 5 | `yearlevelrequired` | No | Student must be a **Tertiary Student** and in that year **or later** | Everyone passes |
| 6 | `requiredqualification` | No | Student's qualification must be that one **or higher** (Higher Certificate < Diploma < Bachelor < Honours < Masters < Doctorate) | Everyone passes |
| 7 | `province` | No | Student's province must **equal** it | **Nationally available.** Everyone passes |

Every optional rule has the same shape:

```sql
(o.minimumaverage IS NULL OR p.academicaverage >= o.minimumaverage)
```

Read it as: *"either the provider didn't set this, or the student meets it."* That `IS NULL OR ...` pattern is what makes "blank = no restriction".

### Rules that apply before matching (both views)

Code: [matching.py:81-89](../backend/opportunities/matching.py#L81-L89)

- `isverified = TRUE`: an admin must verify a listing before **any** student sees it (FR9). New listings start unverified ([opportunities/views.py:100](../backend/opportunities/views.py#L100)), and **editing** a listing sends it back for verification ([opportunities/views.py:152](../backend/opportunities/views.py#L152)).
- `isactive = TRUE`: a provider "deleting" a listing only switches this off, so past applications keep their history.
- `closingdate >= NOW()`: expired listings disappear from browsing.

---

## 3. Edge cases worth knowing (likely questions)

**"What if the provider doesn't set a minimum average?"**
`minimumaverage` is stored as `NULL`, so `IS NULL` is true and the rule passes for everyone. Same for province, year level and qualification. The frontend turns an empty box into `null` before sending ([frontend/src/pages/PostListing.jsx:49-66](../frontend/src/pages/PostListing.jsx#L49-L66)).

**"Is the minimum average inclusive?"**
Yes, `>=`. A student with exactly 65 qualifies for a 65 minimum.

**"Why can a Masters graduate see a Bachelor listing?"**
Qualification is "required **or higher**". Each qualification gets a rank from a fixed list in [core/choices.py](../backend/core/choices.py), and `array_position()` compares the ranks ([matching.py:32](../backend/opportunities/matching.py#L32), [matching.py:45-49](../backend/opportunities/matching.py#L45-L49)). Year level works the same way: a 3rd-year student qualifies for a "2nd year" listing.

**"Can a tertiary student match a listing that requires a qualification?"**
No. Tertiary students have no completed qualification, so their `qualification` is `NULL`, the comparison comes out unknown, and the student is not eligible. That's deliberate: "required qualification" means *completed*. The provider form also blocks setting a qualification on a "Tertiary Student"-only listing, and a year level on a "Graduate"-only listing ([opportunities/serializers.py:66-76](../backend/opportunities/serializers.py#L66-L76)).

**"What if the student hasn't filled in a profile?"**
The profile is joined with a `LEFT JOIN`, so it may be missing. The whole check is wrapped in `COALESCE(..., FALSE)`, so a missing profile (or any unknown value) counts as **not eligible**. It never counts as eligible by accident.

**"Where does 'Diploma' go for a student who is still studying?"**
It isn't stored. The database only allows `qualification` for graduates (`chk_profile_studenttype_fields`, [database/schema.sql:134](../database/schema.sql#L134)). A current student is matched on field of study, **year level** and average. Possible future improvement: store the qualification a student is *studying towards*.

**"Eligible vs All view?"**
One query serves both ([matching.py:87-93](../backend/opportunities/matching.py#L87-L93)). The **Eligible** view adds the eligibility rules as a filter. The **All** view shows every live listing and adds an `eligible` true/false flag to each, so the UI can show a badge. Students can still look at listings they don't qualify for.

**"Why raw SQL instead of the Django ORM?"**
The project spec requires hand-written SQL for the core queries, and one query can return the eligible flag, bookmark state and "already applied" state for every listing in one database round trip.

**"Is it safe from SQL injection?"**
Student and listing ids are passed as `%s` parameters. The only text built into the SQL string is the qualification list, which comes from our own constant in `core/choices.py`, never from users.

---

## 4. Where the logic lives

### `backend/opportunities/` (where the engine lives)

| File | What it does |
|---|---|
| [matching.py](../backend/opportunities/matching.py) | **The engine.** `ELIGIBLE_PREDICATE` (the rules), `list_opportunities()` (Eligible / All browse), `get_opportunity()` (one listing, details page) |
| [views.py](../backend/opportunities/views.py) | `student_opportunities` handles `GET /api/opportunities/?view=eligible\|all`. `provider_listings` / `provider_listing_detail` let providers create, edit and remove listings, always as unverified |
| [serializers.py](../backend/opportunities/serializers.py) | `ListingTemplateSerializer`: the provider listing template. Checks values against `core/choices.py`, makes the optional fields nullable, and adds cross-field rules |
| [models.py](../backend/opportunities/models.py) | The `opportunity` table. The comment there says it too: NULL means "no restriction" |
| [management/commands/verify_listings.py](../backend/opportunities/management/commands/verify_listings.py) | The admin "verify" action (there's no admin UI yet) |

Shared value lists: [backend/core/choices.py](../backend/core/choices.py). It must stay the same as `frontend/src/lib/constants.js`, or matching silently fails. Text is compared exactly, so "Bachelor Degree" would never match "Bachelor".

### `backend/providers_admin/` (careful)

| File | Status |
|---|---|
| [models.py](../backend/providers_admin/models.py) | **In use.** `Provider` and `PlatformAdmin` tables. Used for provider permissions and the verifying admin |
| [views.py](../backend/providers_admin/views.py), [urls.py](../backend/providers_admin/urls.py), [serializers.py](../backend/providers_admin/serializers.py) | **Not in use.** An earlier version of the provider endpoints. It isn't wired into [scout_backend/urls.py:39](../backend/scout_backend/urls.py#L39) (commented out) and imports `core.auth_utils_additions`, which doesn't exist. The live provider endpoints are in `opportunities/views.py` |

If you're asked "where does the provider set the criteria?", point to **`opportunities/serializers.py` + `opportunities/views.py`**, not `providers_admin/views.py`.

---

## 5. Demo student: Mathabo

**Login:** `mathabo@scout.demo` / `ScoutDemo-2026`

| Profile field | Value |
|---|---|
| Student type | Tertiary Student (Diploma in IT, see "Diploma" above) |
| Institution | Cape Peninsula University of Technology |
| Field of study | Information Technology |
| Year of study | 3 |
| Academic average | 68 |
| Preference | Internship |
| Province | Western Cape |
| Documents | **None uploaded** |

### What she should see (IT listings)

| Listing | Eligible? | Rule that decides it |
|---|---|---|
| Software developer intern (ByteWorks) | Yes | min 65 → 68 passes; year 2+ → year 3 passes |
| IT support intern (ByteWorks) | Yes | Western Cape only → she's in Western Cape |
| Web analytics intern (Kopano) | Yes | **No optional criteria set**, so every IT internship student sees it |
| Health records IT intern (Umoya) | Yes | No optional criteria set |
| E-commerce website intern (Karoo) | Yes | min 60 → passes |
| Cloud engineering intern (ByteWorks) | No | min average 80 > 68 |
| Graduate developer programme (ByteWorks) | No | graduates only + Bachelor required |
| IT systems learnership (Indaba) | No | it's a learnership; she wants internships |
| Johannesburg IT helpdesk intern (Kopano) | No | Gauteng only |
| Final-year systems developer intern (Kopano) | No | needs 4th year; she's in 3rd |
| Data analyst intern (ByteWorks) | No | field is Computer Science |
| UX design intern (ByteWorks) | Hidden | not verified by an admin, so no student sees it |

The shared database also holds one listing someone added by hand (*Junior Software Developer Internship*, Test Provider (Pty) Ltd), which she is also eligible for.

### Suggested demo flow

1. Log in as Mathabo → **Eligible** view: only the "Yes" rows above.
2. Switch to **All**: the "No" rows appear without the eligible badge.
3. *Live matching:* in Profile, change the average to **85** → Cloud engineering appears in Eligible. Change province to **Gauteng** → IT support disappears and Johannesburg helpdesk appears.
4. *File upload:* open an eligible listing → Apply. It's **blocked** with "missing CV, matric certificate". Upload both (PDF/JPG/PNG, max 5 MB), then submit. The block is in [applications/views.py:199](../backend/applications/views.py#L199), with required documents listed in `core/choices.py`.

---

## 5b. Demo student: Mathabo Nongwe (Masters graduate)

Shows the **"required qualification or higher"** rule.

**Login:** `mathabo.nongwe@scout.demo` / `ScoutDemo-2026`

| Profile field | Value |
|---|---|
| Student type | Graduate, Postgraduate |
| Qualification | Masters |
| Institution | University of Cape Town |
| Field of study | Information Technology |
| Academic average | 71 |
| Preference | Graduate programme |
| Province | Western Cape |
| Documents | **None uploaded** |

### How "or higher" works

Qualifications are ranked from a fixed list in [core/choices.py](../backend/core/choices.py):

```
1 Higher Certificate  <  2 Diploma  <  3 Bachelor  <  4 Honours  <  5 Masters  <  6 Doctorate
```

`array_position()` turns each qualification into its rank, and the rule is **student's rank >= required rank** ([matching.py:45-49](../backend/opportunities/matching.py#L45-L49)). Masters is rank 5, so she passes any listing that asks for rank 5 or lower. A listing that asks for a Doctorate (rank 6) is the only one she fails on qualification.

Why it's designed this way: a provider asking for "at least a Bachelor" shouldn't lose a better-qualified candidate. An exact-match rule would hide every Masters graduate from every Bachelor listing.

### What she should see (IT graduate programmes)

| Listing | Requires | Eligible? | Why |
|---|---|---|---|
| Junior IT graduate programme (Kopano) | Diploma | Yes | Masters (5) >= Diploma (2) |
| Graduate developer programme (ByteWorks) | Bachelor | Yes | Masters (5) >= Bachelor (3) |
| Data platform graduate programme (Kopano) | Honours, min 70 | Yes | 5 >= 4, and 71 >= 70 |
| Cybersecurity graduate programme (Kopano) | Masters | Yes | exact match, 5 >= 5 |
| Applied ML graduate programme (Kopano) | Masters, min 75 | **No** | qualification passes, but 71 < 75. **Every** rule must pass |
| AI research fellowship (Kopano) | Doctorate | **No** | Masters (5) < Doctorate (6) |
| Machine learning graduate programme (Kopano) | Honours | **No** | qualification passes, but the field is Computer Science |
| Any IT internship | n/a | **No** | she wants a Graduate programme |

### Suggested demo flow

1. Log in → **Eligible** view: the 4 "Yes" programmes, from Diploma up to Masters.
2. Point out *Applied ML*: she has the qualification but not the average, which shows the rules are combined with AND.
3. Switch to **All**: the AI research fellowship (Doctorate) shows without the eligible badge.
4. *Live:* in Profile, set graduate type to **Undergraduate** and qualification to **Bachelor** (Bachelor only counts as undergraduate). Data platform and Cybersecurity drop out, while Junior IT and Graduate developer stay. Set it back to Postgraduate + Masters and they return.
5. Apply to one → blocked until the CV and matric certificate are uploaded.

---

### Reset after a rehearsal (both Mathabo accounts)

```powershell
cd backend
python manage.py seed_demo --reset-mathabo
```

For `mathabo@scout.demo` and `mathabo.nongwe@scout.demo`, this hides uploaded documents (the same "retire, don't delete" approach the app uses when a file is replaced), deletes applications, bookmarks and notifications, and restores the profiles above.

---

## 6. Where the seed data is, and how we test

**Seed data**

| What | Where |
|---|---|
| Seed command | [backend/opportunities/management/commands/seed_demo.py](../backend/opportunities/management/commands/seed_demo.py): `python manage.py seed_demo` (safe to re-run; it uses `get_or_create`) |
| Both Mathabo accounts, other students, other providers & listings | [backend/opportunities/management/commands/_demo_catalogue.py](../backend/opportunities/management/commands/_demo_catalogue.py) (`MATHABO` and `MATHABO_NONGWE`, after the `PROVIDERS` list) |
| Original hand-written SQL test data | [database/seed.sql](../database/seed.sql) (early version, before the Django seed command) |

**"What are you using to test?"**

- **An automated end-to-end smoke test:** `python manage.py smoke_test` ([backend/core/management/commands/smoke_test.py](../backend/core/management/commands/smoke_test.py)). It uses Django REST Framework's `APIClient` to call the **real API** against the **real Supabase PostgreSQL database**, walking the full student and provider journey: register, profile, matching, bookmarks, document upload, apply, provider review, status updates, notifications, PDF report, permission checks. It makes **72 pass/fail checks**. For matching, it checks that the All view returns more than the Eligible view, and that changing the profile changes the results.
- **It leaves nothing behind:** every database change runs inside one transaction that is **rolled back** at the end, and test files uploaded to Supabase Storage are deleted. It exits with code 1 on failure, so it could run in CI.
- **Seeded test data** (above) for manual testing through the UI. Every listing is chosen to exercise one rule.
- The per-app `tests.py` files are still the empty Django defaults. Unit tests are a known gap.
