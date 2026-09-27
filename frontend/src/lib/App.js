import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import PostListing from "./pages/PostListing";
import ViewApplicants from "./pages/ViewApplicants";
import ApplicantDetails from "./pages/ApplicantDetails";
import "./styles/scout-provider.css";

/*
  NOTE FOR MERGING INTO A TEAM PROJECT:
  If your teammates already have a <BrowserRouter> and <Routes> set up
  elsewhere (e.g. in their own App.js), don't nest a second BrowserRouter —
  React Router only supports one per app. Instead, copy the five <Route>
  lines inside <Routes> below into their existing <Routes>, and copy the
  import lines to wherever their routes file lives. See README.md.
*/

export default function App() {
  return (
    <BrowserRouter>
      <div className="scout-provider-app">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/post-listing" element={<PostListing />} />
          <Route path="/view-applicants/:listingId" element={<ViewApplicants />} />
          <Route path="/applicant/:id" element={<ApplicantDetails />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
