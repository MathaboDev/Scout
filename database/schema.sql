-- ============================================
-- SCOUT Database Schema
-- ============================================
--Im using the Data Dictionary.md from docs folder  and ERD from the Term 2, if any chnges are made to the ERD, please update the schema.sql file accordingly.
--Not yet tested on Supabase 


-- ============================================
-- STUDENT
-- ============================================
CREATE TABLE Student (
    StudentID SERIAL PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    IsEmailVerified BOOLEAN NOT NULL DEFAULT FALSE,
    AccountStatus VARCHAR(20) NOT NULL DEFAULT 'Active',
    CreatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- ADMIN
-- ============================================
CREATE TABLE Admin (
    AdminID SERIAL PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Role VARCHAR(30) NOT NULL DEFAULT 'Moderator',
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    LastLoginAt TIMESTAMP
);

-- ============================================
-- PROVIDER
-- ============================================
CREATE TABLE Provider (
    ProviderID SERIAL PRIMARY KEY,
    CompanyName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Phone VARCHAR(20),
    Industry VARCHAR(100) NOT NULL,
    Province VARCHAR(50) NOT NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- PROFILE
-- ============================================
CREATE TABLE Profile (
    ProfileID SERIAL PRIMARY KEY,
    StudentID INT NOT NULL UNIQUE,
    Institution VARCHAR(100) NOT NULL,
    FieldOfStudy VARCHAR(100) NOT NULL,
    YearLevel INT NOT NULL,
    AcademicAverage DECIMAL(3,2) NOT NULL,
    OpportunityPreference VARCHAR(50) NOT NULL,
    Province VARCHAR(50) NOT NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    UpdatedAt TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_profile_student
        FOREIGN KEY (StudentID)
        REFERENCES Student(StudentID)
        ON DELETE CASCADE
);

-- ============================================
-- DOCUMENT
-- ============================================
CREATE TABLE Document (
    DocumentID SERIAL PRIMARY KEY,
    StudentID INT NOT NULL,
    DocumentType VARCHAR(50) NOT NULL,
    FileName VARCHAR(255) NOT NULL,
    FileURL VARCHAR(500) NOT NULL,
    FileSize INT NOT NULL,
    UploadedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_document_student
        FOREIGN KEY (StudentID)
        REFERENCES Student(StudentID)
        ON DELETE CASCADE
);

-- ============================================
-- OPPORTUNITY
-- ============================================
CREATE TABLE Opportunity (
    OpportunityID SERIAL PRIMARY KEY,
    ProviderID INT NOT NULL,
    AdminID INT NOT NULL,
    Title VARCHAR(150) NOT NULL,
    OpportunityType VARCHAR(100) NOT NULL,
    FieldOfStudy VARCHAR(100) NOT NULL,
    MinimumAverage DECIMAL(3,2) NOT NULL,
    YearLevelRequired INT NOT NULL,
    EligibilityType VARCHAR(20) NOT NULL,
    Province VARCHAR(50) NOT NULL,
    Description TEXT NOT NULL,
    ClosingDate DATE NOT NULL,
    IsVerified BOOLEAN NOT NULL DEFAULT FALSE,
    IsActive BOOLEAN NOT NULL DEFAULT FALSE,
    PostedAt TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_opportunity_provider
        FOREIGN KEY (ProviderID)
        REFERENCES Provider(ProviderID),

    CONSTRAINT fk_opportunity_admin
        FOREIGN KEY (AdminID)
        REFERENCES Admin(AdminID)
);

-- ============================================
-- APPLICATION
-- ============================================
CREATE TABLE Application (
    ApplicationID SERIAL PRIMARY KEY,
    StudentID INT NOT NULL,
    OpportunityID INT NOT NULL,
    ReferenceNumber VARCHAR(50) NOT NULL UNIQUE,
    Status VARCHAR(30) NOT NULL DEFAULT 'Submitted',
    SubmittedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    ReviewedAt TIMESTAMP,
    OutcomeReceivedAt TIMESTAMP,
    OutcomeResult VARCHAR(20),
    UpdatedAt TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_application_student
        FOREIGN KEY (StudentID)
        REFERENCES Student(StudentID)
        ON DELETE CASCADE,

    CONSTRAINT fk_application_opportunity
        FOREIGN KEY (OpportunityID)
        REFERENCES Opportunity(OpportunityID)
        ON DELETE CASCADE,

    CONSTRAINT uq_student_application
        UNIQUE(StudentID, OpportunityID)
);

-- ============================================
-- BOOKMARK
-- ============================================
CREATE TABLE Bookmark (
    BookmarkID SERIAL PRIMARY KEY,
    StudentID INT NOT NULL,
    OpportunityID INT NOT NULL,
    SavedAt TIMESTAMP NOT NULL DEFAULT NOW(),
    ReminderSent BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_bookmark_student
        FOREIGN KEY (StudentID)
        REFERENCES Student(StudentID)
        ON DELETE CASCADE,

    CONSTRAINT fk_bookmark_opportunity
        FOREIGN KEY (OpportunityID)
        REFERENCES Opportunity(OpportunityID)
        ON DELETE CASCADE,

    CONSTRAINT uq_student_bookmark
        UNIQUE(StudentID, OpportunityID)
);

-- ============================================
-- NOTIFICATION
-- ============================================
CREATE TABLE Notification (
    NotificationID SERIAL PRIMARY KEY,
    StudentID INT NOT NULL,
    ApplicationID INT,
    BookmarkID INT,
    NotificationType VARCHAR(50) NOT NULL,
    Channel VARCHAR(20) NOT NULL,
    Message TEXT NOT NULL,
    IsRead BOOLEAN NOT NULL DEFAULT FALSE,
    SentAt TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_notification_student
        FOREIGN KEY (StudentID)
        REFERENCES Student(StudentID)
        ON DELETE CASCADE,

    CONSTRAINT fk_notification_application
        FOREIGN KEY (ApplicationID)
        REFERENCES Application(ApplicationID)
        ON DELETE CASCADE,

    CONSTRAINT fk_notification_bookmark
        FOREIGN KEY (BookmarkID)
        REFERENCES Bookmark(BookmarkID)
        ON DELETE CASCADE,

    CONSTRAINT chk_notification_reference
        CHECK (
            NOT (
                ApplicationID IS NOT NULL
                AND
                BookmarkID IS NOT NULL
            )
        )
);