/*
  Scout shared constants.
  Import these on BOTH the student side and the provider side so the two
  can never drift apart (FR6 / NFR5: one status field, same names everywhere).
*/

// FR6 / NFR5 — the only three application statuses.
export const APPLICATION_STATUSES = ["Submitted", "Under Review", "Outcome Received"];

// FR1 / FR2 — opportunity types.
export const OPPORTUNITY_TYPES = ["Internship", "Learnership", "Graduate programme"];

// Same list as the student Profile page.
export const FIELD_OF_STUDY_OPTIONS = [
  "Information Technology",
  "Computer Science",
  "Engineering",
  "Commerce & Accounting",
  "Health Sciences",
  "Law",
  "Humanities & Social Sciences",
  "Natural Sciences",
  "Education",
  "Other",
];

export const YEAR_OPTIONS = [1, 2, 3, 4, 5, 6];

// Value meaning "no restriction" for the structured eligibility fields on a listing.
export const ANY = "Any";

// FR1 — documents students upload once. Providers only ever see these,
// never ID numbers or other sensitive fields (FR8 / NFR1).
// If the team changes the required-documents list, change it here only.
export const DOCUMENT_TYPES = [
  { key: "matric_certificate", label: "Matric certificate" },
  { key: "transcript", label: "Academic transcript" },
  { key: "proof_of_registration", label: "Proof of registration" },
];
