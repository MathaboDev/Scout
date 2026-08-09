## **SCOUT  Final Functional & Non-Functional Requirements**

### **Functional Requirements**

**FR1. Registration & Profile Setup**  
 Students create an account with full name, email, and password, with email verification required before full access. Profiles contain only professional information: name, email, field of study, institution, year of study, academic average, and opportunity preference (internship, learnership, graduate programme). Explicitly excluded: ID numbers, home address, banking details, health information, race, salary expectations. Students upload their matric certificate, academic transcript, and proof of registration once; documents are stored securely, reused across applications, and may be updated or replaced at any time.

**FR2. Eligibility-Based Opportunity Matching & View Toggle** *(revised)*  
 The system displays opportunities to students via two views, toggled by the student: **"Eligible Opportunities"** (default), showing only listings matching the student's profile, field of study, year level, and opportunity type,  and **"View All Opportunities"**, showing every verified, active listing regardless of eligibility. Filtering by location, field of study, or opportunity type has been removed in favor of this toggle. In both views, listings past their closing date are hidden or clearly flagged.

**FR3. Assisted Application**  
 The system pre-fills application forms using stored profile data and attaches relevant documents. Before submission, a mandatory review screen displays all pre-filled information and attachments. The system will not submit any application without the student's explicit confirmation on this screen.

**FR4. Missing Document Detection & Notification**  
 When a required document is missing from the student's profile, the system detects this and notifies the student via email with a direct link to upload it. Once uploaded, the assisted application flow resumes, again requiring the mandatory review screen before submission.

**FR5. Application Receipt, Submission Report & Downloadable Summary**  
 After each successful submission, the system generates a receipt containing the student's name, opportunity name and provider, submission date, and unique reference number. The receipt is accessible from the dashboard and emailed to the student. The system also generates a downloadable summary report of all applications made, including total submissions, status breakdown (Submitted, Under Review, Outcome Received), and all reference numbers.

**FR6. Application Tracking**  
 A centralised dashboard displays all submitted applications and their current status (Submitted, Under Review, Outcome Received), updating automatically when a provider changes an application's status, eliminating the need to check external portals.

**FR7. Bookmarking, Deadline Reminders & Notifications**  
 Students may bookmark opportunities they're not ready to apply for; bookmarks display on the dashboard with closing dates. The system sends an automated reminder three days before a bookmarked opportunity's closing date via email and in-app notification, plus real-time notifications when an application is submitted, a document is missing, an application status changes, or a provider updates an outcome.

**FR8. Data Privacy and POPIA Compliance**  
 The system strictly separates professional information (name, education, skills, qualifications) from sensitive information (ID number, home address, banking details, health information, race, ethnicity). Sensitive fields are never shared without explicit consent. The system complies with POPIA by allowing users to view, restrict, and delete their personal data at any time, with clear communication of what is stored, how it's used, and who can access it.

**FR9. Verified and Current Listings**  
 All opportunity listings must be verified by a platform administrator before going live. Expired listings are immediately hidden or removed from student views once the closing date passes.

**FR10. Provider and Administrator Management**  
 Providers can create, edit, and remove their own listings, view eligible applicants, and update application outcomes. Administrators can manage all users and listings, monitor platform activity, and suspend accounts or listings that violate platform integrity.

---

### **Non-Functional Requirements**

**NFR1. Security & Data Protection**  
 All user data encrypted in transit and at rest. Sensitive information (ID numbers, banking details, health information) must never appear in logs or API responses. Required under POPIA (No. 4 of 2013). Authentication sessions expire after inactivity; users can log out and invalidate sessions from any device.

**NFR2. Reliability & Notification Accuracy**  
 At least 99% uptime, particularly during peak application periods. Deadline reminders delivered within one minute of scheduled time; real-time status notifications reach the student within 30 seconds of a status change.

**NFR3. Usability**  
 A first-time user completes registration, profile setup, and first application within ten minutes without external guidance. Fully responsive across desktop and tablet browsers. Error messages are plain, actionable, and specific about what went wrong and what to do next.

**NFR4. Performance**  
 Opportunity search/listing results (eligible or all view) load within two seconds under normal network conditions. Supports at least 500 concurrent users without response-time degradation.

**NFR5. Data Integrity**  
 The system prevents duplicate application submissions for the same opportunity at the database level, not just the interface level. All application status changes made by providers are logged with a timestamp and the responsible provider account, and reflected on the student's dashboard within 30 seconds.

**NFR6. Maintainability & Scalability**  
 Modular architecture, component-based frontend, RESTful backend,  so features can be updated independently. Database and backend services designed to scale horizontally to accommodate national-scale usage from the outset.

