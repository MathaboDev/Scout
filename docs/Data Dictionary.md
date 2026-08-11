# SCOUT Data Dictionary

**Project:** SCOUT

**Database:** PostgreSQL / Supabase

**Database Naming Convention:** lowercase table and column names

**Document Purpose:** Defines the structure, purpose, constraints, and relationships of the SCOUT application database.

---

# 1. Student

Stores the core account information for students registered on SCOUT.

| Attribute | Data Type | Nullable | Constraint | Description |
| --- | --- | --- | --- | --- |
| `studentid` | BIGINT | No | PK, Unique, Auto-generated | Unique identifier for the student |
| `firstname` | VARCHAR(50) | No |  | Student's first name |
| `lastname` | VARCHAR(50) | No |  | Student's surname |
| `email` | VARCHAR(100) | No | Unique | Student's email address |
| `passwordhash` | VARCHAR(255) | Yes |  | Legacy/compatibility field. Django `auth_user.password` is the primary credential store |
| `authuserid` | INTEGER | Yes | Unique, FK → `auth_user.id` | Links the SCOUT student record to Django authentication |
| `isemailverified` | BOOLEAN | No | Default `FALSE` | Indicates whether the student's email has been verified |
| `accountstatus` | VARCHAR(20) | No | Default `active` | Current account status |
| `createdat` | TIMESTAMPTZ | No | Default `NOW()` | Date and time the account was created |
| `updatedat` | TIMESTAMPTZ | No | Default `NOW()` | Date and time the account was last updated |

### Notes

Django manages the `auth_user` table and authentication credentials. SCOUT's `student` table stores the application's student information and links to Django using `authuserid`.

---

# 2. Profile

Stores the student's professional and educational profile information used for opportunity matching.

| Attribute | Data Type | Nullable | Constraint | Description |
| --- | --- | --- | --- | --- |
| `profileid` | BIGINT | No | PK, Unique, Auto-generated | Unique profile identifier |
| `studentid` | BIGINT | No | FK → `student`, Unique | Identifies the student who owns the profile |
| `studenttype` | VARCHAR(30) | No | `Tertiary Student` or `Graduate` | Determines which education fields apply |
| `institution` | VARCHAR(100) | No |  | University, college or other institution |
| `fieldofstudy` | VARCHAR(100) | No |  | Student's field of study |
| `yearlevel` | BIGINT | Yes | Required for tertiary students | Current year of study |
| `academicaverage` | DOUBLE PRECISION | No |  | Student's academic average |
| `opportunitypreference` | VARCHAR(50) | No |  | Preferred opportunity type |
| `province` | VARCHAR(50) | No |  | Student's province |
| `graduatetype` | VARCHAR(30) | Yes | `Undergraduate` or `Postgraduate` | Applies to graduate students |
| `qualification` | VARCHAR(50) | Yes | Controlled values | Graduate qualification |
| `createdat` | TIMESTAMPTZ | No | Default `NOW()` | Profile creation date |
| `updatedat` | TIMESTAMPTZ | No | Default `NOW()` | Last profile update |

## Student type rules

### Tertiary Student

A tertiary student must provide:

- Institution
- Field of study
- Year of study
- Academic average
- Opportunity preference
- Province

The following fields are **not applicable**:

- `graduatetype`
- `qualification`

### Graduate

A graduate must provide:

- Institution
- Field of study
- Academic average
- Opportunity preference
- Province
- Graduate type
- Qualification

`yearlevel` is **not applicable** to graduates.

### Graduate type and qualification

| `graduatetype` | Valid `qualification` values |
| --- | --- |
| `Undergraduate` | Higher Certificate |
| `Undergraduate` | Diploma |
| `Undergraduate` | Bachelor |
| `Postgraduate` | Honours |
| `Postgraduate` | Masters |
| `Postgraduate` | Doctorate |

The database constraint prevents an invalid combination.

For example:

```
Graduate + Postgraduate + Diploma
```

is invalid.

---

# 3. Document

Stores references to documents uploaded by students.

| Attribute | Data Type | Nullable | Constraint | Description |
| --- | --- | --- | --- | --- |
| `documentid` | BIGINT | No | PK, Unique, Auto-generated | Unique document identifier |
| `studentid` | BIGINT | No | FK → `student` | Student who owns the document |
| `documenttype` | VARCHAR(50) | No |  | Type/category of uploaded document |
| `filename` | VARCHAR(255) | No |  | Original or stored filename |
| `fileurl` | VARCHAR(500) | No |  | Secure storage reference/location |
| `filesize` | BIGINT | No |  | Size of uploaded file |
| `uploadedat` | TIMESTAMPTZ | No | Default `NOW()` | Upload date and time |
| `isactive` | BOOLEAN | No | Default `TRUE` | Indicates whether the document is currently active |

## Document requirements

Every student must provide:

### Compulsory

- CV
- Matric certificate

### Optional

Supporting documents, such as:

- Academic transcript
- University certificate
- Proof of registration
- Other relevant supporting documentation

The database allows multiple documents per student.

**Important:** The database does not force a student to have a CV and matric certificate through a table constraint. The application/business logic must check that these compulsory documents have been uploaded.

This is intentional because a student may initially register before completing their profile/document setup.

---

# 4. Provider

Stores organisations that post opportunities on SCOUT.

| Attribute | Data Type | Nullable | Constraint | Description |
| --- | --- | --- | --- | --- |
| `providerid` | BIGINT | No | PK, Unique, Auto-generated | Unique provider identifier |
| `companyname` | VARCHAR(100) | No |  | Organisation/company name |
| `email` | VARCHAR(100) | No | Unique | Provider contact email |
| `phone` | VARCHAR(20) | Yes |  | Provider contact number |
| `industry` | VARCHAR(100) | No |  | Industry in which provider operates |
| `province` | VARCHAR(50) | No |  | Provider's province |
| `createdat` | TIMESTAMPTZ | No | Default `NOW()` | Provider creation date |
| `updatedat` | TIMESTAMPTZ | No | Default `NOW()` | Last update |

---

# 5. Opportunity

Stores internships, learnerships, graduate programmes and other opportunities posted by providers.

| Attribute | Data Type | Nullable | Constraint | Description |
| --- | --- | --- | --- | --- |
| `opportunityid` | BIGINT | No | PK, Unique, Auto-generated | Unique opportunity identifier |
| `providerid` | BIGINT | No | FK → `provider` | Provider posting the opportunity |
| `adminid` | BIGINT | No | FK → `admin` | Administrator responsible for verification |
| `title` | VARCHAR(150) | No |  | Opportunity title |
| `opportunitytype` | VARCHAR(100) | No |  | Type of opportunity |
| `fieldofstudy` | VARCHAR(100) | No |  | Field/area associated with opportunity |
| `minimumaverage` | DOUBLE PRECISION | Yes | Must be ≥ 0 if provided | Minimum academic average, if specified |
| `yearlevelrequired` | BIGINT | Yes | Must be > 0 if provided | Required tertiary year level, if specified |
| `requiredqualification` | VARCHAR(50) | Yes | Controlled values | Required qualification, if specified |
| `eligibilitytype` | VARCHAR(20) | No |  | Defines the opportunity's eligibility category |
| `province` | VARCHAR(50) | Yes |  | Province restriction; NULL means no province restriction |
| `description` | TEXT | No |  | Full opportunity description |
| `closingdate` | TIMESTAMPTZ | No |  | Application closing date/time |
| `isverified` | BOOLEAN | No | Default `FALSE` | Whether an administrator has verified the listing |
| `isactive` | BOOLEAN | No | Default `FALSE` | Whether the opportunity is currently active |
| `postedat` | TIMESTAMPTZ | No | Default `NOW()` | Date and time opportunity was posted |

## Optional eligibility fields

The following fields may be `NULL`:

- `minimumaverage`
- `yearlevelrequired`
- `requiredqualification`
- `province`

`NULL` means that the provider **did not specify that restriction**.

For example:

```
minimumaverage = NULL
```

means the opportunity does not specify a minimum academic average.

---

# 6. Application

Stores applications submitted by students for opportunities.

| Attribute | Data Type | Nullable | Constraint | Description |
| --- | --- | --- | --- | --- |
| `applicationid` | BIGINT | No | PK, Unique, Auto-generated | Unique application identifier |
| `studentid` | BIGINT | No | FK → `student` | Student submitting the application |
| `opportunityid` | BIGINT | No | FK → `opportunity` | Opportunity being applied for |
| `referencenumber` | VARCHAR(50) | No | Unique | Unique application reference |
| `status` | VARCHAR(30) | No | Default `Submitted` | Current application status |
| `submittedat` | TIMESTAMPTZ | No | Default `NOW()` | Submission date/time |
| `reviewedat` | TIMESTAMPTZ | Yes |  | Date/time application was reviewed |
| `outcomereceivedat` | TIMESTAMPTZ | Yes |  | Date/time an outcome was received |
| `outcomeresult` | VARCHAR(20) | Yes |  | Application outcome |
| `updatedat` | TIMESTAMPTZ | No | Default `NOW()` | Last update |

## Application uniqueness

The database enforces:

```
(studentid, opportunityid) UNIQUE
```

Therefore, the same student **cannot submit more than one application for the same opportunity**.

This directly supports NFR5.

---

# 7. Bookmark

Stores opportunities that students have saved for later.

| Attribute | Data Type | Nullable | Constraint | Description |
| --- | --- | --- | --- | --- |
| `bookmarkid` | BIGINT | No | PK, Unique, Auto-generated | Unique bookmark identifier |
| `studentid` | BIGINT | No | FK → `student` | Student who saved the opportunity |
| `opportunityid` | BIGINT | No | FK → `opportunity` | Saved opportunity |
| `savedat` | TIMESTAMPTZ | No | Default `NOW()` | Date/time bookmark was created |
| `remindersent` | BOOLEAN | No | Default `FALSE` | Indicates whether the deadline reminder has been sent |

## Bookmark uniqueness

The database enforces:

```
(studentid, opportunityid) UNIQUE
```

Therefore, a student cannot bookmark the same opportunity multiple times.

---

# 8. Notification

Stores notifications delivered to students.

| Attribute | Data Type | Nullable | Constraint | Description |
| --- | --- | --- | --- | --- |
| `notificationid` | BIGINT | No | PK, Unique, Auto-generated | Unique notification identifier |
| `studentid` | BIGINT | No | FK → `student` | Student receiving notification |
| `applicationid` | BIGINT | Yes | FK → `application` | Related application, if applicable |
| `bookmarkid` | BIGINT | Yes | FK → `bookmark` | Related bookmark, if applicable |
| `notificationtype` | VARCHAR(50) | No |  | Type of notification |
| `channel` | VARCHAR(20) | No |  | Delivery channel |
| `message` | TEXT | No |  | Notification content |
| `isread` | BOOLEAN | No | Default `FALSE` | Whether student has read notification |
| `sentat` | TIMESTAMPTZ | No | Default `NOW()` | Date/time notification was sent |

## Notification relationship rule

A notification can relate to:

- an application, **or**
- a bookmark, **or**
- neither, where appropriate for a general student notification.

A notification **cannot reference both an application and a bookmark at the same time**.

---

# 9. Admin

Stores SCOUT administrator accounts.

| Attribute | Data Type | Nullable | Constraint | Description |
| --- | --- | --- | --- | --- |
| `adminid` | BIGINT | No | PK, Unique, Auto-generated | Unique administrator identifier |
| `firstname` | VARCHAR(50) | No |  | Administrator first name |
| `lastname` | VARCHAR(50) | No |  | Administrator surname |
| `email` | VARCHAR(100) | No | Unique | Administrator email |
| `password` | VARCHAR(255) | No |  | Administrator password/credential field |
| `role` | VARCHAR(30) | No | Default `moderator` | Administrator role |
| `isactive` | BOOLEAN | No | Default `TRUE` | Whether administrator account is active |
| `createdat` | TIMESTAMPTZ | No |  | Account creation date |
| `lastloginat` | TIMESTAMPTZ | Yes |  | Most recent login |

---

# 10. Entity Relationships

| Entity | Relates To | Relationship | Cardinality |
| --- | --- | --- | --- |
| Student | Profile | One student has one profile | 1:1 |
| Student | Document | One student can have many documents | 1:M |
| Student | Application | One student can have many applications | 1:M |
| Student | Bookmark | One student can bookmark many opportunities | 1:M |
| Student | Notification | One student can receive many notifications | 1:M |
| Admin | Opportunity | One admin can verify/manage many opportunities | 1:M |
| Provider | Opportunity | One provider can post many opportunities | 1:M |
| Opportunity | Application | One opportunity can receive many applications | 1:M |
| Opportunity | Bookmark | One opportunity can be bookmarked by many students | 1:M |
| Application | Notification | One application can generate many notifications | 1:M |
| Bookmark | Notification | One bookmark can generate reminder notifications | 1:M |

The core relationships are consistent with the original data dictionary's relationship model.