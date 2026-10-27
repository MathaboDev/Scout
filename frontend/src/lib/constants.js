// Single source of truth for every fixed value the UI sends to the API.
// backend/core/choices.py holds the SAME lists. Change both together,
// or eligibility matching silently stops matching.

export const STUDENT_TYPE_OPTIONS = ["Tertiary Student", "Graduate"];
export const GRADUATE_TYPE_OPTIONS = ["Undergraduate", "Postgraduate"];

// Must match the CHECK constraints in schema.sql ("Bachelor", not "Bachelor Degree")
export const QUALIFICATION_OPTIONS = {
  Undergraduate: ["Higher Certificate", "Diploma", "Bachelor"],
  Postgraduate: ["Honours", "Masters", "Doctorate"],
};
export const ALL_QUALIFICATIONS = [
  ...QUALIFICATION_OPTIONS.Undergraduate,
  ...QUALIFICATION_OPTIONS.Postgraduate,
];

// FR1: internship, learnership, graduate programme
export const OPPORTUNITY_TYPES = ["Internship", "Learnership", "Graduate programme"];

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

export const PROVINCE_OPTIONS = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

export const YEAR_OPTIONS = [1, 2, 3, 4, 5, 6];

export const ELIGIBILITY_TYPES = [
  { value: "Any", label: "Students and graduates" },
  { value: "Tertiary Student", label: "Tertiary students only" },
  { value: "Graduate", label: "Graduates only" },
];

// FR5 / FR6: exactly three statuses, in order
export const APPLICATION_STATUSES = ["Submitted", "Under Review", "Outcome Received"];
export const OUTCOME_RESULTS = ["Successful", "Unsuccessful"];

// FR1 / FR4: an application can't go out without these
export const REQUIRED_DOCUMENTS = [
  { key: "cv", label: "CV" },
  { key: "matric_certificate", label: "Matric certificate" },
];

// NFR2: status changes must reach the student within 30 seconds
export const POLL_INTERVAL_MS = 15000;

// ---------- formatting helpers ----------

export function ordinalYear(year) {
  const n = Number(year);
  if (!n) return "";
  const suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
  return `${n}${suffix} year`;
}

export function formatDate(value, withTime = false) {
  if (!value) return "";
  const options = { day: "numeric", month: "short", year: "numeric" };
  if (withTime) Object.assign(options, { hour: "2-digit", minute: "2-digit" });
  return new Date(value).toLocaleString("en-ZA", options);
}

export function closingLabel(value) {
  if (!value) return "Closing date unavailable";
  const days = Math.ceil((new Date(value) - new Date()) / 86400000);
  if (days < 0) return `Closed ${formatDate(value)}`;
  if (days === 0) return "Closes today";
  if (days <= 7) return `Closes in ${days} day${days === 1 ? "" : "s"}`;
  return `Closes ${formatDate(value)}`;
}
