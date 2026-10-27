import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatusBadge from "../components/StatusBadge";
import {
  seedData,
  getListingById,
  getApplicantsForListing,
  getApplicantById,
  updateApplicantStatus,
} from "../api/dataService.js";

const STATUS_OPTIONS = [
  "Submitted",
  "Under review",
  "Interview",
  "Accepted",
  "Rejected",
];

export default function ApplicantDetails() {
  const { listingId, id } = useParams();

  const [listing, setListing] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [applicant, setApplicant] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    seedData();

    const foundListing = getListingById(listingId);
    setListing(foundListing || null);

    if (id) {
      const found = getApplicantById(id);
      if (found && found.listingId === listingId) {
        setApplicant(found);
        setSelectedStatus(found.status);
      } else {
        setApplicant(null);
      }
      setApplicants([]);
    } else {
      setApplicant(null);
      setApplicants(getApplicantsForListing(listingId));
    }
  }, [listingId, id]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleUpdateStatus = () => {
    if (!applicant) return;
    const updated = updateApplicantStatus(applicant.id, selectedStatus);
    if (updated) {
      setApplicant(updated);
      setToast(`Status updated to "${selectedStatus}"`);
    }
  };

  
  const LayoutWrapper = ({ children }) => (
    <div className="flex h-screen w-full bg-cream overflow-hidden font-sans">
      <Sidebar active="dashboard" />
      <main className="flex-1 h-full overflow-y-auto p-6 lg:p-10">
        {children}
      </main>
    </div>
  );

  if (!listing) {
    return (
      <LayoutWrapper>
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink" to="/dashboard">
          <i className="ti ti-arrow-left" /> Back to dashboard
        </Link>
        <div className="rounded-xl2 border border-line bg-white p-8 text-center text-muted shadow-sm">
          <i className="ti ti-briefcase-off text-4xl mb-3 text-line" />
          <h2 className="text-lg font-semibold text-ink">Listing not found.</h2>
        </div>
      </LayoutWrapper>
    );
  }

  /* ==========================================
     VIEW 1: LIST OF APPLICANTS
     ========================================== */
  if (!id) {
    return (
      <LayoutWrapper>
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink" to="/dashboard">
          <i className="ti ti-arrow-left" /> Back to dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Applicants</h1>
          <p className="mt-1 text-sm text-muted">{listing.title} · {listing.company}</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl2 border border-line bg-white p-6 shadow-sm">
            <div className="text-3xl font-bold text-ink">{applicants.length}</div>
            <div className="mt-1 text-sm font-medium text-muted">Total applicants</div>
          </div>
        </div>

        <h3 className="mb-4 text-lg font-semibold text-ink">Applicant list</h3>

        {applicants.length === 0 ? (
          <div className="rounded-xl2 border border-line bg-white p-8 text-center text-muted shadow-sm">
            No students have applied for this listing yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {applicants.map((item) => (
              <div key={item.id} className="flex flex-col justify-between rounded-xl2 border border-line bg-white p-6 shadow-sm">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-bold text-ink">{item.studentName}</div>
                      <div className="mt-1 text-sm text-muted">{item.studentEmail}</div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <div className="mt-4 text-sm text-muted">
                    {item.institution} · {item.fieldOfStudy}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {item.year} · Applied {item.appliedDate}
                  </div>
                </div>

                <div className="mt-6">
           
                  <Link
                    className="flex w-full items-center justify-center gap-2 rounded-xl2 bg-ink py-2.5 text-sm font-semibold text-white transition hover:bg-ink-soft"
                    to={`/applicantdetails/${listingId}/${item.id}`}
                  >
                    <i className="ti ti-user" /> View details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </LayoutWrapper>
    );
  }

  /* ==========================================
     VIEW 2: SINGLE APPLICANT DETAILS
     ========================================== */
  if (!applicant) {
    return (
      <LayoutWrapper>
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink" to={`/view-applicants/${listingId}`}>
          <i className="ti ti-arrow-left" /> Back to applicants
        </Link>
        <div className="rounded-xl2 border border-line bg-white p-8 text-center text-muted shadow-sm">
          <i className="ti ti-user-x text-4xl mb-3 text-line" />
          <h2 className="text-lg font-semibold text-ink">Applicant not found for this listing.</h2>
        </div>
      </LayoutWrapper>
    );
  }

  const documents = applicant.documents || {};
  const details = [
    ["Full name", applicant.studentName],
    ["Email", applicant.studentEmail],
    ["Institution", applicant.institution],
    ["Field of study", applicant.fieldOfStudy],
    ["Current year", applicant.year],
    ["Applied on", applicant.appliedDate],
  ];
  const documentList = [
    ["CV / résumé", documents.cv],
    ["Academic transcript", documents.transcript],
    ["ID document", documents.idDoc],
  ];

  return (
    <LayoutWrapper>
      <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink" to={`/view-applicants/${listingId}`}>
        <i className="ti ti-arrow-left" /> Back to applicants
      </Link>

      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{applicant.studentName}</h1>
          <p className="mt-1 text-sm text-muted">Applied for {listing.title} · {applicant.appliedDate}</p>
        </div>
        <StatusBadge status={applicant.status} />
      </div>

      <div className="space-y-6 max-w-5xl">
        {/* DETAILS CARD */}
        <div className="rounded-xl2 border border-line bg-white p-6 shadow-sm sm:p-8">
          <h3 className="mb-6 border-b border-line pb-4 text-lg font-semibold text-ink">Applicant details</h3>
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {details.map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{label}</div>
                <div className="text-sm font-medium text-ink">{value || "Not provided"}</div>
              </div>
            ))}
          </div>
        </div>

        {/* DOCUMENTS CARD */}
        <div className="rounded-xl2 border border-line bg-white p-6 shadow-sm sm:p-8">
          <h3 className="mb-4 text-lg font-semibold text-ink">Documents</h3>
          <div className="divide-y divide-line">
            {documentList.map(([name, attached]) => (
              <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0" key={name}>
                <div className="flex items-center gap-3 text-sm font-medium text-ink">
                  <i className="ti ti-file-text text-lg text-muted" /> {name}
                </div>
                <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                  attached ? "bg-green-bg text-green" : "bg-amber-bg text-amber"
                }`}>
                  <i className={attached ? "ti ti-check" : "ti ti-alert-circle"} />
                  {attached ? "Attached" : "Not attached"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* UPDATE STATUS CARD */}
        <div className="rounded-xl2 border border-line bg-white p-6 shadow-sm sm:p-8">
          <h3 className="mb-2 text-lg font-semibold text-ink">Update application status</h3>
          <p className="mb-6 text-sm text-muted">Choose a status and save your change.</p>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl2 border border-line bg-cream px-4 py-2.5 text-sm font-medium text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink sm:max-w-xs"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl2 bg-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-soft"
              onClick={handleUpdateStatus}
            >
              <i className="ti ti-check" /> Update status
            </button>
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl2 bg-ink px-5 py-3.5 text-sm font-medium text-white shadow-lg animate-rise">
          <i className="ti ti-circle-check text-lg text-lime" />
          {toast}
        </div>
      )}
    </LayoutWrapper>
  );
}
