/*
  Scout — dummy data layer (scouter/provider side)
  --------------------------------------------------
  Stands in for the backend for now, using localStorage. Every page/component
  should call these functions rather than touching localStorage directly —
  that way, when the real API exists, you only need to rewrite the insides
  of these functions (e.g. swap them for fetch() calls); nothing in the
  pages/components needs to change.
*/

const STORAGE_KEYS = {
  LISTINGS: "scout_listings",
  APPLICANTS: "scout_applicants",
};

/* ---------------- seed data (only runs once, if storage is empty) ---------------- */

export function seedData() {
  if (!localStorage.getItem(STORAGE_KEYS.LISTINGS)) {
    const listings = [
      {
        id: "L1",
        title: "Software developer intern",
        company: "ByteWorks",
        type: "Internship",
        location: "Remote, South Africa",
        description:
          "Join our engineering team to build and ship features across our web platform. You'll pair with senior developers and work on real production code.",
        requirements: "Currently studying IT/Computer Science, familiar with at least one programming language, eager to learn.",
        postedDate: "2026-09-23",
        closingDate: "2026-10-10",
        status: "Open",
      },
      {
        id: "L2",
        title: "Junior product manager",
        company: "ByteWorks",
        type: "Full-time",
        location: "Johannesburg, hybrid",
        description:
          "Support the product team with user research, writing specs, and coordinating between design and engineering.",
        requirements: "Recent graduate or final-year student, strong written communication, interest in tech products.",
        postedDate: "2026-09-21",
        closingDate: "2026-10-05",
        status: "Open",
      },
      {
        id: "L3",
        title: "Data analyst intern",
        company: "ByteWorks",
        type: "Internship",
        location: "On-site, South Africa",
        description:
          "Assist the analytics team with cleaning datasets, building dashboards, and preparing reports for stakeholders.",
        requirements: "Studying Data Science, Statistics, or IT; comfortable with spreadsheets; SQL a plus.",
        postedDate: "2026-09-19",
        closingDate: "2026-09-30",
        status: "Open",
      },
    ];
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
  }

  if (!localStorage.getItem(STORAGE_KEYS.APPLICANTS)) {
    const applicants = [
      {
        id: "A1",
        listingId: "L1",
        studentName: "Tumelo Mahlangu",
        studentEmail: "tumelo.m@example.com",
        institution: "CPUT",
        fieldOfStudy: "Information Technology",
        year: "Final year",
        appliedDate: "2026-09-24",
        status: "Submitted",
        documents: { cv: true, transcript: false, idDoc: true },
      },
      {
        id: "A2",
        listingId: "L1",
        studentName: "Aisha Ndlovu",
        studentEmail: "aisha.n@example.com",
        institution: "UCT",
        fieldOfStudy: "Computer Science",
        year: "3rd year",
        appliedDate: "2026-09-23",
        status: "Under review",
        documents: { cv: true, transcript: true, idDoc: true },
      },
      {
        id: "A3",
        listingId: "L1",
        studentName: "Sipho Khumalo",
        studentEmail: "sipho.k@example.com",
        institution: "CPUT",
        fieldOfStudy: "Software Engineering",
        year: "Final year",
        appliedDate: "2026-09-20",
        status: "Interview",
        documents: { cv: true, transcript: true, idDoc: true },
      },
      {
        id: "A4",
        listingId: "L2",
        studentName: "Naledi Dube",
        studentEmail: "naledi.d@example.com",
        institution: "Wits",
        fieldOfStudy: "Business Information Systems",
        year: "Final year",
        appliedDate: "2026-09-22",
        status: "Submitted",
        documents: { cv: true, transcript: false, idDoc: false },
      },
      {
        id: "A5",
        listingId: "L3",
        studentName: "Karabo Molefe",
        studentEmail: "karabo.m@example.com",
        institution: "CPUT",
        fieldOfStudy: "Data Science",
        year: "2nd year",
        appliedDate: "2026-09-19",
        status: "Rejected",
        documents: { cv: true, transcript: true, idDoc: true },
      },
    ];
    localStorage.setItem(STORAGE_KEYS.APPLICANTS, JSON.stringify(applicants));
  }
}

/* ---------------- listings ---------------- */

export function getListings() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.LISTINGS)) || [];
}

function saveListings(listings) {
  localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
}

export function getListingById(id) {
  return getListings().find((l) => l.id === id);
}

export function addListing(listing) {
  const listings = getListings();
  const newListing = {
    ...listing,
    id: "L" + Date.now(),
    postedDate: new Date().toISOString().slice(0, 10),
    status: "Open",
  };
  listings.unshift(newListing);
  saveListings(listings);
  return newListing;
}

/* ---------------- applicants ---------------- */

export function getApplicants() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICANTS)) || [];
}

function saveApplicants(applicants) {
  localStorage.setItem(STORAGE_KEYS.APPLICANTS, JSON.stringify(applicants));
}

export function getApplicantsForListing(listingId) {
  return getApplicants().filter((a) => a.listingId === listingId);
}

export function getApplicantById(id) {
  return getApplicants().find((a) => a.id === id);
}

export function updateApplicantStatus(id, status) {
  const applicants = getApplicants();
  const applicant = applicants.find((a) => a.id === id);
  if (applicant) {
    applicant.status = status;
    applicant.statusUpdatedDate = new Date().toISOString().slice(0, 10);
    saveApplicants(applicants);
  }
  return applicant;
}

/* ---------------- small shared helper ---------------- */

export function statusBadgeClass(status) {
  const map = {
    Submitted: "sp-status-submitted",
    "Under review": "sp-status-review",
    Interview: "sp-status-interview",
    Accepted: "sp-status-accepted",
    Rejected: "sp-status-rejected",
  };
  return map[status] || "sp-status-submitted";
}
