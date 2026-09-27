import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { addListing } from "../api/dataService.js";

const initialForm = {
  title: "",
  company: "ByteWorks",
  type: "",
  location: "",
  description: "",
  requirements: "",
  closingDate: "",
};

export default function PostListing() {
  const [form, setForm] = useState(initialForm);
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addListing(form);
    navigate("/dashboard");
  };

  return (
    <div className="sp-app">
      <Sidebar active="post-listing" />

      <div className="sp-main">
        <div className="sp-main-head">
          <div>
            <h1>Post a listing</h1>
            <p>Fill in the template below — students will see this exact layout when they apply.</p>
          </div>
        </div>

        <form className="sp-card" onSubmit={handleSubmit}>
          <div className="sp-form-group">
            <label>Job / opportunity title</label>
            <input
              type="text"
              placeholder="e.g. Software developer intern"
              value={form.title}
              onChange={handleChange("title")}
              required
            />
          </div>

          <div className="sp-row2">
            <div className="sp-form-group">
              <label>Opportunity type</label>
              <select value={form.type} onChange={handleChange("type")} required>
                <option value="">Select type</option>
                <option>Internship</option>
                <option>Full-time</option>
                <option>Part-time</option>
              </select>
            </div>
            <div className="sp-form-group">
              <label>Location</label>
              <input
                type="text"
                placeholder="e.g. Remote, South Africa"
                value={form.location}
                onChange={handleChange("location")}
                required
              />
            </div>
          </div>

          <div className="sp-form-group">
            <label>Description</label>
            <textarea
              placeholder="What will the student be doing day to day?"
              value={form.description}
              onChange={handleChange("description")}
              required
            />
          </div>

          <div className="sp-form-group">
            <label>Requirements</label>
            <textarea
              placeholder="Field of study, year of study, skills, etc."
              value={form.requirements}
              onChange={handleChange("requirements")}
              required
            />
            <div className="sp-hint">This is matched against student profiles to determine eligibility.</div>
          </div>

          <div className="sp-row2">
            <div className="sp-form-group">
              <label>Closing date</label>
              <input
                type="date"
                value={form.closingDate}
                onChange={handleChange("closingDate")}
                required
              />
            </div>
            <div className="sp-form-group">
              <label>Company (auto-filled)</label>
              <input type="text" value={form.company} readOnly />
            </div>
          </div>

          <div className="sp-form-actions">
            <Link className="sp-btn sp-btn-outline" to="/dashboard">
              Cancel
            </Link>
            <button type="submit" className="sp-btn sp-btn-lime">
              <i className="ti ti-check"></i> Post listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
