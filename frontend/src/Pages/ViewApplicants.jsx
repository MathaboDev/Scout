import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatusBadge from "../components/StatusBadge";
import { getListingById, getApplicantsForListing } from "../data/dataService";

export default function ViewApplicants() {
  const { listingId } = useParams();
  const [listing, setListing] = useState(null);
  const [applicants, setApplicants] = useState([]);

  useEffect(() => {
    setListing(getListingById(listingId));
    setApplicants(getApplicantsForListing(listingId));
  }, [listingId]);

  return (
    <div className="sp-app">
      <Sidebar />

      <div className="sp-main">
        <Link className="sp-back-link" to="/dashboard">
          <i className="ti ti-arrow-left"></i> Back to dashboard
        </Link>

        <div className="sp-main-head">
          <div>
            <h1>{listing ? listing.title : "Listing not found"}</h1>
            <p>
              {listing
                ? `${listing.company} · ${listing.location} — showing applicants for this listing only.`
                : "This listing may have been removed."}
            </p>
          </div>
        </div>

        <div className="sp-card">
          {applicants.length === 0 ? (
            <div className="sp-empty-state">No one has applied to this listing yet.</div>
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-applicants">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Institution</th>
                    <th>Applied</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="sp-name-cell">{a.studentName}</div>
                        <div className="sp-email-cell">{a.studentEmail}</div>
                      </td>
                      <td>
                        {a.institution}
                        <br />
                        <span style={{ color: "var(--muted)", fontSize: 12 }}>
                          {a.fieldOfStudy}, {a.year}
                        </span>
                      </td>
                      <td>{a.appliedDate}</td>
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                      <td>
                        <Link className="sp-btn sp-btn-outline sp-btn-sm" to={`/applicant/${a.id}`}>
                          View details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
