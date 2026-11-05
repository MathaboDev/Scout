# Scout — Use Case Diagram

Three actors interact with the system: **Student**, **Provider** and **Administrator**. Mermaid's flowchart syntax is used in the style of a UML use case diagram — actors on the sides, use cases as rounded shapes inside the system boundary. Shared use cases (registration, email verification, authentication) sit at the top.

```mermaid
flowchart LR
    %% Actors
    Student((Student))
    Provider((Provider))
    Admin((Administrator))

    subgraph System [Scout Platform]
        direction TB

        %% Shared use cases
        UC_Register([Register account])
        UC_Verify([Verify email via OTP])
        UC_Login([Log in])

        %% Student use cases
        UC_Profile([Set up profile])
        UC_Docs([Upload documents])
        UC_Browse([Browse eligible opportunities])
        UC_BrowseAll([Browse all opportunities])
        UC_Apply([Submit application])
        UC_Track([Track applications])
        UC_Bookmark([Bookmark opportunity])
        UC_Report([Download summary report])
        UC_Notif([Receive notifications])

        %% Provider use cases
        UC_Post([Post opportunity])
        UC_Edit([Edit/remove listing])
        UC_Applicants([View applicants])
        UC_Outcome([Update application status])

        %% Admin use cases
        UC_Queue([Review verification queue])
        UC_VerifyListing([Verify listing])
    end

    %% Shared
    Student --> UC_Register
    Provider --> UC_Register
    Student --> UC_Verify
    Provider --> UC_Verify
    Student --> UC_Login
    Provider --> UC_Login
    Admin --> UC_Login

    %% Student only
    Student --> UC_Profile
    Student --> UC_Docs
    Student --> UC_Browse
    Student --> UC_BrowseAll
    Student --> UC_Apply
    Student --> UC_Track
    Student --> UC_Bookmark
    Student --> UC_Report
    Student --> UC_Notif

    %% Provider only
    Provider --> UC_Post
    Provider --> UC_Edit
    Provider --> UC_Applicants
    Provider --> UC_Outcome

    %% Admin only
    Admin --> UC_Queue
    Admin --> UC_VerifyListing

    %% Include/extend relationships
    UC_Register -. "«include»" .-> UC_Verify
    UC_Apply -. "«include»" .-> UC_Docs
    UC_Post -. "«extends»" .-> UC_Queue

    classDef uc fill:#eef4fd,stroke:#2563eb,stroke-width:1px,color:#1e3a6f;
    class UC_Register,UC_Verify,UC_Login,UC_Profile,UC_Docs,UC_Browse,UC_BrowseAll,UC_Apply,UC_Track,UC_Bookmark,UC_Report,UC_Notif,UC_Post,UC_Edit,UC_Applicants,UC_Outcome,UC_Queue,UC_VerifyListing uc;
```

## Actor summary

| Actor | Scope |
|---|---|
| **Student** | Owns a profile and documents, browses and applies for opportunities, tracks outcomes, receives notifications. |
| **Provider** | Posts opportunities, reviews applicants, updates application outcomes. Every new listing enters the admin queue. |
| **Administrator** | Reviews pending listings in the verification queue; approving one makes it visible to students. Identity is recorded against the opportunity row as an audit trail (FR9). |

## Include / extend

- **`Register` «includes» `Verify email via OTP`** — a registration is only complete after OTP verification.
- **`Submit application` «includes» `Upload documents`** — if required documents are missing, the student is routed to document upload (FR4) before the review screen appears.
- **`Post opportunity` «extends» `Review verification queue`** — every newly posted listing extends into the admin queue automatically; the provider does not interact with the queue directly.
