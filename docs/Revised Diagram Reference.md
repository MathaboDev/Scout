# Scout: Revised Diagram Reference

Written for: group members revising the existing PDF and drawio diagrams.

How to use: for each diagram, read the change overview, then copy the Mermaid block. Mermaid renders in GitHub, VS Code (with a Mermaid extension) and mermaid.live. Items marked *(planned)* are designed but not built. Draw them dashed or grey, and label them planned.

---

## 1. Use case diagram

**What changed**
- Email verification is now a 6-digit code entered in the app (no link).
- Login is email and password only. There is no OTP on login.
- Providers have their own sign-up and login. Providers post listings, which wait for admin approval.
- Admins log in and verify listings from a queue. Verification is recorded against the admin.
- Reset password, user management, monitoring, and the apply, track and notification features are planned, not built.

```mermaid
flowchart LR
    Student((Student))
    Provider((Provider))
    Admin((Administrator))
    Email((Email Service<br/>Brevo SMTP))

    subgraph System [Scout Platform]
        direction TB
        UC_Reg([Register as student or provider])
        UC_OTP([Verify email with 6-digit code])
        UC_Resend([Resend code])
        UC_Login([Log in with email and password])
        UC_Profile([Set up profile])
        UC_Docs([Upload CV and matric certificate])
        UC_Browse([Browse eligible or all opportunities])
        UC_Post([Post listing])
        UC_Edit([Edit or remove own listing])
        UC_Applicants([View applicants])
        UC_Outcome([Update application outcome])
        UC_Queue([Review verification queue])
        UC_Verify([Verify listing])
        UC_Apply([Apply with pre-filled form *planned*])
        UC_Bookmark([Bookmark opportunity *planned*])
        UC_Track([Track application status *planned*])
        UC_Notify([Receive notifications *planned*])
        UC_Reset([Reset password *planned*])
        UC_Users([Manage users *planned*])
        UC_Monitor([Monitor platform *planned*])
    end

    Student --> UC_Reg
    Student --> UC_Login
    Student --> UC_Profile
    Student --> UC_Docs
    Student --> UC_Browse
    Student --> UC_Apply
    Student --> UC_Bookmark
    Student --> UC_Track
    Student --> UC_Notify
    Student --> UC_Reset

    Provider --> UC_Reg
    Provider --> UC_Login
    Provider --> UC_Post
    Provider --> UC_Edit
    Provider --> UC_Applicants
    Provider --> UC_Outcome

    Admin --> UC_Login
    Admin --> UC_Queue
    Admin --> UC_Verify
    Admin --> UC_Users
    Admin --> UC_Monitor

    Email --> UC_OTP

    UC_Reg -. "include" .-> UC_OTP
    UC_OTP -. "extend" .-> UC_Resend
    UC_Post -. "include" .-> UC_Queue
    UC_Queue -. "include" .-> UC_Verify
    UC_Apply -. "include" .-> UC_Docs

    classDef planned stroke-dasharray: 4 3,fill:#f5f5f5,color:#777;
    class UC_Apply,UC_Bookmark,UC_Track,UC_Notify,UC_Reset,UC_Users,UC_Monitor planned;
```

---

## 2. Class diagram

**What changed**
- `Admin` is now `PlatformAdmin`, linked to a Django user by email with `is_staff`.
- `LoginOTP` added: stores hashed codes, attempt count and expiry.
- Permission classes added: `IsStudent`, `IsProvider`, `IsAdmin`.
- `Provider` is linked to a Django user, the same as `Student`.
- The matching logic lives in `matching.py`, not in a separate eligibility file.
- Removed the generic `User.Register()` and `Logout()` methods. Those are view functions now.

```mermaid
classDiagram
    class User {
        <<Django auth_user>>
        +int id
        +str email
        +bool is_active
        +bool is_staff
    }
    class LoginOTP {
        +int id
        +str code_hash
        +str resend_token_hash
        +int resend_count
        +int attempts
        +bool is_used
        +datetime expires_at
    }
    class Student {
        +bigint student_id
        +str first_name
        +str last_name
        +str email
        +bool is_email_verified
    }
    class Profile {
        +bigint profile_id
        +str student_type
        +str institution
        +str field_of_study
        +float academic_average
        +str opportunity_preference
        +str province
        +int year_level
        +str graduate_type
        +str qualification
    }
    class Document {
        +bigint document_id
        +str document_type
        +str filename
        +bool is_active
    }
    class Provider {
        +bigint provider_id
        +str company_name
        +str email
        +str industry
        +str province
    }
    class PlatformAdmin {
        +bigint admin_id
        +str email
        +str role
        +bool is_active
    }
    class Opportunity {
        +bigint opportunity_id
        +str title
        +str opportunity_type
        +str field_of_study
        +bool is_verified
        +bool is_active
        +datetime closing_date
    }
    class Application {
        +bigint application_id
        +str reference_number
        +str status
        +str outcome_result
    }
    class Bookmark {
        +bigint bookmark_id
        +bool reminder_sent
    }
    class Notification {
        +bigint notification_id
        +str notification_type
        +bool is_read
    }
    class IsStudent {
        <<permission>>
    }
    class IsProvider {
        <<permission>>
    }
    class IsAdmin {
        <<permission>>
    }

    User "1" -- "0..1" Student : auth_user
    User "1" -- "0..1" Provider : auth_user
    User "1" -- "0..*" LoginOTP : issues
    Student "1" -- "1" Profile : has
    Student "1" -- "0..*" Document : uploads
    Student "1" -- "0..*" Application : submits
    Student "1" -- "0..*" Bookmark : saves
    Student "1" -- "0..*" Notification : receives
    Provider "1" -- "0..*" Opportunity : posts
    PlatformAdmin "0..1" -- "0..*" Opportunity : verifies
    Opportunity "1" -- "0..*" Application : receives
    Opportunity "1" -- "0..*" Bookmark : saved as
    Application "0..1" -- "0..*" Notification : triggers
    Bookmark "0..1" -- "0..*" Notification : triggers
    IsStudent ..> Student : resolves
    IsProvider ..> Provider : resolves
    IsAdmin ..> PlatformAdmin : resolves
```

---

## 3. Entity relationship diagram

**What changed**
- Added `login_otp` and `provider.authuserid`.
- Corrected column names: `reviewedat` and `outcomereceivedat` replace `ReceivedAt`. `minimumaverage` replaces the misspelling.
- Added `requiredqualification` to opportunity, and `studenttype`, `graduatetype` and `qualification` to profile.
- `Student.PasswordHash` is marked legacy (unused).

```mermaid
erDiagram
    AUTH_USER ||--o| STUDENT : "authuserid"
    AUTH_USER ||--o| PROVIDER : "authuserid"
    AUTH_USER ||--o{ LOGIN_OTP : "user_id"
    STUDENT ||--|| PROFILE : "studentid"
    STUDENT ||--o{ DOCUMENT : "studentid"
    STUDENT ||--o{ APPLICATION : "studentid"
    STUDENT ||--o{ BOOKMARK : "studentid"
    STUDENT ||--o{ NOTIFICATION : "studentid"
    PROVIDER ||--o{ OPPORTUNITY : "providerid"
    ADMIN ||--o{ OPPORTUNITY : "adminid (audit)"
    OPPORTUNITY ||--o{ APPLICATION : "opportunityid"
    OPPORTUNITY ||--o{ BOOKMARK : "opportunityid"
    APPLICATION ||--o{ NOTIFICATION : "applicationid"
    BOOKMARK ||--o{ NOTIFICATION : "bookmarkid"

    AUTH_USER {
        int id PK
        string username
        string email
        bool is_active
        bool is_staff
    }
    LOGIN_OTP {
        bigint id PK
        int user_id FK
        string code_hash
        string resend_token_hash
        int resend_count
        int attempts
        bool is_used
        timestamp expires_at
    }
    STUDENT {
        bigint studentid PK
        int authuserid FK
        string firstname
        string lastname
        string email UK
        bool isemailverified
        string accountstatus
    }
    PROFILE {
        bigint profileid PK
        bigint studentid FK
        string studenttype
        string institution
        string fieldofstudy
        float academicaverage
        string opportunitypreference
        string province
        bigint yearlevel
        string graduatetype
        string qualification
    }
    DOCUMENT {
        bigint documentid PK
        bigint studentid FK
        string documenttype
        string filename
        string fileurl
        bigint filesize
        bool isactive
    }
    PROVIDER {
        bigint providerid PK
        int authuserid FK
        string companyname
        string email UK
        string phone
        string industry
        string province
    }
    ADMIN {
        bigint adminid PK
        string firstname
        string lastname
        string email UK
        string role
        bool isactive
    }
    OPPORTUNITY {
        bigint opportunityid PK
        bigint providerid FK
        bigint adminid FK
        string title
        string opportunitytype
        string fieldofstudy
        float minimumaverage
        bigint yearlevelrequired
        string requiredqualification
        string eligibilitytype
        string province
        bool isverified
        bool isactive
        timestamp closingdate
    }
    APPLICATION {
        bigint applicationid PK
        bigint studentid FK
        bigint opportunityid FK
        string referencenumber UK
        string status
        timestamp submittedat
        timestamp reviewedat
        timestamp outcomereceivedat
        string outcomeresult
    }
    BOOKMARK {
        bigint bookmarkid PK
        bigint studentid FK
        bigint opportunityid FK
        timestamp savedat
        bool remindersent
    }
    NOTIFICATION {
        bigint notificationid PK
        bigint studentid FK
        bigint applicationid FK
        bigint bookmarkid FK
        string notificationtype
        string channel
        bool isread
    }
```

---

## 4. Activity diagram

**What changed**
- Registration now ends in a code entry step. The account activates on a correct code, and the user is logged in.
- Login has no code step. Unverified accounts see a message to verify first.
- Provider and admin flows are added as their own paths.
- Auto-apply, missing-document alerts and the summary download are marked planned.

```mermaid
flowchart TD
    subgraph Student
        S0([Start]) --> S1[Choose Register as student]
        S1 --> S2[Enter name, email, password]
        S2 --> S3{Details valid?}
        S3 -->|no| S2
        S3 -->|yes| S4[Account created, 6-digit code emailed]
        S4 --> S5[Enter code]
        S5 -->|wrong or expired| S6[Show error, resend code]
        S6 --> S5
        S5 -->|correct| S7[Account activated and logged in]
        S7 --> S8[Build profile and upload CV and matric]
        S8 --> S9[Browse eligible opportunities]
        S9 --> S10{Apply now?}
        S10 -->|no| S9
        S10 -->|yes| S11[Review pre-filled form *planned*]
        S11 --> S12[Submit, reference number issued *planned*]
        S12 --> E1([End])
    end

    subgraph Returning_user [Returning user]
        R1([Open Log in]) --> R2[Enter email and password]
        R2 --> R3{Credentials valid?}
        R3 -->|wrong| R4[Show invalid email or password]
        R4 --> R2
        R3 -->|valid but unverified| R5[Prompt to verify email first]
        R3 -->|valid and verified| R6[Token issued, open dashboard]
        R6 --> E2([End])
    end

    subgraph Provider
        P1([Register as provider]) --> P2[Enter company, industry, province]
        P2 --> P3[Enter code, account activated]
        P3 --> P4[Post listing]
        P4 --> P5[Listing pending admin approval]
        P5 --> P6[View applicants, update outcome]
        P6 --> E3([End])
    end

    subgraph Admin
        A1([Log in with admin account]) --> A2[Open verification queue]
        A2 --> A3{Verify listing?}
        A3 -->|yes| A4[Listing verified, admin recorded]
        A3 -->|no| A2
        A4 --> A5[Listing visible to students]
        A5 --> E4([End])
    end
```

---

## 5. Sequence diagrams

### 5a. Sign-up with email code

**What changed:** a 6-digit code replaces the verification link, and the code step activates the account.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FE as Frontend
    participant BE as Django API
    participant DB as Supabase Postgres
    participant SMTP as Brevo SMTP

    U->>FE: Submit registration form
    FE->>BE: POST /api/accounts/register/
    BE->>DB: Create auth_user (inactive), student or provider row
    BE->>DB: Create login_otp (hashed code)
    BE->>SMTP: Send 6-digit code
    SMTP-->>U: Code email
    BE-->>FE: 201 otp_id, resend_token
    FE-->>U: Code entry screen

    U->>FE: Enter code
    FE->>BE: POST /api/accounts/verify-otp/
    alt Code valid
        BE->>DB: Activate auth_user, mark code used
        BE-->>FE: 200 token, user (with role)
        FE-->>U: Dashboard for role
    else Wrong, expired or used
        BE-->>FE: 400 error
        FE-->>U: Error, offer resend
    end
```

### 5b. Login (no code)

**What changed:** login is one step. Unverified accounts are told to verify first.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FE as Frontend
    participant BE as Django API

    U->>FE: Enter email and password
    FE->>BE: POST /api/accounts/login/
    alt Valid and active
        BE-->>FE: 200 token, user (with role)
        FE-->>U: Dashboard for role
    else Valid but inactive
        BE-->>FE: 403 Please verify your email first
        FE-->>U: Prompt to verify
    else Invalid
        BE-->>FE: 401 Invalid email or password
        FE-->>U: Error
    end
```

### 5c. Admin verifies a listing

**What changed:** added the admin queue and the audit field.

```mermaid
sequenceDiagram
    autonumber
    actor P as Provider
    actor A as Administrator
    participant FE as Frontend
    participant BE as Django API
    participant DB as Supabase Postgres

    P->>FE: Post listing
    FE->>BE: POST /api/opportunities/provider/listings/
    BE->>DB: Insert opportunity (is_verified = false)
    BE-->>FE: 201 pending

    A->>FE: Open /admin/verify
    FE->>BE: GET /api/providers-admin/listings/pending/
    BE->>DB: Select unverified, active listings
    BE-->>FE: 200 results
    A->>FE: Click Verify
    FE->>BE: POST /api/providers-admin/listings/id/verify/
    BE->>BE: IsAdmin resolves admin row
    BE->>DB: Set is_verified = true, adminid = reviewer
    BE-->>FE: 200 verified
    Note over DB: Students see it in the eligible and all views
```

---

## 6. Application architecture

**What changed**
- Brevo SMTP added as an external service.
- OTP flow and login added in the accounts app.
- Admin endpoints and the permission layer added.
- Frontend pages updated to the current set.
- Applications and notifications marked planned where not complete.

```mermaid
flowchart LR
    subgraph Users
        S([Student])
        P([Provider])
        A([Administrator])
    end

    subgraph FE [Frontend: React, Vite, Tailwind, Netlify]
        Pages[Landing, Register, Login, Eligible, Profile, Dashboard, AdminVerify]
        Ctx[AuthContext, RequireAuth]
        API[lib/api.js: token header]
    end

    subgraph BE [Backend: Django REST Framework]
        Router[URL router /api/...]
        Perm[core/permissions: IsStudent, IsProvider, IsAdmin]
        Acc[accounts: register, login, verify-otp, resend-otp]
        Opp[opportunities: eligible, all, provider listings]
        Adm[providers_admin: pending queue, verify]
        App[applications: apply, track *planned*]
        Doc[documents: upload, signed URL]
        Not[notifications *planned*]
        OTP[otp_utils: hash, expiry, attempts, cooldown]
    end

    subgraph Ext [Data and external services]
        DB[(Supabase Postgres: auth_user, student, provider, admin, profile, opportunity, application, bookmark, notification, login_otp)]
        Bucket[(Supabase Storage: documents)]
        SMTP[(Brevo SMTP: smtp-relay.brevo.com:587)]
    end

    S --> Pages
    P --> Pages
    A --> Pages
    Pages --> Ctx --> API
    API -- HTTPS JSON --> Router
    Router --> Perm
    Perm --> Acc
    Perm --> Opp
    Perm --> Adm
    Perm --> App
    Perm --> Doc
    Perm --> Not
    Acc --> OTP
    Acc -- ORM --> DB
    Opp -- ORM and SQL --> DB
    Adm -- ORM --> DB
    OTP -- send code --> SMTP
    Doc -- upload --> Bucket

    classDef planned stroke-dasharray: 4 3,fill:#f5f5f5,color:#777;
    class App,Not planned;
```

---

## Checklist before handing back

- Each diagram uses the same names as `docs/Diagram Revision Brief.md`.
- Planned items are dashed or greyed and labelled planned.
- No em dashes in text.
- The FR numbers on the use case diagram match the agreed numbering.
