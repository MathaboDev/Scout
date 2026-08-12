// Thin fetch wrapper around the Django REST backend.
//
// Base URL comes from VITE_API_BASE_URL (see .env.example). Endpoint paths
// below match the "accounts" app the backend team is building
// (register / login / profile / document upload). Rename them here in one
// place once the real Django urls.py is finalised, nothing else in the
// app should need to change.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const ENDPOINTS = {
  register: "/api/accounts/register/",
  login: "/api/accounts/login/",
  logout: "/api/accounts/logout/",
 // profile: "/api/accounts/profile/",
  documents: "/api/documents/upload/",
};

function getToken() {
  return localStorage.getItem("scout_token");
}

async function request(path, { method = "GET", body, isFormData = false, auth = true } = {}) {
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (auth && token) headers["Authorization"] = `Token ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // empty response body, that's fine
  }

  if (!res.ok) {
    const message =
      (data && (data.detail || data.message || data.error || firstFieldError(data))) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

function firstFieldError(data) {
  if (!data || typeof data !== "object") return null;
  const key = Object.keys(data)[0];
  const val = data[key];
  return Array.isArray(val) ? `${key}: ${val[0]}` : null;
}

export const api = {
  register(payload) {
    // payload: { full_name, email, password, confirm_password }
    return request(ENDPOINTS.register, { method: "POST", body: payload, auth: false });
  },
  login(payload) {
    // payload: { email, password } -> expects { token, user }
    return request(ENDPOINTS.login, { method: "POST", body: payload, auth: false });
  },
  logout() {
    return request(ENDPOINTS.logout, { method: "POST" });
  },
  getProfile() {
    return request(ENDPOINTS.profile, { method: "GET" });
  },
  updateProfile(profile) {
    const payload = {
      studenttype: profile.studenttype,
      institution: profile.institution,
      fieldofstudy: profile.fieldofstudy,
      academicaverage: profile.academicaverage === "" ? null : Number(profile.academicaverage),
      opportunitypreference: profile.opportunitypreference,
      province: profile.province || null,
      yearlevel:
        profile.studenttype === "Tertiary Student" && profile.yearlevel !== ""
          ? Number(profile.yearlevel)
          : null,
      graduatetype:
        profile.studenttype === "Graduate" ? profile.graduatetype || null : null,
      qualification:
        profile.studenttype === "Graduate" ? profile.qualification || null : null,
    };

    return request(ENDPOINTS.profile, { method: "PATCH", body: payload });
  },
  uploadDocument(kind, file) {
    // kind: "cv" | "matric_certificate" | "supporting_document"
    const form = new FormData();
    form.append("document_type", kind);
    form.append("file", file);
    return request(ENDPOINTS.documents, { method: "POST", body: form, isFormData: true });
  },
};

export { getToken };
