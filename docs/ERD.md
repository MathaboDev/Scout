# Scout — Entity Relationship Diagram

The complete data model. Django's own `auth_user` and `auth_token` tables sit alongside Scout's application tables; the two sides meet through `student.authuserid`, `provider.authuserid` and `login_otp.user_id`.

```mermaid
erDiagram
    auth_user ||--o| student        : "1:1 authuserid"
    auth_user ||--o| provider       : "1:1 authuserid"
    auth_user ||--o{ login_otp      : "1:M user_id"
    auth_user ||--o| auth_token     : "1:1 (DRF token)"

    student   ||--|| profile        : "1:1 studentid"
    student   ||--o{ document       : "1:M studentid"
    student   ||--o{ application    : "1:M studentid"
    student   ||--o{ bookmark       : "1:M studentid"
    student   ||--o{ notification   : "1:M studentid"

    provider  ||--o{ opportunity    : "1:M providerid"
    admin     ||--o{ opportunity    : "1:M adminid (audit)"

    opportunity ||--o{ application  : "1:M opportunityid"
    opportunity ||--o{ bookmark     : "1:M opportunityid"

    application ||--o{ notification : "1:M applicationid"
    bookmark    ||--o{ notification : "1:M bookmarkid"

    auth_user {
      int id PK
      string username
      string email
      string password
      bool is_active
      bool is_staff
    }
    student {
      bigint studentid PK
      int authuserid FK
      string email UK
      string firstname
      string lastname
      bool isemailverified
      string accountstatus
    }
    provider {
      bigint providerid PK
      int authuserid FK
      string companyname
      string email UK
      string industry
      string province
      string phone
    }
    admin {
      bigint adminid PK
      string email UK
      string firstname
      string lastname
      string role
      bool isactive
    }
    profile {
      bigint profileid PK
      bigint studentid FK,UK
      string studenttype
      string institution
      string fieldofstudy
      float academicaverage
      string opportunitypreference
      string province
      int yearlevel
      string graduatetype
      string qualification
    }
    document {
      bigint documentid PK
      bigint studentid FK
      string documenttype
      string filename
      string fileurl
      bigint filesize
      bool isactive
    }
    opportunity {
      bigint opportunityid PK
      bigint providerid FK
      bigint adminid FK
      string title
      string opportunitytype
      string fieldofstudy
      float minimumaverage
      int yearlevelrequired
      string requiredqualification
      string eligibilitytype
      string province
      bool isverified
      bool isactive
      timestamp closingdate
    }
    application {
      bigint applicationid PK
      bigint studentid FK
      bigint opportunityid FK
      string referencenumber UK
      string status
      string outcomeresult
      timestamp submittedat
    }
    bookmark {
      bigint bookmarkid PK
      bigint studentid FK
      bigint opportunityid FK
      bool remindersent
    }
    notification {
      bigint notificationid PK
      bigint studentid FK
      bigint applicationid FK
      bigint bookmarkid FK
      string notificationtype
      string channel
      bool isread
    }
    login_otp {
      bigint id PK
      int user_id FK
      string code_hash
      string resend_token_hash
      int resend_count
      int attempts
      bool is_used
      timestamp expires_at
    }
    auth_token {
      string key PK
      int user_id FK,UK
      timestamp created
    }
```

## Cardinality notes

- `student ||--|| profile` — every active student is expected to have a profile; the `1:1` constraint is enforced by the `UNIQUE (studentid)` on `profile`.
- `admin ||--o{ opportunity` is an *audit* relationship: `opportunity.adminid` records which administrator verified the listing, not who owns it.
- `notification` references either an application OR a bookmark, never both (CHECK constraint `chk_notification_reference`).
- The `auth_user.is_staff` flag, combined with a matching email in the `admin` table, resolves the administrator role.
