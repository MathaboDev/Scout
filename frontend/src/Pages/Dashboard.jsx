import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  seedData,
  getListings,
  getApplicants,
  getApplicantsForListing,
} from "../api/dataService.js";

export default function Dashboard() {
  const [listings, setListings] = useState([]);
  const [applicants, setApplicants] = useState([]);

  useEffect(() => {
    seedData();
    setListings(getListings());
    setApplicants(getApplicants());
  }, []);

  const activeCount = listings.filter((l) => l.status === "Open").length;
  const pendingCount = applicants.filter((a) => a.status === "Submitted").length;

  return (
    <div className="sp-app">
      <Sidebar active="dashboard" />

      <div className="sp-main">
        <div className="sp-main-head">
          <div>
            <h1>Welcome back, ByteWorks </h1>
            <p>Here's an overview of your listings and applicants.</p>
          </div>
          <Link className="sp-btn sp-btn-lime" to="/post-listing">
            <i className="ti ti-plus"></i> Post a listing
          </Link>
        </div>

        <div className="sp-stat-grid">
          <div className="sp-stat-card">
            <div className="sp-num">{activeCount}</div>
            <div className="sp-label">Active listings</div>
          </div>
          <div className="sp-stat-card">
            <div className="sp-num">{applicants.length}</div>
            <div className="sp-label">Total applicants</div>
          </div>
          <div className="sp-stat-card">
            <div className="sp-num">{pendingCount}</div>
            <div className="sp-label">Awaiting review</div>
          </div>
        </div>

        <h3 style={{ marginBottom: 14 }}>Your listings</h3>

        {listings.length === 0 ? (
          <div className="sp-empty-state">
            You haven't posted any listings yet.{" "}
            <Link to="/post-listing" style={{ fontWeight: 700, color: "var(--lime-ink)" }}>
              Post your first one
            </Link>
            .
          </div>
        ) : (
          <div className="sp-listing-grid">
            {listings.map((listing) => {
              const count = getApplicantsForListing(listing.id).length;
              return (
                <div className="sp-listing-card" key={listing.id}>
                  <div className="sp-listing-top">
                    <div>
                      <div className="sp-listing-title">{listing.title}</div>
                      <div className="sp-listing-sub">
                        {listing.company} · {listing.location}
                      </div>
                    </div>
                    <span
                      className={`sp-status-pill ${
                        listing.status === "Open" ? "sp-status-accepted" : "sp-status-submitted"
                      }`}
                    >
                      {listing.status}
                    </span>
                  </div>
                  <div className="sp-listing-meta">
                    Posted {listing.postedDate} · Closes {listing.closingDate}
                  </div>
                  <span className={listing.type === "Internship" ? "sp-tag sp-tag-lime" : "sp-tag"}>
                    {listing.type}
                  </span>
                  <div className="sp-applicant-count">
                    {count} applicant{count === 1 ? "" : "s"}
                  </div>
                  <div className="sp-listing-actions">
                    <Link className="sp-btn sp-btn-dark" to={`/view-applicants/${listing.id}`}>
                      View applicants
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
