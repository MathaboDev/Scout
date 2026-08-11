-- ============================================
-- Scout Database Test Data
-- ============================================

-- ============================================
-- 1. STUDENTS
-- ============================================

INSERT INTO Student (
    FirstName,
    LastName,
    Email,
    PasswordHash,
    IsEmailVerified,
    AccountStatus
)
VALUES
(
    'Tumelo',
    'Madela',
    'tumelo.madela@example.com',
    '$2b$12$examplehashstudent001',
    TRUE,
    'Active'
),
(
    'Lerato',
    'Mokoena',
    'lerato.mokoena@example.com',
    '$2b$12$examplehashstudent002',
    TRUE,
    'Active'
),
(
    'Sipho',
    'Ndlovu',
    'sipho.ndlovu@example.com',
    '$2b$12$examplehashstudent003',
    TRUE,
    'Active'
),
(
    'Amahle',
    'Dlamini',
    'amahle.dlamini@example.com',s
    '$2b$12$examplehashstudent004',
    TRUE,
    'Active'
);

-- ============================================
-- 2. ADMINS
-- ============================================

INSERT INTO Admin (
    FirstName,
    LastName,
    Email,
    Password,
    Role,
    IsActive
)
VALUES
(
    'Thabo',
    'Molefe',
    'admin@scout.example.com',
    '$2b$12$examplehashadmin001',
    'Moderator',
    TRUE
),
(
    'Nandi',
    'Khumalo',
    'nandi.admin@scout.example.com',
    '$2b$12$examplehashadmin002',
    'Moderator',
    TRUE
);

-- ============================================
-- 3. PROVIDERS
-- ============================================

INSERT INTO Provider (
    CompanyName,
    Email,
    Phone,
    Industry,
    Province
)
VALUES
(
    'Tech Solutions SA',
    'careers@techsolutions.example.com',
    '0215550101',
    'Information Technology',
    'Western Cape'
),
(
    'Cape Digital Labs',
    'internships@capedigital.example.com',
    '0215550102',
    'Software Development',
    'Western Cape'
),
(
    'DataWorks South Africa',
    'careers@dataworks.example.com',
    '0115550103',
    'Data Science',
    'Gauteng'
);

-- ============================================
-- 4. PROFILES
-- ============================================

INSERT INTO Profile (
    StudentID,
    Institution,
    FieldOfStudy,
    YearLevel,
    AcademicAverage,
    OpportunityPreference,
    Province
)
VALUES
(
    1,
    'Cape Peninsula University of Technology',
    'Application Development',
    2,
    72.50,
    'Internship',
    'Western Cape'
),
(
    2,
    'Cape Peninsula University of Technology',
    'Information Technology',
    2,
    68.00,
    'Internship',
    'Western Cape'
),
(
    3,
    'University of Cape Town',
    'Computer Science',
    3,
    75.50,
    'Graduate Programme',
    'Western Cape'
),
(
    4,
    'University of Johannesburg',
    'Data Science',
    2,
    81.00,
    'Internship',
    'Gauteng'
);

-- ============================================
-- 5. DOCUMENTS
-- ============================================

INSERT INTO Document (
    StudentID,
    DocumentType,
    FileName,
    FileURL,
    FileSize,
    IsActive
)
VALUES
(
    1,
    'CV',
    'Tumelo_Madela_CV.pdf',
    'https://example.com/documents/tumelo-cv.pdf',
    245760,
    TRUE
),
(
    1,
    'Academic Record',
    'Tumelo_Academic_Record.pdf',
    'https://example.com/documents/tumelo-academic-record.pdf',
    318400,
    TRUE
),
(
    2,
    'CV',
    'Lerato_Mokoena_CV.pdf',
    'https://example.com/documents/lerato-cv.pdf',
    221184,
    TRUE
),
(
    3,
    'CV',
    'Sipho_Ndlovu_CV.pdf',
    'https://example.com/documents/sipho-cv.pdf',
    287744,
    TRUE
),
(
    4,
    'CV',
    'Amahle_Dlamini_CV.pdf',
    'https://example.com/documents/amahle-cv.pdf',
    251904,
    TRUE
);

-- ============================================
-- 6. OPPORTUNITIES
-- ============================================

INSERT INTO Opportunity (
    ProviderID,
    AdminID,
    Title,
    OpportunityType,
    FieldOfStudy,
    MinimumAverage,
    YearLevelRequired,
    EligibilityType,
    Province,
    Description,
    ClosingDate,
    IsVerified,
    IsActive
)
VALUES
(
    1,
    1,
    'Junior Software Developer Internship',
    'Internship',
    'Application Development',
    65.00,
    2,
    'Students',
    'Western Cape',
    'A software development internship focused on Java, Python and web application development.',
    '2026-10-31',
    TRUE,
    TRUE
),
(
    1,
    1,
    'IT Support Internship',
    'Internship',
    'Information Technology',
    60.00,
    2,
    'Students',
    'Western Cape',
    'An IT support internship providing practical experience in troubleshooting and technical support.',
    '2026-09-30',
    TRUE,
    TRUE
),
(
    2,
    1,
    'Full Stack Developer Internship',
    'Internship',
    'Software Development',
    70.00,
    2,
    'Students',
    'Western Cape',
    'Work with a development team to build modern web applications using frontend and backend technologies.',
    '2026-11-15',
    TRUE,
    TRUE
),
(
    3,
    2,
    'Data Analytics Internship',
    'Internship',
    'Data Science',
    75.00,
    2,
    'Students',
    'Gauteng',
    'Gain practical experience working with data analysis, Python and data visualisation.',
    '2026-10-20',
    TRUE,
    TRUE
),
(
    3,
    2,
    'Junior Data Scientist Programme',
    'Graduate Programme',
    'Data Science',
    80.00,
    3,
    'Graduates',
    'Gauteng',
    'A graduate programme focused on data science, machine learning and analytics.',
    '2026-12-01',
    TRUE,
    TRUE
);

-- ============================================
-- 7. APPLICATIONS
-- ============================================

INSERT INTO Application (
    StudentID,
    OpportunityID,
    ReferenceNumber,
    Status,
    SubmittedAt,
    ReviewedAt,
    OutcomeReceivedAt,
    OutcomeResult
)
VALUES
(
    1,
    1,
    'SCOUT-2026-0001',
    'Reviewed',
    '2026-08-01 10:30:00',
    '2026-08-03 14:00:00',
    NULL,
    NULL
),
(
    1,
    3,
    'SCOUT-2026-0002',
    'Submitted',
    '2026-08-04 09:15:00',
    NULL,
    NULL,
    NULL
),
(
    2,
    1,
    'SCOUT-2026-0003',
    'Shortlisted',
    '2026-08-02 11:20:00',
    '2026-08-04 10:00:00',
    NULL,
    NULL
),
(
    3,
    3,
    'SCOUT-2026-0004',
    'Rejected',
    '2026-07-28 13:45:00',
    '2026-07-31 09:30:00',
    '2026-08-01 09:00:00',
    'Rejected'
),
(
    4,
    4,
    'SCOUT-2026-0005',
    'Accepted',
    '2026-07-25 15:00:00',
    '2026-07-28 10:00:00',
    '2026-08-02 12:00:00',
    'Accepted'
);

-- ============================================
-- 8. BOOKMARKS
-- ============================================

INSERT INTO Bookmark (
    StudentID,
    OpportunityID,
    ReminderSent
)
VALUES
(
    1,
    4,
    FALSE
),
(
    2,
    3,
    TRUE
),
(
    3,
    1,
    FALSE
),
(
    4,
    5,
    FALSE
);

-- ============================================
-- 9. NOTIFICATIONS
-- ============================================

INSERT INTO Notification (
    StudentID,
    ApplicationID,
    BookmarkID,
    NotificationType,
    Channel,
    Message,
    IsRead
)
VALUES
(
    1,
    1,
    NULL,
    'Application Update',
    'In-App',
    'Your application has been reviewed.',
    FALSE
),
(
    1,
    2,
    NULL,
    'Application Submitted',
    'Email',
    'Your application was successfully submitted.',
    TRUE
),
(
    2,
    3,
    NULL,
    'Shortlisted',
    'In-App',
    'Congratulations! You have been shortlisted for this opportunity.',
    FALSE
),
(
    3,
    4,
    NULL,
    'Application Update',
    'Email',
    'Your application status has been updated.',
    TRUE
),
(
    4,
    5,
    NULL,
    'Application Accepted',
    'Email',
    'Congratulations! Your application has been accepted.',
    FALSE
),
(
    1,
    NULL,
    1,
    'Deadline Reminder',
    'In-App',
    'A bookmarked opportunity is approaching its closing date.',
    FALSE
),
(
    2,
    NULL,
    2,
    'Deadline Reminder',
    'Email',
    'Your bookmarked opportunity is approaching its closing date.',
    TRUE
);

