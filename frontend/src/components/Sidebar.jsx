import React from "react";
import { Link } from "react-router-dom";
import { getCurrentProvider } from "../data/dataService";

export default function Sidebar({ active }) {
  const provider = getCurrentProvider();
  const initials = provider.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="sp-sidebar">
      <Link className="sp-logo" to="/dashboard">
        <div className="sp-logo-badge">S</div>
        <div className="sp-logo-text">Scout</div>
      </Link>

      <div className="sp-side-nav">
        <Link
          className={`sp-side-link ${active === "dashboard" ? "sp-active" : ""}`}
          to="/dashboard"
        >
          <i className="ti ti-layout-dashboard"></i> Dashboard
        </Link>
        <Link
          className={`sp-side-link ${active === "post-listing" ? "sp-active" : ""}`}
          to="/post-listing"
        >
          <i className="ti ti-plus"></i> Post a listing
        </Link>
        {}
      </div>

      <div className="sp-side-user">
        <div className="sp-avatar">{initials}</div>
        <div>
          <div className="sp-un">{provider.name}</div>
          <div className="sp-uv">Provider account</div>
        </div>
      </div>
    </div>
  );
}
