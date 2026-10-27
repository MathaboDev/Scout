import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { addListing } from "../api/dataService.js";

// Define default form state
const initialForm = {
  title: "",
  type: "",
  location: "",
  description: "",
  requirements: "",
  closingDate: "",
  company: "ByteWorks", 
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
   
    <div className="flex h-screen w-full bg-cream overflow-hidden font-sans">
      <Sidebar active="post-listing" />

      <main className="flex-1 h-full overflow-y-auto p-6 lg:p-10">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Post a listing
          </h1>
          <p className="mt-1 text-sm text-muted">
            Fill in the template below — students will see this exact layout when they apply.
          </p>
        </div>

        {/* Form Container */}
        <form 
          className="max-w-3xl rounded-xl2 border border-line bg-white p-6 shadow-sm sm:p-8" 
          onSubmit={handleSubmit}
        >
          
          {/* Title */}
          <div className="mb-5 flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink">Job / opportunity title</label>
            <input
              type="text"
              placeholder="e.g. Software developer intern"
              value={form.title}
              onChange={handleChange("title")}
              required
              className="w-full rounded-xl2 border border-line bg-cream px-4 py-2.5 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink placeholder:text-muted/70"
            />
          </div>

          {/* Type and Location */}
          <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-ink">Opportunity type</label>
              <select 
                value={form.type} 
                onChange={handleChange("type")} 
                required
                className="w-full rounded-xl2 border border-line bg-cream px-4 py-2.5 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
              >
                <option value="">Select type</option>
                <option>Internship</option>
                <option>Full-time</option>
                <option>Part-time</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-ink">Location</label>
              <input
                type="text"
                placeholder="e.g. Remote, South Africa"
                value={form.location}
                onChange={handleChange("location")}
                required
                className="w-full rounded-xl2 border border-line bg-cream px-4 py-2.5 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink placeholder:text-muted/70"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-5 flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink">Description</label>
            <textarea
              placeholder="What will the student be doing day to day?"
              value={form.description}
              onChange={handleChange("description")}
              required
              rows={4}
              className="w-full rounded-xl2 border border-line bg-cream px-4 py-2.5 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink placeholder:text-muted/70 resize-y"
            />
          </div>

          {/* Requirements */}
          <div className="mb-5 flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink">Requirements</label>
            <textarea
              placeholder="Field of study, year of study, skills, etc."
              value={form.requirements}
              onChange={handleChange("requirements")}
              required
              rows={3}
              className="w-full rounded-xl2 border border-line bg-cream px-4 py-2.5 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink placeholder:text-muted/70 resize-y"
            />
            <div className="text-xs text-muted mt-1">
              This is matched against student profiles to determine eligibility.
            </div>
          </div>

          {/* Dates and Company */}
          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-ink">Closing date</label>
              <input
                type="date"
                value={form.closingDate}
                onChange={handleChange("closingDate")}
                required
                className="w-full rounded-xl2 border border-line bg-cream px-4 py-2.5 text-sm text-ink outline-none transition focus:border-ink focus:ring-1 focus:ring-ink"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-ink">Company (auto-filled)</label>
              <input 
                type="text" 
                value={form.company} 
                readOnly 
                className="w-full rounded-xl2 border border-line bg-gray-bg px-4 py-2.5 text-sm text-muted outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-line pt-6">
            <Link 
              to="/dashboard" 
              className="rounded-xl2 border border-line px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              className="inline-flex items-center gap-2 rounded-xl2 bg-lime px-5 py-2.5 text-sm font-semibold text-ink-soft transition hover:opacity-90"
            >
              <i className="ti ti-check text-lg" /> Post listing
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
