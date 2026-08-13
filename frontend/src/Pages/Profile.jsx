import { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  UploadCloud,
  Pencil,
  Save,
} from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import FormField from "../components/FormField.jsx";
import Button from "../components/Button.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const FIELD_OF_STUDY_OPTIONS = [
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

const PROVINCE_OPTIONS = [
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

const YEAR_OPTIONS = [1, 2, 3, 4, 5, 6];
const PREFERENCE_OPTIONS = ["Internship", "Learnership", "Graduate programme"];
const STUDENT_TYPE_OPTIONS = ["Tertiary Student", "Graduate"];
const GRADUATE_TYPE_OPTIONS = ["Undergraduate", "Postgraduate"];

const QUALIFICATION_OPTIONS = {
  Undergraduate: ["Higher Certificate", "Diploma", "Bachelor"],
  Postgraduate: ["Honours", "Masters", "Doctorate"],
};

const REQUIRED_DOCUMENTS = [
  { key: "cv", label: "CV" },
  { key: "matric_certificate", label: "Matric certificate" },
];

const EMPTY_PROFILE = {
  studenttype: "",
  institution: "",
  qualification: "",
  fieldofstudy: "",
  yearlevel: "",
  academicaverage: "",
  opportunitypreference: "",
  province: "",
  graduatetype: "",
};

function normalizeProfile(data) {
  const source = data?.profile || data?.academic || data || {};
  return {
    ...EMPTY_PROFILE,
    studenttype: source.studenttype ?? source.student_type ?? "",
    institution: source.institution ?? "",
    qualification: source.qualification ?? "",
    fieldofstudy: source.fieldofstudy ?? source.field_of_study ?? "",
    yearlevel: source.yearlevel ?? source.year_level ?? "",
    academicaverage: source.academicaverage ?? source.academic_average ?? "",
    opportunitypreference: source.opportunitypreference ?? source.opportunity_preference ?? "",
    province: source.province ?? "",
    graduatetype: source.graduatetype ?? source.graduate_type ?? "",
  };
}

function normalizeDocuments(data) {
  const raw = data?.documents || {};
  const result = { cv: null, matric_certificate: null, supporting_documents: [] };

  if (Array.isArray(raw)) {
    raw.forEach((doc) => {
      const key = doc.documenttype || doc.document_type || "supporting_document";
      const item = {
        status: "uploaded",
        filename: doc.filename || doc.file_name || "Uploaded document",
        id: doc.documentid || doc.document_id,
      };
      if (key === "cv" || key === "matric_certificate") result[key] = item;
      else result.supporting_documents.push(item);
    });
    return result;
  }

  result.cv = raw.cv || raw.cv_document || null;
  result.matric_certificate = raw.matric_certificate || null;
  result.supporting_documents = Array.isArray(raw.supporting_documents)
    ? raw.supporting_documents
    : [];
  return result;
}

function getRequiredFieldKeys(profile) {
  const shared = [
    "studenttype",
    "institution",
    "fieldofstudy",
    "academicaverage",
    "opportunitypreference",
    "province",
  ];

  if (profile.studenttype === "Tertiary Student") {
    return [...shared, "yearlevel"];
  }

  if (profile.studenttype === "Graduate") {
    return [...shared, "graduatetype", "qualification"];
  }

  return shared;
}

function computeCompletion(profile, documents) {
  const fields = getRequiredFieldKeys(profile);
  const filledFields = fields.filter((key) => String(profile[key] ?? "").trim()).length;
  const requiredDocs = REQUIRED_DOCUMENTS.filter(
    (doc) => documents[doc.key]?.status === "uploaded"
  ).length;
  const total = fields.length + REQUIRED_DOCUMENTS.length;
  return total ? Math.round(((filledFields + requiredDocs) / total) * 100) : 0;
}

export default function Profile() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [documents, setDocuments] = useState({ cv: null, matric_certificate: null, supporting_documents: [] });

    useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [profileData, documentsData] = await Promise.all([
          api.getProfile(),
          api.getDocuments(),
        ]);
        if (cancelled) return;
        setProfile(normalizeProfile(profileData));
        setDocuments(normalizeDocuments({ documents: documentsData }));
      } catch {
        if (!cancelled) setEditing(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const completion = computeCompletion(profile, documents);
  const summaryQualification =
    profile.studenttype === "Tertiary Student"
      ? "Tertiary Student"
      : profile.qualification || "Add your qualification below";
  //const fullName = user?.full_name || user?.name || "Your profile";
  const fullName = user
  ? [user.first_name, user.last_name].filter(Boolean).join(" ") || "Your profile"
  : "Your profile";
  const email = user?.email || "";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function update(key, value) {
    setProfile((current) => {
      const next = { ...current, [key]: value };

      if (key === "studenttype" && value === "Tertiary Student") {
        next.graduatetype = "";
        next.qualification = "";
      }

      if (key === "studenttype" && value === "Graduate") {
        next.yearlevel = "";
      }

      if (key === "graduatetype") {
        next.qualification = "";
      }

      return next;
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      await api.updateProfile(profile);
      setEditing(false);
      setNotice({ type: "ok", text: "Profile saved." });
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Could not save your profile." });
    } finally {
      setSaving(false);
    }
  }

  async function handleFileChange(kind, file) {
    if (!file) return;

    if (kind === "supporting_document") {
      setDocuments((current) => ({
        ...current,
        supporting_documents: [
          ...current.supporting_documents,
          { status: "uploading", filename: file.name },
        ],
      }));
    } else {
      setDocuments((current) => ({
        ...current,
        [kind]: { status: "uploading", filename: file.name },
      }));
    }

    try {
      const data = await api.uploadDocument(kind, file);
      const uploaded = {
        status: "uploaded",
        filename: data?.filename || data?.file_name || file.name,
        id: data?.documentid || data?.document_id,
      };

      if (kind === "supporting_document") {
        setDocuments((current) => ({
          ...current,
          supporting_documents: current.supporting_documents.map((item, index, items) =>
            index === items.length - 1 ? uploaded : item
          ),
        }));
      } else {
        setDocuments((current) => ({ ...current, [kind]: uploaded }));
      }
    } catch (err) {
      if (kind === "supporting_document") {
        setDocuments((current) => ({
          ...current,
          supporting_documents: current.supporting_documents.map((item, index, items) =>
            index === items.length - 1
              ? { status: "failed", filename: file.name, error: err.message }
              : item
          ),
        }));
      } else {
        setDocuments((current) => ({
          ...current,
          [kind]: { status: "failed", filename: file.name, error: err.message },
        }));
      }
    }
  }

  return (
    <AppShell
      title="Profile"
      subtitle="Keep your professional information up to date so Scout can use it when matching opportunities."
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl2 border border-line bg-white px-6 py-5">
        <div className="flex items-center gap-3.5">
          <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-lime text-lg font-bold text-ink">
            {initials || "SC"}
          </span>
          <div>
            <p className="font-bold">{fullName}</p>
            <p className="text-[12.5px] text-muted">
              {summaryQualification}
              {profile.institution ? ` · ${profile.institution}` : ""}
            </p>
            {email && <p className="mt-0.5 text-[12px] text-muted">{email}</p>}
          </div>
        </div>
        <div className="w-full max-w-[220px] sm:w-[220px]">
          <p className="mb-1.5 text-right text-xs font-bold">Profile completion: {completion}%</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-bg">
            <div
              className="h-full rounded-full bg-lime transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>

      {notice && (
        <div
          className={`mb-5 rounded-xl2 border px-5 py-3 text-sm font-medium ${
            notice.type === "ok"
              ? "border-green-bg bg-green-bg text-[#3F7A33]"
              : "border-amber-bg bg-amber-bg text-[#966B1F]"
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="mb-5 rounded-xl2 border border-line bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold">Contact details</h3>
            <p className="mt-1 text-xs text-muted">Your account details are managed through registration.</p>
          </div>
        </div>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <FormField label="Full name" value={fullName} disabled />
          <FormField label="Email address" type="email" value={email} disabled />
        </div>
      </div>

      <form onSubmit={handleSave} className="mb-5 rounded-xl2 border border-line bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold">Professional profile</h3>
            <p className="mt-1 text-xs text-muted">These details are used to determine eligible opportunities.</p>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-lime-ink hover:underline"
            >
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <FormField
                as="select"
                label="Student type"
                value={profile.studenttype}
                onChange={(e) => update("studenttype", e.target.value)}
                required
              >
                <option value="" disabled>Select your student type</option>
                {STUDENT_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </FormField>

              <FormField
                label="Institution"
                placeholder="Enter institution name"
                value={profile.institution}
                onChange={(e) => update("institution", e.target.value)}
                required
              />

              <FormField
                as="select"
                label="Field of study"
                value={profile.fieldofstudy}
                onChange={(e) => update("fieldofstudy", e.target.value)}
                required
              >
                <option value="" disabled>Select a field of study</option>
                {FIELD_OF_STUDY_OPTIONS.map((field) => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </FormField>

              <FormField
                as="select"
                label="Province (optional)"
                value={profile.province}
                onChange={(e) => update("province", e.target.value)}
              >
                <option value="">Select a province</option>
                {PROVINCE_OPTIONS.map((province) => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </FormField>

              {profile.studenttype === "Tertiary Student" && (
                <FormField
                  as="select"
                  label="Year of study"
                  value={profile.yearlevel}
                  onChange={(e) => update("yearlevel", e.target.value)}
                  required
                >
                  <option value="" disabled>Select your year</option>
                  {YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>{year}{year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th"} year</option>
                  ))}
                </FormField>
              )}

              {profile.studenttype === "Graduate" && (
                <FormField
                  as="select"
                  label="Graduate type"
                  value={profile.graduatetype}
                  onChange={(e) => update("graduatetype", e.target.value)}
                  required
                >
                  <option value="" disabled>Select graduate type</option>
                  {GRADUATE_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </FormField>
              )}

              {profile.studenttype === "Graduate" && profile.graduatetype && (
                <FormField
                  as="select"
                  label="Qualification"
                  value={profile.qualification}
                  onChange={(e) => update("qualification", e.target.value)}
                  required
                >
                  <option value="" disabled>Select your qualification</option>
                  {QUALIFICATION_OPTIONS[profile.graduatetype].map((qualification) => (
                    <option key={qualification} value={qualification}>{qualification}</option>
                  ))}
                </FormField>
              )}

              <FormField
                label="Academic average"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g. 72"
                value={profile.academicaverage}
                onChange={(e) => update("academicaverage", e.target.value)}
                required
              />

              <FormField
                as="select"
                label="Opportunity preference"
                value={profile.opportunitypreference}
                onChange={(e) => update("opportunitypreference", e.target.value)}
                required
              >
                <option value="" disabled>What are you looking for?</option>
                {PREFERENCE_OPTIONS.map((preference) => (
                  <option key={preference} value={preference}>{preference}</option>
                ))}
              </FormField>
            </div>

            <div className="mt-2 flex gap-3">
              <Button type="submit" variant="dark" disabled={saving}>
                <Save size={15} /> {saving ? "Saving..." : "Save changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <div className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            {[
              ["Student type", profile.studenttype],
              ["Institution", profile.institution],
              ["Field of study", profile.fieldofstudy],
              ["Province", profile.province],
              ["Year of study", profile.studenttype === "Tertiary Student" && profile.yearlevel ? `${profile.yearlevel}${Number(profile.yearlevel) === 1 ? "st" : Number(profile.yearlevel) === 2 ? "nd" : Number(profile.yearlevel) === 3 ? "rd" : "th"} year` : ""],
              ["Graduate type", profile.studenttype === "Graduate" ? profile.graduatetype : ""],
              ["Qualification", profile.studenttype === "Graduate" ? profile.qualification : ""],
              ["Academic average", profile.academicaverage ? `${profile.academicaverage}%` : ""],
              ["Opportunity preference", profile.opportunitypreference],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="mb-0.5 text-[11.5px] font-semibold text-muted">{label}</p>
                <p className="font-semibold">{value || "Not provided"}</p>
              </div>
            ))}
          </div>
        )}
      </form>

      <div className="rounded-xl2 border border-line bg-white p-6">
        <h3 className="mb-1 text-[15px] font-bold">Documents</h3>
        <p className="mb-4 text-xs leading-relaxed text-muted">
          Your CV and matric certificate are required. You can also add optional supporting documents such as a transcript, university certificate or proof of registration.
        </p>

        <div className="space-y-0">
          {REQUIRED_DOCUMENTS.map((doc) => (
            <DocumentRow
              key={doc.key}
              doc={doc}
              state={documents[doc.key]}
              onUpload={(file) => handleFileChange(doc.key, file)}
            />
          ))}

          <div className="border-t border-line pt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Supporting documents</p>
                <p className="mt-0.5 text-xs text-muted">Optional. Upload any relevant supporting file.</p>
              </div>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-lime-ink hover:underline">
                <UploadCloud size={13} /> Upload document
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleFileChange("supporting_document", e.target.files?.[0])}
                />
              </label>
            </div>

            {documents.supporting_documents.length === 0 ? (
              <p className="text-xs text-muted">No supporting documents uploaded.</p>
            ) : (
              documents.supporting_documents.map((state, index) => (
                <div key={`${state.id || state.filename}-${index}`} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <FileText size={16} className="shrink-0 text-muted" />
                    <span className="truncate text-sm font-semibold">{state.filename || "Supporting document"}</span>
                  </div>
                  <DocStatus state={state.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {!loading && (
        <p className="mt-4 text-center text-xs text-muted">
          Your saved profile and documents can be reused when you apply for opportunities.
        </p>
      )}
    </AppShell>
  );
}

function DocumentRow({ doc, state, onUpload }) {
  const inputId = `upload-${doc.key}`;
  const status = state?.status;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3.5 text-sm">
      <div className="flex min-w-0 items-center gap-2.5 font-semibold">
        <FileText size={16} className="shrink-0 text-muted" />
        <span>{doc.label}</span>
      </div>
      <div className="flex items-center gap-3">
        <DocStatus state={status} />
        <input
          id={inputId}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => onUpload(e.target.files?.[0])}
        />
        <label
          htmlFor={inputId}
          className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-lime-ink hover:underline"
        >
          <UploadCloud size={13} />
          {status === "uploaded" ? "Replace" : status === "failed" ? "Retry" : "Upload"}
        </label>
      </div>
    </div>
  );
}

function DocStatus({ state }) {
  if (state === "uploaded") {
    return <span className="flex items-center gap-1 text-xs font-semibold text-green"><CheckCircle2 size={14} /> Uploaded</span>;
  }
  if (state === "uploading") return <span className="text-xs font-semibold text-muted">Uploading...</span>;
  if (state === "failed") {
    return <span className="flex items-center gap-1 text-xs font-semibold text-rust"><XCircle size={14} /> Upload failed</span>;
  }
  return <span className="flex items-center gap-1 text-xs font-semibold text-amber"><AlertTriangle size={14} /> Not uploaded</span>;
}
