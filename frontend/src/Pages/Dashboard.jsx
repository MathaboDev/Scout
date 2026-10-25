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
    // h-screen and overflow-hidden locks the page size
    <div className="flex h-screen w-full bg-cream overflow-hidden font-sans">
      
      {/* The Sidebar sits on the left */}
      <Sidebar active="dashboard" />

      {/* flex-1 pushes the main content into the gap on the right */}
      <main className="flex-1 h-full overflow-y-auto p-6 lg:p-10">
        
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Welcome back, ByteWorks
            </h1>
            <p className="mt-1 text-sm text-muted">
              Here's an overview of your listings and applicants.
            </p>
          </div>
          <Link
            to="/post-listing"
            className="inline-flex items-center justify-center gap-2 rounded-xl2 bg-lime px-5 py-2.5 text-sm font-semibold text-ink-soft transition hover:opacity-90"
          >
            <i className="ti ti-plus text-lg" /> Post a listing
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl2 border border-line bg-white p-6 shadow-sm">
            <div className="text-3xl font-bold text-ink">{activeCount}</div>
            <div className="mt-1 text-sm font-medium text-muted">Active listings</div>
          </div>
          <div className="rounded-xl2 border border-line bg-white p-6 shadow-sm">
            <div className="text-3xl font-bold text-ink">{applicants.length}</div>
            <div className="mt-1 text-sm font-medium text-muted">Total applicants</div>
          </div>
          <div className="rounded-xl2 border border-line bg-white p-6 shadow-sm">
            <div className="text-3xl font-bold text-ink">{pendingCount}</div>
            <div className="mt-1 text-sm font-medium text-muted">Awaiting review</div>
          </div>
        </div>

        <h3 className="mb-4 text-lg font-semibold text-ink">Your listings</h3>

        {listings.length === 0 ? (
          <div className="rounded-xl2 border border-line bg-white p-8 text-center text-muted shadow-sm">
            You haven't posted any listings yet.{" "}
            <Link to="/post-listing" className="font-semibold text-lime-ink hover:underline">
              Post your first one
            </Link>.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {listings.map((listing) => {
              const count = getApplicantsForListing(listing.id).length;
              return (
                <div
                  key={listing.id}
                  className="flex flex-col justify-between rounded-xl2 border border-line bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-bold text-ink">{listing.title}</div>
                        <div className="mt-1 text-sm text-muted">
                          {listing.company} · {listing.location}
                        </div>
                      </div>
                      
                      {/* Status Pill using your custom colors */}
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          listing.status === "Open"
                            ? "bg-green-bg text-green"
                            : "bg-gray-bg text-muted"
                        }`}
                      >
                        {listing.status}
                      </span>
                    </div>

                    <div className="mt-4 text-xs text-muted">
                      Posted {listing.postedDate} · Closes {listing.closingDate}
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      {/* Tag using your custom lime color */}
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                          listing.type === "Internship"
                            ? "bg-lime text-lime-ink"
                            : "bg-gray-bg text-ink-soft"
                        }`}
                      >
                        {listing.type}
                      </span>
                      <span className="text-sm font-medium text-muted">
                        {count} applicant{count === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      to={`/view-applicants/${listing.id}`}
                      className="block w-full rounded-xl2 bg-ink py-2.5 text-center text-sm font-semibold text-white transition hover:bg-ink-soft"
                    >
                      View applicants
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}