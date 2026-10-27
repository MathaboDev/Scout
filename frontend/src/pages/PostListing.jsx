import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check } from "lucide-react";
import ProviderShell, { Card, ErrorNote, PageHeader } from "../components/ProviderShell.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  ALL_QUALIFICATIONS,
  ELIGIBILITY_TYPES,
  FIELD_OF_STUDY_OPTIONS,
  OPPORTUNITY_TYPES,
  PROVINCE_OPTIONS,
  YEAR_OPTIONS,
  ordinalYear,
} from "../lib/constants.js";

// The fixed listing template (FR10). Every field maps to one opportunity
// column, so eligibility is matched from structured data instead of a
// free-text "requirements" box nobody can match against.

const EMPTY = {
  title: "",
  opportunity_type: "",
  field_of_study: "",
  eligibility_type: "Any",
  minimum_average: "",
  year_level_required: "",
  required_qualification: "",
  province: "",
  closing_date: "",
  description: "",
};

const inputClass =
  "w-full rounded-md border border-black/10 bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink";

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// <input type="date"> gives "2026-11-30"; the API needs a full datetime.
// Listings close at 23:59 South African time on the chosen day.
function toClosingDateTime(dateString) {
  return dateString ? `${dateString}T23:59:00+02:00` : null;
}

function toPayload(form) {
  const blankToNull = (v) => (v === "" ? null : v);
  return {
    title: form.title.trim(),
    opportunity_type: form.opportunity_type,
    field_of_study: form.field_of_study,
    eligibility_type: form.eligibility_type,
    minimum_average: form.minimum_average === "" ? null : Number(form.minimum_average),
    year_level_required:
      form.eligibility_type === "Graduate" || form.year_level_required === ""
        ? null
        : Number(form.year_level_required),
    required_qualification:
      form.eligibility_type === "Tertiary Student" ? null : blankToNull(form.required_qualification),
    province: blankToNull(form.province),
    closing_date: toClosingDateTime(form.closing_date),
    description: form.description.trim(),
  };
}

function fromListing(l) {
  return {
    title: l.title,
    opportunity_type: l.opportunity_type,
    field_of_study: l.field_of_study,
    eligibility_type: l.eligibility_type,
    minimum_average: l.minimum_average ?? "",
    year_level_required: l.year_level_required ?? "",
    required_qualification: l.required_qualification ?? "",
    province: l.province ?? "",
    closing_date: l.closing_date ? new Date(l.closing_date).toLocaleDateString("en-CA") : "",
    description: l.description,
  };
}

function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export default function PostListing() {
  const { listingId } = useParams();
  const isEdit = Boolean(listingId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    api
      .getListing(listingId)
      .then((l) => setForm(fromListing(l)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isEdit, listingId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = toPayload(form);
      if (isEdit) await api.updateListing(listingId, payload);
      else await api.createListing(payload);
      navigate("/provider/dashboard", {
        state: {
          flash: isEdit
            ? "Listing updated. It goes live again once a Scout admin re-verifies it."
            : "Listing posted. It goes live once a Scout admin verifies it.",
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const showYear = form.eligibility_type !== "Graduate";
  const showQualification = form.eligibility_type !== "Tertiary Student";

  return (
    <ProviderShell>
      <PageHeader
        title={isEdit ? "Edit listing" : "Post a listing"}
        subtitle="Students are matched against these requirements automatically. Leave an optional requirement blank for no restriction."
      />

      {loading ? (
        <p className="text-sm text-muted">Loading listing...</p>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-3xl">
          <ErrorNote>{error}</ErrorNote>

          <Card className="space-y-5 sm:p-8">
            <h2 className="text-lg font-medium tracking-tight">The opportunity</h2>
            <Field label="Title">
              <input
                className={inputClass}
                value={form.title}
                onChange={set("title")}
                placeholder="e.g. Software developer intern"
                maxLength={150}
                required
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Opportunity type">
                <select className={inputClass} value={form.opportunity_type} onChange={set("opportunity_type")} required>
                  <option value="" disabled>Select type</option>
                  {OPPORTUNITY_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Company">
                <input className={`${inputClass} cursor-not-allowed bg-gray-bg text-muted`} value={user?.company_name || ""} readOnly />
              </Field>
            </div>

            <Field label="Description" hint="What will the student be doing day to day?">
              <textarea
                className={`${inputClass} resize-y`}
                rows={5}
                value={form.description}
                onChange={set("description")}
                required
              />
            </Field>

            <Field label="Closing date" hint="Applications close at 23:59 on this day.">
              <input
                type="date"
                className={inputClass}
                min={todayPlus(1)}
                value={form.closing_date}
                onChange={set("closing_date")}
                required
              />
            </Field>
          </Card>

          <Card className="mt-5 space-y-5 sm:p-8">
            <div>
              <h2 className="text-lg font-medium tracking-tight">Who can apply</h2>
              <p className="mt-1 text-xs text-muted">
                These are matched against each student's profile to build their eligible feed.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Field of study">
                <select className={inputClass} value={form.field_of_study} onChange={set("field_of_study")} required>
                  <option value="" disabled>Select field</option>
                  {FIELD_OF_STUDY_OPTIONS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Open to">
                <select className={inputClass} value={form.eligibility_type} onChange={set("eligibility_type")} required>
                  {ELIGIBILITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Minimum academic average (optional)">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  className={inputClass}
                  value={form.minimum_average}
                  onChange={set("minimum_average")}
                  placeholder="e.g. 65"
                />
              </Field>
              <Field label="Province (optional)">
                <select className={inputClass} value={form.province} onChange={set("province")}>
                  <option value="">Nationwide</option>
                  {PROVINCE_OPTIONS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
              {showYear && (
                <Field label="Minimum year of study (optional)" hint="Tertiary students only.">
                  <select className={inputClass} value={form.year_level_required} onChange={set("year_level_required")}>
                    <option value="">Any year</option>
                    {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{ordinalYear(y)} or later</option>)}
                  </select>
                </Field>
              )}
              {showQualification && (
                <Field label="Required qualification (optional)" hint="Graduates only.">
                  <select
                    className={inputClass}
                    value={form.required_qualification}
                    onChange={set("required_qualification")}
                  >
                    <option value="">Any qualification</option>
                    {ALL_QUALIFICATIONS.map((q) => <option key={q}>{q}</option>)}
                  </select>
                </Field>
              )}
            </div>
          </Card>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Link
              to="/provider/dashboard"
              className="rounded-xl2 border border-line px-5 py-2.5 text-sm font-semibold hover:bg-gray-bg"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-white hover:bg-ink-soft disabled:opacity-60"
            >
              <Check size={16} /> {saving ? "Saving..." : isEdit ? "Save changes" : "Post listing"}
            </button>
          </div>
        </form>
      )}
    </ProviderShell>
  );
}
