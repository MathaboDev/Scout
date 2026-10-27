import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ProviderLayout from "../components/ProviderLayout";
import StatusBadge from "../components/StatusBadge";
import { getApplicantById, getListingById, updateApplicantStatus } from "../data/dataService";
import { APPLICATION_STATUSES, DOCUMENT_TYPES } from "../data/constants";

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}

export default function ApplicantDetails() {
  const { id } = useParams();
  const [applicant, setApplicant] = useState(null);
  const [listing, setListing] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    // undefined if the applicant doesn't exist OR belongs to another provider's listing
    const found = getApplicantById(id) || null;
    setApplicant(found);
    setSelectedStatus(found ? found.status : "");
    setListing(found ? getListingById(found.listingId) || null : null);
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleUpdateStatus = () => {
    try {
      updateApplicantStatus(applicant.id, selectedStatus);
      // re-read so the status history includes the new entry
      setApplicant(getApplicantById(applicant.id));
      setToast(`Status updated to "${selectedStatus}"`);
    } catch (err) {
      setToast(err.message || "Could not update the status. Please try again.");
    }
  };

  if (!applicant) {
    return (
      <ProviderLayout>
        <Link className="sp-back-link" to="/dashboard">
          <i className="ti ti-arrow-left"></i> Back to dashboard
        </Link>
        <div className="sp-empty-state">Applicant not found.</div>
      </ProviderLayout>
    );
  }

  const history = [...applicant.statusLog].reverse(); // newest first

  return (
    <ProviderLayout>
      <Link className="sp-back-link" to={`/view-applicants/${applicant.listingId}`}>
        <i className="ti ti-arrow-left"></i> Back to applicants
      </Link>

      <div className="sp-main-head">
        <div>
          <h1>{applicant.studentName}</h1>
          <p>
            Applied for {listing ? listing.title : "a listing"} · {applicant.appliedDate}
          </p>
        </div>
        <StatusBadge status={applicant.status} />
      </div>

      <div className="sp-card">
        <h3>Applicant details</h3>
        <div className="sp-kv">
          <div>
            <div className="sp-k">Full name</div>
            <div className="sp-v">{applicant.studentName}</div>
          </div>
          <div>
            <div className="sp-k">Email</div>
            <div className="sp-v">{applicant.studentEmail}</div>
          </div>
          <div>
            <div className="sp-k">Institution</div>
            <div className="sp-v">{applicant.institution}</div>
          </div>
          <div>
            <div className="sp-k">Field of study</div>
            <div className="sp-v">{applicant.fieldOfStudy}</div>
          </div>
          <div>
            <div className="sp-k">Current year</div>
            <div className="sp-v">{applicant.year}</div>
          </div>
          <div>
            <div className="sp-k">Applied on</div>
            <div className="sp-v">{applicant.appliedDate}</div>
          </div>
        </div>
      </div>

      <div className="sp-card">
        <h3>Documents</h3>
        {DOCUMENT_TYPES.map((doc) => {
          const attached = Boolean(applicant.documents[doc.key]);
          return (
            <div className="sp-doc-row" key={doc.key}>
              <div className="sp-dname">
                <i className="ti ti-file-text"></i>
                {doc.label}
              </div>
              <div className={attached ? "sp-status-ok" : "sp-status-warn"}>
                {attached ? "Attached ✓" : "Not attached"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sp-card">
        <h3>Update status</h3>
        <p style={{ color: "var(--muted)", fontSize: 12.5, marginBottom: 16 }}>
          Students see this change on their tracking page.
        </p>
        <div className="sp-status-update-bar">
          <select
            aria-label="Application status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            className="sp-btn sp-btn-dark"
            onClick={handleUpdateStatus}
            disabled={selectedStatus === applicant.status}
          >
            <i className="ti ti-check"></i> Update status
          </button>
        </div>
      </div>

      <div className="sp-card">
        <h3>Status history</h3>
        {history.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 12.5 }}>No status changes yet.</p>
        ) : (
          history.map((entry, i) => (
            <div className="sp-doc-row" key={`${entry.at}-${i}`}>
              <div className="sp-dname">
                {entry.from} → {entry.to}
              </div>
              <div className="sp-log-time">
                {entry.by} · {formatDateTime(entry.at)}
              </div>
            </div>
          ))
        )}
      </div>

      {toast && <div className="sp-toast">{toast}</div>}
    </ProviderLayout>
  );
}
