import { Routes, Route, Navigate } from "react-router-dom";
import "./pages/scout-provider.css";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import Eligible from "./pages/Eligible.jsx";
import JobDetails from "./pages/JobDetails.jsx";
import Apply from "./pages/Apply.jsx";
import Watchlist from "./pages/Watchlist.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import PostListing from "./pages/PostListing.jsx";
import ApplicantDetails from "./pages/ApplicantDetails.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/profile" element={<Profile />} />
      <Route path="/eligible" element={<Eligible />} />
      <Route path="/jobs/:id" element={<JobDetails />} />
      <Route path="/apply" element={<Apply />} />

      <Route path="/application/review/:opportunityId" element={<Apply />} />

      <Route path="/watchlist" element={<Watchlist />} />
      <Route path="/post-listing" element={<PostListing />} />

      {/* Shows all applicants for one listing */}
      <Route
        path="/view-applicants/:listingId" element={<ApplicantDetails />}
      />

      {/* Shows one applicant's details */}
      <Route
        path="/applicantdetails/:listingId/:id" element={<ApplicantDetails />}
      />

      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}