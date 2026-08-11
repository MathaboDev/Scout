-- ============================================================
-- SCOUT DATABASE SCHEMA
-- ============================================================
--
-- This file describes the application-owned database schema.
--
-- IMPORTANT:
-- Django authentication tables such as auth_user,
-- auth_group, django_session, etc. are managed by Django
-- migrations and are NOT created by this file.
--
-- Naming convention:
-- All application table and column names use lowercase.
--
-- ============================================================


-- ============================================================
-- STUDENT
-- ============================================================

CREATE TABLE student (
    studentid BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    firstname VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,

    -- Django's auth_user.password is the real credential store.
    -- This remains nullable for compatibility with the current design.
    passwordhash VARCHAR(255),

    -- Links Scout student to Django auth_user.
    authuserid INTEGER UNIQUE,

    isemailverified BOOLEAN NOT NULL DEFAULT FALSE,
    accountstatus VARCHAR(20) NOT NULL DEFAULT 'active',
    createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_student_authuser
        FOREIGN KEY (authuserid)
        REFERENCES auth_user(id)
);


-- ============================================================
-- ADMIN
-- ============================================================

CREATE TABLE admin (
    adminid BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    firstname VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'moderator',
    isactive BOOLEAN NOT NULL DEFAULT TRUE,
    createdat TIMESTAMPTZ NOT NULL,
    lastloginat TIMESTAMPTZ
);


-- ============================================================
-- PROVIDER
-- ============================================================

CREATE TABLE provider (
    providerid BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    companyname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    industry VARCHAR(100) NOT NULL,
    province VARCHAR(50) NOT NULL,
    createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- PROFILE
-- ============================================================

CREATE TABLE profile (
    profileid BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    studentid BIGINT NOT NULL UNIQUE,

    -- Applies to all students
    studenttype VARCHAR(30) NOT NULL,
    institution VARCHAR(100) NOT NULL,
    fieldofstudy VARCHAR(100) NOT NULL,
    academicaverage DOUBLE PRECISION NOT NULL,
    opportunitypreference VARCHAR(50) NOT NULL,
    province VARCHAR(50) NOT NULL,

    -- Tertiary Student only
    yearlevel BIGINT,

    -- Graduate only
    graduatetype VARCHAR(30),
    qualification VARCHAR(50),

    createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_profile_student
        FOREIGN KEY (studentid)
        REFERENCES student(studentid)
        ON DELETE CASCADE,

    CONSTRAINT chk_profile_studenttype
        CHECK (
            studenttype IN ('Tertiary Student', 'Graduate')
        ),

    CONSTRAINT chk_profile_graduatetype
        CHECK (
            graduatetype IS NULL
            OR graduatetype IN ('Undergraduate', 'Postgraduate')
        ),

    CONSTRAINT chk_profile_qualification
        CHECK (
            qualification IS NULL
            OR qualification IN (
                'Higher Certificate',
                'Diploma',
                'Bachelor',
                'Honours',
                'Masters',
                'Doctorate'
            )
        ),

    CONSTRAINT chk_profile_studenttype_fields
        CHECK (
            (
                studenttype = 'Tertiary Student'
                AND yearlevel IS NOT NULL
                AND graduatetype IS NULL
                AND qualification IS NULL
            )
            OR
            (
                studenttype = 'Graduate'
                AND yearlevel IS NULL
                AND graduatetype = 'Undergraduate'
                AND qualification IN (
                    'Higher Certificate',
                    'Diploma',
                    'Bachelor'
                )
            )
            OR
            (
                studenttype = 'Graduate'
                AND yearlevel IS NULL
                AND graduatetype = 'Postgraduate'
                AND qualification IN (
                    'Honours',
                    'Masters',
                    'Doctorate'
                )
            )
        )
);


-- ============================================================
-- DOCUMENT
-- ============================================================

CREATE TABLE document (
    documentid BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    studentid BIGINT NOT NULL,
    documenttype VARCHAR(50) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    fileurl VARCHAR(500) NOT NULL,
    filesize BIGINT NOT NULL,
    uploadedat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    isactive BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_document_student
        FOREIGN KEY (studentid)
        REFERENCES student(studentid)
        ON DELETE CASCADE
);


-- ============================================================
-- OPPORTUNITY
-- ============================================================

CREATE TABLE opportunity (
    opportunityid BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    providerid BIGINT NOT NULL,
    adminid BIGINT NOT NULL,

    title VARCHAR(150) NOT NULL,
    opportunitytype VARCHAR(100) NOT NULL,
    fieldofstudy VARCHAR(100) NOT NULL,

    -- Optional eligibility criteria.
    -- NULL means the provider did not specify a restriction.
    minimumaverage DOUBLE PRECISION,

    -- Tertiary student eligibility.
    -- NULL means no year-level restriction was specified.
    yearlevelrequired BIGINT,

    -- Graduate qualification eligibility.
    -- NULL means no qualification restriction was specified.
    requiredqualification VARCHAR(50),

    eligibilitytype VARCHAR(20) NOT NULL,

    -- NULL means no province restriction / nationally available.
    province VARCHAR(50),

    description TEXT NOT NULL,
    closingdate TIMESTAMPTZ NOT NULL,
    isverified BOOLEAN NOT NULL DEFAULT FALSE,
    isactive BOOLEAN NOT NULL DEFAULT FALSE,
    postedat TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_opportunity_provider
        FOREIGN KEY (providerid)
        REFERENCES provider(providerid),

    CONSTRAINT fk_opportunity_admin
        FOREIGN KEY (adminid)
        REFERENCES admin(adminid),

    CONSTRAINT chk_opportunity_requiredqualification
        CHECK (
            requiredqualification IS NULL
            OR requiredqualification IN (
                'Higher Certificate',
                'Diploma',
                'Bachelor',
                'Honours',
                'Masters',
                'Doctorate'
            )
        ),

    CONSTRAINT chk_opportunity_minimumaverage
        CHECK (
            minimumaverage IS NULL
            OR minimumaverage >= 0
        ),

    CONSTRAINT chk_opportunity_yearlevelrequired
        CHECK (
            yearlevelrequired IS NULL
            OR yearlevelrequired > 0
        )
);


-- ============================================================
-- APPLICATION
-- ============================================================

CREATE TABLE application (
    applicationid BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    studentid BIGINT NOT NULL,
    opportunityid BIGINT NOT NULL,

    referencenumber VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'Submitted',

    submittedat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewedat TIMESTAMPTZ,
    outcomereceivedat TIMESTAMPTZ,
    outcomeresult VARCHAR(20),
    updatedat TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_application_student
        FOREIGN KEY (studentid)
        REFERENCES student(studentid)
        ON DELETE CASCADE,

    CONSTRAINT fk_application_opportunity
        FOREIGN KEY (opportunityid)
        REFERENCES opportunity(opportunityid)
        ON DELETE CASCADE,

    -- NFR5:
    -- Prevents the same student from applying to the same
    -- opportunity more than once.
    CONSTRAINT uq_student_application
        UNIQUE (studentid, opportunityid)
);


-- ============================================================
-- BOOKMARK
-- ============================================================

CREATE TABLE bookmark (
    bookmarkid BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    studentid BIGINT NOT NULL,
    opportunityid BIGINT NOT NULL,

    savedat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    remindersent BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_bookmark_student
        FOREIGN KEY (studentid)
        REFERENCES student(studentid)
        ON DELETE CASCADE,

    CONSTRAINT fk_bookmark_opportunity
        FOREIGN KEY (opportunityid)
        REFERENCES opportunity(opportunityid)
        ON DELETE CASCADE,

    CONSTRAINT uq_student_bookmark
        UNIQUE (studentid, opportunityid)
);


-- ============================================================
-- NOTIFICATION
-- ============================================================

CREATE TABLE notification (
    notificationid BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    studentid BIGINT NOT NULL,

    -- A notification may relate to an application OR bookmark.
    applicationid BIGINT,
    bookmarkid BIGINT,

    notificationtype VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    isread BOOLEAN NOT NULL DEFAULT FALSE,
    sentat TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notification_student
        FOREIGN KEY (studentid)
        REFERENCES student(studentid)
        ON DELETE CASCADE,

    CONSTRAINT fk_notification_application
        FOREIGN KEY (applicationid)
        REFERENCES application(applicationid)
        ON DELETE CASCADE,

    CONSTRAINT fk_notification_bookmark
        FOREIGN KEY (bookmarkid)
        REFERENCES bookmark(bookmarkid)
        ON DELETE CASCADE,

    CONSTRAINT chk_notification_reference
        CHECK (
            NOT (
                applicationid IS NOT NULL
                AND
                bookmarkid IS NOT NULL
            )
        )
);