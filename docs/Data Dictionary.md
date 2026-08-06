# SCOUT Data Dictionary

### 1. Student

| Attribute | Data Type | Size | Constraint |
| --- | --- | --- | --- |
| StudentID | INT | — | PK, Not Null, Unique (auto-increment) |
| FirstName | VARCHAR | 50 | Not Null |
| LastName | VARCHAR | 50 | Not Null |
| Email | VARCHAR | 100 | Not Null, Unique |
| PasswordHash | VARCHAR | 255 | Not Null |
| IsEmailVerified | BOOLEAN | — | Not Null, Default = FALSE |
| AccountStatus | VARCHAR | 20 | Not Null, Default = 'Active' |
| CreatedAt | TIMESTAMP | — | Not Null, Default = NOW() |
| UpdatedAt | TIMESTAMP | — | Not Null, Default = NOW() |

### 2. Profile

| Attribute | Data Type | Size | Constraint |
| --- | --- | --- | --- |
| ProfileID | INT | — | PK, Not Null, Unique (auto-increment) |
| StudentID | INT | — | FK → Student, Not Null, Unique |
| Institution | VARCHAR | 100 | Not Null |
| FieldOfStudy | VARCHAR | 100 | Not Null |
| YearLevel | INT | — | Not Null |
| AcademicAverage | DECIMAL | 3,2 | Not Null |
| OpportunityPreference | VARCHAR | 50 | Not Null |
| Province | VARCHAR | 50 | Not Null |
| CreatedAt | TIMESTAMP | — | Not Null, Default = NOW() |
| UpdatedAt | TIMESTAMP | — | Not Null, Default = NOW() |

### 3. Document

| Attribute | Data Type | Size | Constraint |
| --- | --- | --- | --- |
| DocumentID | INT | — | PK, Not Null, Unique (auto-increment) |
| StudentID | INT | — | FK → Student, Not Null |
| DocumentType | VARCHAR | 50 | Not Null |
| FileName | VARCHAR | 255 | Not Null |
| FileURL | VARCHAR | 500 | Not Null |
| FileSize | INT | — | Not Null |
| UploadedAt | TIMESTAMP | — | Not Null, Default = NOW() |
| IsActive | BOOLEAN | — | Not Null, Default = TRUE |

### 4. Provider

| Attribute | Data Type | Size | Constraint |
| --- | --- | --- | --- |
| ProviderID | INT | — | PK, Not Null, Unique (auto-increment) |
| CompanyName | VARCHAR | 100 | Not Null |
| Email | VARCHAR | 100 | Not Null, Unique |
| Phone | VARCHAR | 20 | Null |
| Industry | VARCHAR | 100 | Not Null |
| Province | VARCHAR | 50 | Not Null |
| CreatedAt | TIMESTAMP | — | Not Null, Default = NOW() |
| UpdatedAt | TIMESTAMP | — | Not Null, Default = NOW() |

### 5. Opportunity

| Attribute | Data Type | Size | Constraint |
| --- | --- | --- | --- |
| OpportunityID | INT | — | PK, Not Null, Unique (auto-increment) |
| ProviderID | INT | — | FK → Provider, Not Null |
| AdminID | INT | — | FK → Admin, Not Null |
| Title | VARCHAR | 150 | Not Null |
| OpportunityType | VARCHAR | 100 | Not Null |
| FieldOfStudy | VARCHAR | 100 | Not Null |
| MinimumAverage | DECIMAL | 3,2 | Not Null |
| YearLevelRequired | INT | — | Not Null |
| EligibilityType | VARCHAR | 20 | Not Null |
| Province | VARCHAR | 50 | Not Null |
| Description | TEXT | — | Not Null |
| ClosingDate | DATE | — | Not Null |
| isVerified | BOOLEAN | — | Not Null, Default = FALSE |
| isActive | BOOLEAN | — | Not Null, Default = FALSE |
| PostedAt | TIMESTAMP | — | Not Null, Default = NOW() |

### 6. Application

| Attribute | Data Type | Size | Constraint |
| --- | --- | --- | --- |
| ApplicationID | INT | — | PK, Not Null, Unique (auto-increment) |
| StudentID | INT | — | FK → Student, Not Null |
| OpportunityID | INT | — | FK → Opportunity, Not Null |
| ReferenceNumber | VARCHAR | 50 | Not Null, Unique |
| Status | VARCHAR | 30 | Not Null, Default = **'Submitted'** *(corrected from 'Sent' to align with FR6)* |
| SubmittedAt | TIMESTAMP | — | Not Null, Default = NOW() |
| ReviewedAt | TIMESTAMP | — | Null |
| OutcomeReceivedAt | TIMESTAMP | — | Null |
| OutcomeResult | VARCHAR | 20 | Null |
| UpdatedAt | TIMESTAMP | — | Not Null, Default = NOW() |
| — | — | — | **Composite Unique: (StudentID, OpportunityID)** — enforces NFR5, no duplicate applications |

### 7. Bookmark

| Attribute | Data Type | Size | Constraint |
| --- | --- | --- | --- |
| BookmarkID | INT | — | PK, Not Null, Unique (auto-increment) |
| StudentID | INT | — | FK → Student, Not Null |
| OpportunityID | INT | — | FK → Opportunity, Not Null |
| SavedAt | TIMESTAMP | — | Not Null, Default = NOW() |
| ReminderSent | BOOLEAN | — | Not Null, Default = FALSE |
| — | — | — | **Composite Unique: (StudentID, OpportunityID)** — prevents duplicate bookmarks |

### 8. Notification

| Attribute | Data Type | Size | Constraint |
| --- | --- | --- | --- |
| NotificationID | INT | — | PK, Not Null, Unique (auto-increment) |
| StudentID | INT | — | FK → Student, Not Null |
| ApplicationID | INT | — | FK → Application, Null |
| BookmarkID | INT | — | FK → Bookmark, Null |
| NotificationType | VARCHAR | 50 | Not Null |
| Channel | VARCHAR | 20 | Not Null |
| Message | TEXT | — | Not Null |
| IsRead | BOOLEAN | — | Not Null, Default = FALSE |
| SentAt | TIMESTAMP | — | Not Null, Default = NOW() |
| — | — | — | **Check constraint:** ApplicationID and BookmarkID cannot both be set on the same row |

### 9. Admin

| Attribute | Data Type | Size | Constraint |
| --- | --- | --- | --- |
| AdminID | INT | — | PK, Not Null, Unique (auto-increment) |
| FirstName | VARCHAR | 50 | Not Null |
| LastName | VARCHAR | 50 | Not Null |
| Email | VARCHAR | 100 | Not Null, Unique |
| Password | VARCHAR | 255 | Not Null *(Unique constraint removed — was a security/logic error)* |
| Role | VARCHAR | 30 | Not Null, Default = 'Moderator' |
| IsActive | BOOLEAN | — | Not Null, Default = TRUE |
| CreatedAt | TIMESTAMP | — | Not Null, Default = NOW() |
| LastLoginAt | TIMESTAMP | — | Null |

---

### Entity Relationships

| Entity | Relates To | Relationship | Cardinality |
| --- | --- | --- | --- |
| Student | Profile | One student has exactly one profile | 1:1 |
| Student | Document | One student can have many documents | 1:M |
| Student | Application | One student can have many applications | 1:M |
| Student | Bookmark | One student can bookmark many opportunities | 1:M |
| Student | Notification | One student can receive many notifications | 1:M |
| Admin | Opportunity | One admin can verify many opportunities | 1:M |
| Provider | Opportunity | One provider can post many opportunities | 1:M |
| Opportunity | Application | One opportunity can have many applications | 1:M |
| Opportunity | Bookmark | One opportunity can be bookmarked by many students | 1:M |
| Application | Notification | One application can trigger many notifications | 1:M |
| Bookmark | Notification | One bookmark can trigger many reminder notifications | 1:M |