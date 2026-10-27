// The ONLY place the frontend talks to the backend.
// Every path here matches a route in backend/*/urls.py under /api/.

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

// Documents endpoints belong to the existing documents app.
// If your documents/urls.py uses different paths, change ONLY these two.
const DOCUMENTS_BASE = "/api/documents/";
const DOCUMENTS_UPLOAD = "/api/documents/upload/";

const AUTH_KEY = "scout_auth";

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.code = data?.code;
  }
}

export function getStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch {
    return null;
  }
}

export function setStoredAuth(value) {
  if (value) localStorage.setItem(AUTH_KEY, JSON.stringify(value));
  else localStorage.removeItem(AUTH_KEY);
}

// Turns any DRF error shape into one plain sentence (NFR3).
function errorMessage(data, status) {
  if (data) {
    if (typeof data.error === "string") return data.error;
    if (typeof data.detail === "string") return data.detail;
    const [field, messages] = Object.entries(data)[0] || [];
    if (field) {
      const text = Array.isArray(messages) ? messages[0] : messages;
      const label = field.replace(/_/g, " ");
      return field === "non_field_errors" ? String(text) : `${label}: ${text}`;
    }
  }
  if (status >= 500) return "Something went wrong on our side. Please try again.";
  return "That request didn't work. Please try again.";
}

// asBlob: return the raw file (e.g. a PDF) instead of parsing JSON.
async function request(path, { method = "GET", body, form, asBlob = false } = {}) {
  const headers = {};
  const auth = getStoredAuth();
  if (auth?.token) headers.Authorization = `Token ${auth.token}`;

  let payload;
  if (form) {
    payload = form; // browser sets the multipart boundary itself
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError("Can't reach the Scout server. Check that the backend is running.", 0);
  }

  if (asBlob && response.ok) return response.blob();

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && auth?.token) {
      setStoredAuth(null);
      window.dispatchEvent(new Event("scout:unauthorized"));
    }
    throw new ApiError(errorMessage(data, response.status), response.status, data);
  }
  return data;
}

// Profile form state -> exact wire format the serializer expects.
export function toProfilePayload(p) {
  const isTertiary = p.studenttype === "Tertiary Student";
  return {
    student_type: p.studenttype,
    institution: p.institution?.trim(),
    field_of_study: p.fieldofstudy,
    academic_average: p.academicaverage === "" ? null : Number(p.academicaverage),
    opportunity_preference: p.opportunitypreference,
    province: p.province,
    year_level: isTertiary && p.yearlevel !== "" ? Number(p.yearlevel) : null,
    graduate_type: isTertiary ? null : p.graduatetype || null,
    qualification: isTertiary ? null : p.qualification || null,
  };
}

export const api = {
  // ---------- accounts (FR1) ----------
  register: (form) => request("/api/accounts/register/", { method: "POST", body: form }),
  login: ({ email, password }) =>
    request("/api/accounts/login/", { method: "POST", body: { email, password } }),
  logout: () => request("/api/accounts/logout/", { method: "POST" }),
  me: () => request("/api/accounts/me/"),
  getProfile: () => request("/api/accounts/profile/"),
  updateProfile: (profileState) =>
    request("/api/accounts/profile/", { method: "PATCH", body: toProfilePayload(profileState) }),

  // ---------- documents (FR1 / FR4) ----------
  getDocuments: () => request(DOCUMENTS_BASE),
  uploadDocument: (documentType, file) => {
    const form = new FormData();
    form.append("document_type", documentType);
    form.append("file", file);
    return request(DOCUMENTS_UPLOAD, { method: "POST", form });
  },

  // ---------- opportunities (FR2) ----------
  listOpportunities: (view = "eligible") =>
    request(`/api/opportunities/?view=${encodeURIComponent(view)}`),
  getOpportunity: (id) => request(`/api/opportunities/${id}/`),

  // ---------- applying (FR3 / FR4) ----------
  reviewApplication: (opportunityId) =>
    request("/api/applications/review/", { method: "POST", body: { opportunity_id: opportunityId } }),
  confirmApplication: (opportunityId) =>
    request("/api/applications/confirm/", { method: "POST", body: { opportunity_id: opportunityId } }),

  // ---------- dashboard (FR5 / FR6) ----------
  myApplications: () => request("/api/applications/mine/"),
  getReceipt: (applicationId) => request(`/api/applications/mine/${applicationId}/receipt/`),
  applicationSummary: () => request("/api/applications/mine/summary/"),
  // FR5: the same summary as a PDF on Scout letterhead (built by the backend)
  applicationSummaryPdf: () => request("/api/applications/mine/summary/pdf/", { asBlob: true }),

  // ---------- bookmarks + notifications (FR7) ----------
  listBookmarks: () => request("/api/applications/bookmarks/"),
  addBookmark: (opportunityId) =>
    request("/api/applications/bookmarks/", { method: "POST", body: { opportunity_id: opportunityId } }),
  removeBookmark: (opportunityId) =>
    request(`/api/applications/bookmarks/${opportunityId}/`, { method: "DELETE" }),
  notifications: () => request("/api/notifications/"),
  markNotificationRead: (id) => request(`/api/notifications/${id}/read/`, { method: "POST" }),
  markAllNotificationsRead: () => request("/api/notifications/read-all/", { method: "POST" }),

  // ---------- provider (FR10) ----------
  providerListings: () => request("/api/opportunities/provider/listings/"),
  getListing: (id) => request(`/api/opportunities/provider/listings/${id}/`),
  createListing: (data) =>
    request("/api/opportunities/provider/listings/", { method: "POST", body: data }),
  updateListing: (id, data) =>
    request(`/api/opportunities/provider/listings/${id}/`, { method: "PATCH", body: data }),
  removeListing: (id) =>
    request(`/api/opportunities/provider/listings/${id}/`, { method: "DELETE" }),
  listingApplicants: (listingId) =>
    request(`/api/applications/provider/listings/${listingId}/applicants/`),
  getApplicant: (applicationId) => request(`/api/applications/provider/applicants/${applicationId}/`),
  updateApplicantStatus: (applicationId, { status, outcome_result }) =>
    request(`/api/applications/provider/applicants/${applicationId}/`, {
      method: "PATCH",
      body: { status, outcome_result: outcome_result || null },
    }),
};
