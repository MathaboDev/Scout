import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import ProviderLayout from "../components/ProviderLayout";
import {
  addListing,
  updateListing,
  getListingById,
  getCurrentProvider,
  todayISO,
} from "../data/dataService";
import { OPPORTUNITY_TYPES, FIELD_OF_STUDY_OPTIONS, YEAR_OPTIONS, ANY } from "../data/constants";

const initialForm = {
  title: "",
  type: "",
  location: "",
  fieldOfStudy: ANY,
  minYear: ANY,
  description: "",
  requirements: "",
  closingDate: "",
};

export default function PostListing() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const provider = getCurrentProvider();

  const [form, setForm] = useState(initialForm);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    const existing = getListingById(id);
    if (!existing) {
      setNotFound(true);
      return;
    }
    setForm({
      title: existing.title || "",
      type: existing.type || "",
      location: existing.location || "",
      fieldOfStudy: existing.fieldOfStudy || ANY,
      minYear: existing.minYear || ANY,
      description: existing.description || "",
      requirements: existing.requirements || "",
      closingDate: existing.closingDate || "",
    });
  }, [id, isEdit]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Enter a title for the listing.");
      return;
    }
    if (!isEdit && form.closingDate < todayISO()) {
      setError("The closing date can't be in the past. Pick today or a later date.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit) updateListing(id, form);
      else addListing(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Could not save the listing. Please try again.");
      setSaving(false);
    }
  };

  if (notFound) {
    return (
      <ProviderLayout>
        <Link className="sp-back-link" to="/dashboard">
          <i className="ti ti-arrow-left"></i> Back to dashboard
        </Link>
        <div className="sp-empty-state">Listing not found. It may have been removed.</div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout active={isEdit ? undefined : "post-listing"}>
      <div className="sp-main-head">
        <div>
          <h1>{isEdit ? "Edit listing" : "Post a listing"}</h1>
          <p>Fill in the template below — students will see this exact layout when they apply.</p>
        </div>
      </div>

      <form className="sp-card" onSubmit={handleSubmit}>
        {error && (
          <div className="sp-alert" role="alert">
            {error}
          </div>
        )}

        <div className="sp-form-group">
          <label htmlFor="pl-title">Job / opportunity title</label>
          <input
            id="pl-title"
            type="text"
            placeholder="e.g. Software developer intern"
            value={form.title}
            onChange={handleChange("title")}
            required
          />
        </div>

        <div className="sp-row2">
          <div className="sp-form-group">
            <label htmlFor="pl-type">Opportunity type</label>
            <select id="pl-type" value={form.type} onChange={handleChange("type")} required>
              <option value="">Select type</option>
              {OPPORTUNITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="sp-form-group">
            <label htmlFor="pl-location">Location</label>
            <input
              id="pl-location"
              type="text"
              placeholder="e.g. Remote, South Africa"
              value={form.location}
              onChange={handleChange("location")}
              required
            />
          </div>
        </div>

        <div className="sp-row2">
          <div className="sp-form-group">
            <label htmlFor="pl-field">Field of study</label>
            <select id="pl-field" value={form.fieldOfStudy} onChange={handleChange("fieldOfStudy")}>
              <option value={ANY}>Any field</option>
              {FIELD_OF_STUDY_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <div className="sp-hint">
              Matched against student profiles to decide who sees this listing.
            </div>
          </div>
          <div className="sp-form-group">
            <label htmlFor="pl-year">Minimum year of study</label>
            <select id="pl-year" value={form.minYear} onChange={handleChange("minYear")}>
              <option value={ANY}>Any year</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={String(y)}>
                  Year {y} and above
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="sp-form-group">
          <label htmlFor="pl-description">Description</label>
          <textarea
            id="pl-description"
            placeholder="What will the student be doing day to day?"
            value={form.description}
            onChange={handleChange("description")}
            required
          />
        </div>

        <div className="sp-form-group">
          <label htmlFor="pl-requirements">Other requirements (optional)</label>
          <textarea
            id="pl-requirements"
            placeholder="Skills, tools, anything else students should know."
            value={form.requirements}
            onChange={handleChange("requirements")}
          />
          <div className="sp-hint">Shown to students, but not used for eligibility matching.</div>
        </div>

        <div className="sp-row2">
          <div className="sp-form-group">
            <label htmlFor="pl-closing">Closing date</label>
            <input
              id="pl-closing"
              type="date"
              min={isEdit ? undefined : todayISO()}
              value={form.closingDate}
              onChange={handleChange("closingDate")}
              required
            />
          </div>
          <div className="sp-form-group">
            <label htmlFor="pl-company">Company (auto-filled)</label>
            <input id="pl-company" type="text" value={provider.name} readOnly />
          </div>
        </div>

        <div className="sp-form-actions">
          <Link className="sp-btn sp-btn-outline" to="/dashboard">
            Cancel
          </Link>
          <button type="submit" className="sp-btn sp-btn-lime" disabled={saving}>
            <i className="ti ti-check"></i>{" "}
            {saving ? "Saving..." : isEdit ? "Save changes" : "Post listing"}
          </button>
        </div>
      </form>
    </ProviderLayout>
  );
}

