import React from "react";
import { Link } from "react-router-dom";

/*
  active: "dashboard" | "post-listing" | none
  Pass which nav item should be highlighted on the current page.
*/
export default function Sidebar({ active }) {
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
        <span className="sp-side-link">
          <i className="ti ti-settings"></i> Settings
        </span>
      </div>

      <div className="sp-side-user">
        <div className="sp-avatar">BW</div>
        <div>
          <div className="sp-un">ByteWorks</div>
          <div className="sp-uv">Provider account</div>
        </div>
      </div>
    </div>
  );
}
