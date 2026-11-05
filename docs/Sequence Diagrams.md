# Scout — Sequence Diagrams

Three flows that are central to the current build: signup with OTP verification, subsequent login, and the admin verification of a provider listing.

---

## 1. Signup & email verification

New users register and verify their email before gaining access. The `auth_user` row is created inactive (`is_active=False`) and only activated after the correct OTP is submitted.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FE as React Frontend
    participant BE as Django API
    participant DB as Supabase (Postgres)
    participant SMTP as Brevo SMTP

    U->>FE: Fill registration form (student or provider)
    FE->>BE: POST /api/accounts/register/
    BE->>DB: Create auth_user(is_active=False)
    BE->>DB: Create Student or Provider row
    BE->>DB: Create LoginOTP (hashed code + resend token)
    BE->>SMTP: Send OTP email
    SMTP-->>U: OTP email delivered
    BE-->>FE: 201 {otp_id, resend_token, requires_verification}
    FE-->>U: Show OTP input screen

    U->>FE: Enter six-digit code
    FE->>BE: POST /api/accounts/verify-otp/ {otp_id, otp_code}
    BE->>DB: SELECT ... FOR UPDATE LoginOTP
    BE->>BE: verify_login_otp() (expiry, attempts, hash)
    alt OTP valid
        BE->>DB: UPDATE auth_user SET is_active=TRUE
        BE->>DB: UPDATE student.is_email_verified=TRUE (if student)
        BE->>DB: Token.get_or_create(user)
        BE-->>FE: 200 {token, user: {id, email, role, ...}}
        FE-->>U: Redirect to role dashboard
    else OTP invalid or expired
        BE-->>FE: 400 {error}
        FE-->>U: Show error, allow retry or resend
    end
```

---

## 2. Login (after verification)

Login is a single step — credentials in, token out. Inactive users (unverified email) are intercepted with a specific message rather than a generic "invalid credentials".

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FE as React Frontend
    participant BE as Django API
    participant DB as Supabase (Postgres)

    U->>FE: Enter email + password
    FE->>BE: POST /api/accounts/login/
    BE->>BE: authenticate(username, password)
    alt Credentials valid and account active
        BE->>DB: Resolve role (Student, Provider or Admin)
        BE->>DB: Token.get_or_create(user)
        BE-->>FE: 200 {token, user: {..., role}}
        FE->>FE: signIn(token, user) → localStorage
        FE-->>U: Redirect to role dashboard
    else Credentials match but account inactive
        BE-->>FE: 403 "Please verify your email first"
        FE-->>U: Prompt to complete signup verification
    else Credentials invalid
        BE-->>FE: 401 "Invalid email or password"
        FE-->>U: Show error
    end
```

---

## 3. Admin verifies a pending listing (FR9)

A provider posts a listing; it is created with `is_verified=False` and is invisible to students until an admin approves it through the admin dashboard. The reviewing admin's `admin_id` is written to the opportunity row as an audit trail.

```mermaid
sequenceDiagram
    autonumber
    actor P as Provider
    actor A as Administrator
    participant FE as Frontend
    participant BE as Django API
    participant DB as Supabase (Postgres)

    P->>FE: Post opportunity form
    FE->>BE: POST /api/opportunities/provider/listings/
    BE->>DB: INSERT opportunity (is_verified=FALSE, is_active=TRUE)
    BE-->>FE: 201 listing created (pending)

    Note over A,FE: Later — admin opens the queue
    A->>FE: Open /admin/verify
    FE->>BE: GET /api/providers-admin/listings/pending/
    BE->>DB: SELECT opportunity WHERE is_verified=FALSE AND is_active=TRUE
    BE-->>FE: 200 {results: [...]}
    FE-->>A: Render queue; admin clicks one for details

    A->>FE: Click "Verify"
    FE->>BE: POST /api/providers-admin/listings/{id}/verify/
    BE->>BE: IsAdmin.has_permission(request) → load request.admin
    BE->>DB: UPDATE opportunity SET is_verified=TRUE, admin_id=request.admin.admin_id
    BE-->>FE: 200 {message, opportunity_id, verified_at}
    FE-->>A: Toast; listing disappears from queue

    Note over DB: Students now see the listing in /api/opportunities/?view=eligible
```
