# Opportunity Eligibility Matching

---

This is an important part of the documentation because the database now contains the fields needed for the matching logic.

The system has two opportunity views:

### Eligible Opportunities

The default view.

An opportunity is considered eligible based on the student's profile and the restrictions specified by the provider.

The matching logic can use:

1. **Opportunity type**
2. **Field of study**
3. **Student type**
4. **Year level**, where applicable
5. **Qualification**, where applicable
6. **Academic average**, where a minimum is specified
7. **Province**, where a province restriction is specified
8. **Closing date / active status**

### View All Opportunities

Shows verified and active opportunities regardless of whether the student meets the eligibility criteria.

This allows students to see opportunities they may still wish to investigate.

---

## Tertiary Student matching

For a tertiary student, the relevant educational comparison is:

```
Student:
    studenttype
    fieldofstudy
    yearlevel
    academicaverage
    province
    opportunitypreference

compared with:

Opportunity:
    opportunitytype
    fieldofstudy
    yearlevelrequired
    minimumaverage
    province
```

`qualification` and `graduatetype` are not used for tertiary students.

---

## Graduate matching

For a graduate, the relevant educational comparison is:

```
Student:
    studenttype
    fieldofstudy
    qualification
    graduatetype
    academicaverage
    province
    opportunitypreference

compared with:

Opportunity:
    opportunitytype
    fieldofstudy
    requiredqualification
    minimumaverage
    province
```

`yearlevel` is not used for graduate matching.

---

# 12. Meaning of NULL Eligibility Values

A `NULL` eligibility value means the provider **did not specify that particular restriction**.

For example:

| Opportunity field | Value | Meaning |
| --- | --- | --- |
| `minimumaverage` | `70` | Student must meet the specified minimum |
| `minimumaverage` | `NULL` | No minimum average specified |
| `yearlevelrequired` | `2` | Opportunity requires the relevant year level |
| `yearlevelrequired` | `NULL` | No year-level restriction specified |
| `requiredqualification` | `Bachelor` | Bachelor's qualification required |
| `requiredqualification` | `NULL` | No qualification restriction specified |
| `province` | `Western Cape` | Province restriction applies |
| `province` | `NULL` | No province restriction |

This is particularly important because not every opportunity will explicitly state every eligibility criterion.

---

# 13. Controlled Qualification Values

The database recognises the following qualification values:

```
Higher Certificate
Diploma
Bachelor
Honours
Masters
Doctorate
```

These are used consistently between student profiles and opportunity requirements.

---

# 14. Controlled Graduate Types

The database recognises:

```
Undergraduate
Postgraduate
```

with the following intended relationship:

| Graduate Type | Qualifications |
| --- | --- |
| Undergraduate | Higher Certificate |
| Undergraduate | Diploma |
| Undergraduate | Bachelor |
| Postgraduate | Honours |
| Postgraduate | Masters |
| Postgraduate | Doctorate |

---

# 15. Data Privacy Scope

The database is designed around the professional information required by SCOUT.

### Stored student information includes:

- Name
- Email
- Institution
- Field of study
- Student type
- Year level, where applicable
- Qualification, where applicable
- Academic average
- Opportunity preference
- Province
- Uploaded professional/academic documents

### Explicitly excluded from the student profile

The SCOUT requirements exclude:

- ID numbers
- Home address
- Banking details
- Health information
- Race
- Ethnicity
- Salary expectations

This maintains the separation between the professional information needed for opportunity matching and sensitive personal information.

---

# 16. Document Storage Model

Documents are stored separately from the student's profile.

This means:

```
student
   │
   └── document
          ├── CV
          ├── Matric Certificate
          ├── Transcript
          ├── Proof of Registration
          ├── University Certificate
          └── Other Supporting Documents
```

A student can therefore upload multiple supporting documents without adding additional columns to the `profile` table.

This is preferable to adding columns such as:

```
cv
matriccertificate
transcript
proofregistration
universitycertificate
```

because the document table supports multiple document types and future document types without changing the database structure.

---

# 17. Database-Level Integrity Rules

The database enforces the following important rules:

### Student/Profile

- Each profile belongs to one student.
- A student can have only one profile.
- A profile cannot exist without a student.
- Student type must be either `Tertiary Student` or `Graduate`.
- Tertiary students must have `yearlevel`.
- Tertiary students cannot have graduate-specific fields.
- Graduates must have `graduatetype` and `qualification`.
- Graduate qualifications must correspond to their graduate type.

### Applications

- Every application belongs to a student.
- Every application belongs to an opportunity.
- A student cannot apply to the same opportunity twice.

### Bookmarks

- Every bookmark belongs to a student.
- Every bookmark belongs to an opportunity.
- A student cannot bookmark the same opportunity twice.

### Notifications

- Every notification belongs to a student.
- Application and bookmark references are optional.
- A notification cannot reference both an application and bookmark simultaneously.

### Documents

- Every document belongs to a student.
- Multiple documents may belong to the same student.

---

# 18. Django Authentication Relationship

SCOUT uses Django authentication alongside the application database.

```
student.authuserid
        │
        ▼
auth_user.id
```

The `auth_user` table is managed by Django migrations and therefore **is not part of the SCOUT application schema definition**.

The `student` table remains the application-level student record.

---

# 19. Tables in the SCOUT Application Database

The application-owned tables are:

```
student
profile
document
provider
opportunity
application
bookmark
notification
admin
```

Django-managed tables such as:

```
auth_user
auth_group
auth_permission
django_session
django_migrations
django_content_type
django_admin_log
authtoken_token
```

are managed by Django and should not be manually recreated in the application schema.

---

# 20. Summary

The final database separates SCOUT's data into distinct areas:

```
STUDENT
   │
   ├── PROFILE
   │      ├── Student Type
   │      ├── Education
   │      ├── Qualification
   │      ├── Academic Average
   │      ├── Opportunity Preference
   │      └── Province
   │
   ├── DOCUMENT
   │      ├── CV
   │      ├── Matric Certificate
   │      └── Supporting Documents
   │
   ├── APPLICATION
   │      └── OPPORTUNITY
   │
   ├── BOOKMARK
   │      └── OPPORTUNITY
   │
   └── NOTIFICATION
          ├── APPLICATION
          └── BOOKMARK

PROVIDER
   │
   └── OPPORTUNITY
          │
          ├── Eligibility
          ├── Applications
          └── Bookmarks

ADMIN
   │
   └── Opportunity Verification
```