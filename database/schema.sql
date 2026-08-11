
-- SCOUT Database Schema
-- ============================================
-- Tables live in Supabase; this file documents their structure — it is
-- not run against a fresh database (the live tables already exist and
-- were renamed to lowercase directly in Supabase). If this ever needs to
-- be run fresh, note that Postgres folds all these unquoted identifiers
-- to lowercase automatically, matching what's live.
--
-- authuserid on student bridges to Django's own auth_user table (created
-- by `python manage.py migrate`, not by this file) — Django's
-- TokenAuthentication identifies people via auth_user, not via student
-- directly, so this column is what links the two.

-- ============================================
-- STUDENT
-- ============================================
CREATE TABLE student (
    studentid SERIAL PRIMARY KEY,
    firstname VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    passwordhash VARCHAR(255),  -- nullable: Django's auth_user.password is now the real credential store
    authuserid INTEGER UNIQUE REFERENCES authuser(id) ON DELETE CASCADE,
    isemailverified BOOLEAN NOT NULL DEFAULT FALSE,
    accountstatus VARCHAR(20) NOT NULL DEFAULT 'Active',
    createdat TIMESTAMP NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- ADMIN
-- ============================================
CREATE TABLE admin (
    adminid SERIAL PRIMARY KEY,
    firstname VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'Moderator',
    isactive BOOLEAN NOT NULL DEFAULT TRUE,
    createdat TIMESTAMP NOT NULL DEFAULT NOW(),
    lastloginat TIMESTAMP
);

-- ============================================
-- PROVIDER
-- ============================================
CREATE TABLE provider (
    providerid SERIAL PRIMARY KEY,
    companyname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    industry VARCHAR(100) NOT NULL,
    province VARCHAR(50) NOT NULL,
    createdat TIMESTAMP NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- PROFILE
-- ============================================
CREATE TABLE profile (
    profileid SERIAL PRIMARY KEY,
    studentid INT NOT NULL UNIQUE,
    institution VARCHAR(100) NOT NULL,
    fieldofstudy VARCHAR(100) NOT NULL,
    yearlevel INT NOT NULL,
    academicaverage DECIMAL(5,2) NOT NULL,
    opportunitypreference VARCHAR(50) NOT NULL,
    province VARCHAR(50) NOT NULL,
    createdat TIMESTAMP NOT NULL DEFAULT NOW(),
    updatedat TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_profile_student
        FOREIGN KEY (studentid)
        REFERENCES student(studentid)
        ON DELETE CASCADE
);

-- ============================================
-- DOCUMENT
-- ============================================
CREATE TABLE document (
    documentid SERIAL PRIMARY KEY,
    studentid INT NOT NULL,
    documenttype VARCHAR(50) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    fileurl VARCHAR(500) NOT NULL,
    filesize INT NOT NULL,
    uploadedat TIMESTAMP NOT NULL DEFAULT NOW(),
    isactive BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_document_student
        FOREIGN KEY (studentid)
        REFERENCES student(studentid)
        ON DELETE CASCADE
);

-- ============================================
-- OPPORTUNITY
-- ============================================
CREATE TABLE opportunity (
    opportunityid SERIAL PRIMARY KEY,
    providerid INT NOT NULL,
    adminid INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    opportunitytype VARCHAR(100) NOT NULL,
    fieldofstudy VARCHAR(100) NOT NULL,
    minimumaverage DECIMAL(5,2) NOT NULL,
    yearlevelrequired INT NOT NULL,
    eligibilitytype VARCHAR(20) NOT NULL,
    province VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    closingdate DATE NOT NULL,
    isverified BOOLEAN NOT NULL DEFAULT FALSE,
    isactive BOOLEAN NOT NULL DEFAULT FALSE,
    postedat TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_opportunity_provider
        FOREIGN KEY (providerid)
        REFERENCES provider(providerid),

    CONSTRAINT fk_opportunity_admin
        FOREIGN KEY (adminid)
        REFERENCES admin(adminid)
);

-- ============================================
-- APPLICATION
-- ============================================
CREATE TABLE application (
    applicationid SERIAL PRIMARY KEY,
    studentid INT NOT NULL,
    opportunityid INT NOT NULL,
    referencenumber VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'Submitted',
    submittedat TIMESTAMP NOT NULL DEFAULT NOW(),
    reviewedat TIMESTAMP,
    outcomereceivedat TIMESTAMP,
    outcomeresult VARCHAR(20),
    updatedat TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_application_student
        FOREIGN KEY (studentid)
        REFERENCES student(studentid)
        ON DELETE CASCADE,

    CONSTRAINT fk_application_opportunity
        FOREIGN KEY (opportunityid)
        REFERENCES opportunity(opportunityid)
        ON DELETE CASCADE,

    CONSTRAINT uq_student_application
        UNIQUE(studentid, opportunityid)
);

-- ============================================
-- BOOKMARK
-- ============================================
CREATE TABLE bookmark (
    bookmarkid SERIAL PRIMARY KEY,
    studentid INT NOT NULL,
    opportunityid INT NOT NULL,
    savedat TIMESTAMP NOT NULL DEFAULT NOW(),
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
        UNIQUE(studentid, opportunityid)
);

-- ============================================
-- NOTIFICATION
-- ============================================
CREATE TABLE notification (
    notificationid SERIAL PRIMARY KEY,
    studentid INT NOT NULL,
    applicationid INT,
    bookmarkid INT,
    notificationtype VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    isread BOOLEAN NOT NULL DEFAULT FALSE,
    sentat TIMESTAMP NOT NULL DEFAULT NOW(),

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
