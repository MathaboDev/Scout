// The one router for the whole app. App owns BrowserRouter and AuthProvider,
// so main.jsx should render just <App /> and nothing else.
//
// Route params are always named opportunityId / listingId / applicationId (never :id).
// Student pages are wrapped in <RequireAuth role="student">, provider pages in
// <RequireAuth role="provider">. Each page draws its own layout (AppShell or ProviderShell).
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import RequireAuth from "./components/RequireAuth.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import Eligible from "./pages/Eligible.jsx";
import JobDetails from "./pages/JobDetails.jsx";
import Apply from "./pages/Apply.jsx";
import Watchlist from "./pages/Watchlist.jsx";
import Profile from "./pages/Profile.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import PostListing from "./pages/PostListing.jsx";
import ViewApplicants from "./pages/ViewApplicants.jsx";
import ApplicantDetails from "./pages/ApplicantDetails.jsx";

// Small helpers so each route line stays readable.
// These are defined at the top level of the file (not inside App), so React
// never remounts them on re-render.
function Student({ children }) {
  return <RequireAuth role="student">{children}</RequireAuth>;
}

function Provider({ children }) {
  return <RequireAuth role="provider">{children}</RequireAuth>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student */}
          <Route path="/eligible" element={<Student><Eligible /></Student>} />
          <Route path="/jobs/:opportunityId" element={<Student><JobDetails /></Student>} />
          <Route path="/apply/:opportunityId" element={<Student><Apply /></Student>} />
          <Route path="/watchlist" element={<Student><Watchlist /></Student>} />
          <Route path="/profile" element={<Student><Profile /></Student>} />

          {/* Provider */}
          <Route path="/provider/dashboard" element={<Provider><Dashboard /></Provider>} />
          <Route path="/provider/listings/new" element={<Provider><PostListing /></Provider>} />
          <Route path="/provider/listings/:listingId/edit" element={<Provider><PostListing /></Provider>} />
          <Route
            path="/provider/listings/:listingId/applicants"
            element={<Provider><ViewApplicants /></Provider>}
          />
          <Route
            path="/provider/listings/:listingId/applicants/:applicationId"
            element={<Provider><ApplicantDetails /></Provider>}
          />

          {/* Anything else goes home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
