# Scout — Class Diagram

Django models that back Scout's API. All Scout models declare `managed = False` because the schema lives in `database/schema.sql`; Django only owns its own auth tables. Views in each app (`accounts`, `opportunities`, `applications`, `documents`, `notifications`, `providers_admin`) consume these models through serializers.

```mermaid
classDiagram
    class User {
        <<Django>>
        +int id
        +str username
        +str email
        +str password
        +str first_name
        +str last_name
        +bool is_active
        +bool is_staff
        +authenticate()
        +check_password()
        +set_password()
    }

    class Token {
        <<DRF>>
        +str key
        +User user
        +datetime created
    }

    class Student {
        +bigint student_id
        +str first_name
        +str last_name
        +str email
        +User auth_user
        +bool is_email_verified
        +str account_status
        +datetime created_at
    }

    class Provider {
        +bigint provider_id
        +str company_name
        +str email
        +str phone
        +str industry
        +str province
        +User auth_user
    }

    class PlatformAdmin {
        +bigint admin_id
        +str first_name
        +str last_name
        +str email
        +str role
        +bool is_active
    }

    class Profile {
        +bigint profile_id
        +Student student
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
        +Student student
        +str document_type
        +str filename
        +str file_url
        +bigint file_size
        +bool is_active
    }

    class Opportunity {
        +bigint opportunity_id
        +Provider provider
        +PlatformAdmin admin
        +str title
        +str opportunity_type
        +str field_of_study
        +float minimum_average
        +int year_level_required
        +str required_qualification
        +str eligibility_type
        +str province
        +bool is_verified
        +bool is_active
        +datetime closing_date
    }

    class Application {
        +bigint application_id
        +Student student
        +Opportunity opportunity
        +str reference_number
        +str status
        +datetime submitted_at
        +str outcome_result
    }

    class Bookmark {
        +bigint bookmark_id
        +Student student
        +Opportunity opportunity
        +bool reminder_sent
    }

    class Notification {
        +bigint notification_id
        +Student student
        +Application application
        +Bookmark bookmark
        +str notification_type
        +str channel
        +bool is_read
    }

    class LoginOTP {
        +bigint id
        +User user
        +str code_hash
        +str resend_token_hash
        +int resend_count
        +int attempts
        +bool is_used
        +datetime expires_at
    }

    class IsStudent {
        <<permission>>
        +has_permission(request)
    }
    class IsProvider {
        <<permission>>
        +has_permission(request)
    }
    class IsAdmin {
        <<permission>>
        +has_permission(request)
    }

    User "1" -- "0..1" Student       : auth_user
    User "1" -- "0..1" Provider      : auth_user
    User "1" -- "0..1" Token         : token
    User "1" -- "0..*" LoginOTP      : OTPs
    Student "1" -- "1" Profile       : has
    Student "1" -- "0..*" Document   : uploads
    Student "1" -- "0..*" Application: submits
    Student "1" -- "0..*" Bookmark   : saves
    Student "1" -- "0..*" Notification
    Provider "1" -- "0..*" Opportunity : posts
    PlatformAdmin "1" -- "0..*" Opportunity : verifies
    Opportunity "1" -- "0..*" Application
    Opportunity "1" -- "0..*" Bookmark
    Application "1" -- "0..*" Notification
    Bookmark "1" -- "0..*" Notification

    IsStudent ..> Student  : resolves
    IsProvider ..> Provider : resolves
    IsAdmin ..> PlatformAdmin : resolves
```

## Notes

- `User` is the Django `auth.User` model. `is_staff=True` plus a matching `PlatformAdmin` row by email is the signal that identifies an administrator.
- `PlatformAdmin` is deliberately named to avoid collision with `django.contrib.admin`.
- `IsStudent`, `IsProvider` and `IsAdmin` DRF permission classes attach the resolved role row to the request (`request.student`, `request.provider`, `request.admin`) so views never re-query.
- The `student.password_hash` legacy column is nullable and unused; Django's `auth_user.password` is the real credential store.
