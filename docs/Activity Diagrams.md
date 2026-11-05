# Scout — Activity Diagrams

Two end-to-end workflows: the student's journey from signup to a submitted application, and the opportunity lifecycle from the moment a provider posts it to the moment a student sees an outcome.

---

## 1. Student application journey

Covers FR1 (register + verify), FR2 (eligibility matching), FR3 (assisted apply) and FR4 (missing document detection).

```mermaid
flowchart TD
    Start([Start]) --> Register[Register account]
    Register --> OTP[Enter OTP from email]
    OTP -->|invalid| OTP
    OTP -->|valid| Dash{Profile complete?}
    Dash -->|no| Profile[Fill professional profile]
    Profile --> Docs[Upload CV + matric certificate]
    Docs --> Dash
    Dash -->|yes| Browse[Browse eligible opportunities]
    Browse --> Pick[Open an opportunity]
    Pick --> Apply{Required docs present?}
    Apply -->|no| MissDoc[Receive missing-document email + upload]
    MissDoc --> Review
    Apply -->|yes| Review[Review pre-filled application]
    Review -->|confirm| Submit[Submit application]
    Review -->|cancel| Browse
    Submit --> Receipt[Receive receipt + reference number]
    Receipt --> Track[Track status on dashboard]
    Track --> Outcome[Outcome received notification]
    Outcome --> End([End])

    classDef action fill:#eef4fd,stroke:#2563eb,color:#1e3a6f;
    classDef decision fill:#fef8ec,stroke:#d97706,color:#8a4c0a;
    class Register,OTP,Profile,Docs,Browse,Pick,MissDoc,Review,Submit,Receipt,Track,Outcome action;
    class Dash,Apply decision;
```

---

## 2. Opportunity lifecycle (provider + admin + student)

Covers FR9 (admin verification) and FR10 (provider listing management). Lanes are represented visually; Mermaid lacks native swim-lanes, so each role's step is labelled.

```mermaid
flowchart TD
    PStart([Provider posts listing]) --> PCreate[is_verified=FALSE, is_active=TRUE]
    PCreate --> Queue[Enters admin verification queue]
    Queue --> ARev{Admin reviews}
    ARev -->|verify| AV[is_verified=TRUE, admin_id=reviewer]
    ARev -->|leave for now| Queue
    AV --> Live{Closing date passed?}
    Live -->|no| Visible[Visible to students in matching view]
    Live -->|yes| Hidden[Hidden from student view]
    Visible --> SApply[Student applies]
    SApply --> NewApp[application row created]
    NewApp --> PView[Provider sees applicant in dashboard]
    PView --> PUpdate{Update outcome?}
    PUpdate -->|yes| OutcomeSet[status=Outcome Received]
    OutcomeSet --> SNotify[Student notified via dashboard + email]
    SNotify --> End([End])
    PUpdate -->|not yet| PView
    Hidden --> End

    classDef p fill:#eefaf6,stroke:#0d9488,color:#0f5f52;
    classDef a fill:#f3f1fd,stroke:#6f61e0,color:#3f3597;
    classDef s fill:#eef4fd,stroke:#2563eb,color:#1e3a6f;
    class PStart,PCreate,PView,PUpdate,OutcomeSet p;
    class Queue,ARev,AV a;
    class SApply,NewApp,SNotify,Visible,Hidden s;
```

## Legend (lifecycle)

- **Teal** — provider actions
- **Purple** — admin actions
- **Blue** — student-facing effects
