/*
  Scout — dummy data layer (scouter/provider side)
  --------------------------------------------------
  Stands in for the backend for now, using localStorage. Every page/component
  should call these functions rather than touching localStorage directly —
  that way, when the real API exists, you only need to rewrite the insides
  of these functions (e.g. swap them for fetch() calls); nothing in the
  pages/components needs to change.

  Rules enforced HERE (so every page gets them for free):
  - A provider only ever sees / changes THEIR OWN listings and the applicants
    of those listings (FR10).
  - Statuses must be one of APPLICATION_STATUSES (FR6 / NFR5).
  - Every status change is logged with a timestamp and the provider account (NFR5).
  - New listings can't have a closing date in the past (mirrors the form).
*/

import { APPLICATION_STATUSES, ANY } from "./constants";

// "_v2" because the data shape changed (providerId, new statuses, new document keys).
// The first run after updating clears the old dummy data and re-seeds.
const STORAGE_KEYS = {
  LISTINGS: "scout_listings_v2",
  APPLICANTS: "scout_applicants_v2",
};
const OLD_STORAGE_KEYS = ["scout_listings", "scout_applicants"];

/* ---------------- who is logged in (dummy) ---------------- */

// Replace with the real logged-in provider once auth exists.
const CURRENT_PROVIDER = { id: "P1", name: "ByteWorks" };

export function getCurrentProvider() {
  return CURRENT_PROVIDER;
}

/* ---------------- small helpers ---------------- */

// YYYY-MM-DD in the user's LOCAL timezone (toISOString would use UTC and
// can be a day off around midnight in South Africa).
export function todayISO() {
  return new Date().toLocaleDateString("en-CA");
}

function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return []; // corrupted storage shouldn't crash the app
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function isOwned(listing) {
  return Boolean(listing) && listing.providerId === CURRENT_PROVIDER.id;
}

/* ---------------- seed data (only runs once, if storage is empty) ---------------- */

export function seedData() {
  OLD_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));

  if (!localStorage.getItem(STORAGE_KEYS.LISTINGS)) {
    const listings = [
      {
        id: "L1",
        providerId: "P1",
        title: "Software developer intern",
        company: "ByteWorks",
        type: "Internship",
        location: "Remote, South Africa",
        fieldOfStudy: "Information Technology",
        minYear: "2",
        description:
          "Join our engineering team to build and ship features across our web platform. You'll pair with senior developers and work on real production code.",
        requirements: "Familiar with at least one programming language, eager to learn.",
        postedDate: dateOffset(-4),
        closingDate: dateOffset(14),
      },
      {
        id: "L2",
        providerId: "P1",
        title: "Junior product manager",
        company: "ByteWorks",
        type: "Graduate programme",
        location: "Johannesburg, hybrid",
        fieldOfStudy: ANY,
        minYear: ANY,
        description:
          "Support the product team with user research, writing specs, and coordinating between design and engineering.",
        requirements: "Strong written communication, interest in tech products.",
        postedDate: dateOffset(-6),
        closingDate: dateOffset(7),
      },
      {
        id: "L3",
        providerId: "P1",
        title: "Data analyst intern",
        company: "ByteWorks",
        type: "Internship",
        location: "On-site, South Africa",
        fieldOfStudy: "Natural Sciences",
        minYear: ANY,
        description:
          "Assist the analytics team with cleaning datasets, building dashboards, and preparing reports for stakeholders.",
        requirements: "Comfortable with spreadsheets; SQL a plus.",
        postedDate: dateOffset(-20),
        closingDate: dateOffset(-3), // already closed, so you can see the "Closed" state
      },
      {
        // Belongs to a DIFFERENT provider. A ByteWorks login must never see this
        // or its applicant. Handy for testing the ownership rule (FR10).
        id: "L4",
        providerId: "P2",
        title: "Business analyst learner",
        company: "Cape Analytics",
        type: "Learnership",
        location: "Cape Town",
        fieldOfStudy: ANY,
        minYear: ANY,
        description: "Learnership placement in the business analysis team.",
        requirements: "",
        postedDate: dateOffset(-5),
        closingDate: dateOffset(10),
      },
    ];
    writeJSON(STORAGE_KEYS.LISTINGS, listings);
  }

  if (!localStorage.getItem(STORAGE_KEYS.APPLICANTS)) {
    const docs = (matric, transcript, proof) => ({
      matric_certificate: matric,
      transcript,
      proof_of_registration: proof,
    });

    const applicants = [
      {
        id: "A1",
        listingId: "L1",
        studentName: "Tumelo Mahlangu",
        studentEmail: "tumelo.m@example.com",
        institution: "CPUT",
        fieldOfStudy: "Information Technology",
        year: "Final year",
        appliedDate: dateOffset(-3),
        status: "Submitted",
        statusLog: [],
        documents: docs(true, false, true),
      },
      {
        id: "A2",
        listingId: "L1",
        studentName: "Aisha Ndlovu",
        studentEmail: "aisha.n@example.com",
        institution: "UCT",
        fieldOfStudy: "Computer Science",
        year: "3rd year",
        appliedDate: dateOffset(-4),
        status: "Under Review",
        statusLog: [],
        documents: docs(true, true, true),
      },
      {
        id: "A3",
        listingId: "L1",
        studentName: "Sipho Khumalo",
        studentEmail: "sipho.k@example.com",
        institution: "CPUT",
        fieldOfStudy: "Engineering",
        year: "Final year",
        appliedDate: dateOffset(-5),
        status: "Under Review",
        statusLog: [],
        documents: docs(true, true, true),
      },
      {
        id: "A4",
        listingId: "L2",
        studentName: "Naledi Dube",
        studentEmail: "naledi.d@example.com",
        institution: "Wits",
        fieldOfStudy: "Commerce & Accounting",
        year: "Final year",
        appliedDate: dateOffset(-4),
        status: "Submitted",
        statusLog: [],
        documents: docs(true, false, false),
      },
      {
        id: "A5",
        listingId: "L3",
        studentName: "Karabo Molefe",
        studentEmail: "karabo.m@example.com",
        institution: "CPUT",
        fieldOfStudy: "Natural Sciences",
        year: "2nd year",
        appliedDate: dateOffset(-15),
        status: "Outcome Received",
        statusLog: [],
        documents: docs(true, true, true),
      },
      {
        // Applicant of the OTHER provider's listing (L4). Must stay invisible.
        id: "A6",
        listingId: "L4",
        studentName: "Zanele Peters",
        studentEmail: "zanele.p@example.com",
        institution: "UWC",
        fieldOfStudy: "Information Technology",
        year: "2nd year",
        appliedDate: dateOffset(-2),
        status: "Submitted",
        statusLog: [],
        documents: docs(true, true, true),
      },
    ];
    writeJSON(STORAGE_KEYS.APPLICANTS, applicants);
  }
}

/* ---------------- listings ---------------- */

const LISTING_FIELDS = [
  "title",
  "type",
  "location",
  "fieldOfStudy",
  "minYear",
  "description",
  "requirements",
  "closingDate",
];

// keep only known fields and trim text, so stray form state can't leak into storage
function cleanListingFields(data) {
  const out = {};
  LISTING_FIELDS.forEach((key) => {
    if (data[key] !== undefined) {
      out[key] = typeof data[key] === "string" ? data[key].trim() : data[key];
    }
  });
  return out;
}

// Only the logged-in provider's listings.
export function getListings() {
  return readJSON(STORAGE_KEYS.LISTINGS).filter(isOwned);
}

// Returns undefined for a listing that doesn't exist OR a listing that belongs to someone else.
export function getListingById(id) {
  return getListings().find((l) => l.id === id);
}

export function addListing(data) {
  const fields = cleanListingFields(data);
  if (!fields.title) throw new Error("Enter a title for the listing.");
  // Mirrors the form's check so callers aren't able to bypass it (e.g. a future screen
  // that calls addListing directly).
  if (!fields.closingDate || fields.closingDate < todayISO()) {
    throw new Error("The closing date can't be in the past. Pick today or a later date.");
  }

  const newListing = {
    fieldOfStudy: ANY,
    minYear: ANY,
    requirements: "",
    ...fields,
    id: "L" + Date.now(),
    providerId: CURRENT_PROVIDER.id,
    company: CURRENT_PROVIDER.name,
    postedDate: todayISO(),
  };

  const all = readJSON(STORAGE_KEYS.LISTINGS);
  all.unshift(newListing);
  writeJSON(STORAGE_KEYS.LISTINGS, all);
  return newListing;
}

export function updateListing(id, changes) {
  const all = readJSON(STORAGE_KEYS.LISTINGS);
  const index = all.findIndex((l) => l.id === id && isOwned(l));
  if (index === -1) throw new Error("Listing not found.");

  all[index] = { ...all[index], ...cleanListingFields(changes) };
  writeJSON(STORAGE_KEYS.LISTINGS, all);
  return all[index];
}

// Removes the listing. Its applicants stay in storage (students' own records
// shouldn't vanish) but the provider can no longer reach them, because
// applicants are only reachable through the listings they own.
export function deleteListing(id) {
  const all = readJSON(STORAGE_KEYS.LISTINGS);
  if (!all.some((l) => l.id === id && isOwned(l))) throw new Error("Listing not found.");
  writeJSON(
    STORAGE_KEYS.LISTINGS,
    all.filter((l) => l.id !== id)
  );
}

// "Open" until the end of the closing date, then "Closed" (FR9: no stale listings).
// Missing/empty closingDate is treated as Closed so legacy data can't look open.
export function getListingStatus(listing) {
  if (!listing?.closingDate) return "Closed";
  return listing.closingDate < todayISO() ? "Closed" : "Open";
}

/* ---------------- applicants ---------------- */

function readApplicants() {
  return readJSON(STORAGE_KEYS.APPLICANTS);
}

// Only applicants of listings this provider owns.
export function getApplicants() {
  const ownedIds = new Set(getListings().map((l) => l.id));
  return readApplicants()
    .filter((a) => ownedIds.has(a.listingId))
    .map((a) => ({ ...a, documents: a.documents || {}, statusLog: a.statusLog || [] }));
}

export function getApplicantsForListing(listingId) {
  return getApplicants().filter((a) => a.listingId === listingId);
}

export function getApplicantById(id) {
  return getApplicants().find((a) => a.id === id);
}

// This is the ONE status field the student dashboard also reads.
export function updateApplicantStatus(id, status) {
  if (!APPLICATION_STATUSES.includes(status)) {
    throw new Error("Choose a valid status.");
  }

  const ownedIds = new Set(getListings().map((l) => l.id));
  const all = readApplicants();
  const applicant = all.find((a) => a.id === id && ownedIds.has(a.listingId));
  if (!applicant) throw new Error("Applicant not found.");

  if (applicant.status === status) return applicant; // nothing changed, nothing to log

  // NFR5: log who changed it and when
  applicant.statusLog = [
    ...(applicant.statusLog || []),
    {
      from: applicant.status,
      to: status,
      at: new Date().toISOString(),
      byId: CURRENT_PROVIDER.id,
      by: CURRENT_PROVIDER.name,
    },
  ];
  applicant.status = status;
  applicant.statusUpdatedDate = todayISO();

  writeJSON(STORAGE_KEYS.APPLICANTS, all);
  return applicant;
}

export function statusBadgeClass(status) {
  const map = {
    Submitted: "sp-status-submitted",
    "Under Review": "sp-status-review",
    "Outcome Received": "sp-status-outcome",
  };
  return map[status] || "sp-status-submitted";
}


if (typeof window !== "undefined" && window.localStorage) {
  try {
    seedData();
  } catch (err) {
    // A seeding failure shouldn't stop the app from loading.
    // eslint-disable-next-line no-console
    console.warn("Scout: could not seed demo data", err);
  }
}