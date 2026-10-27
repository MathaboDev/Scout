import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export const HOME_FOR_ROLE = {
  student: "/eligible",
  provider: "/provider/dashboard",
};

// Wrap a route element: <RequireAuth role="student"><Eligible /></RequireAuth>
// Not logged in -> /login (and back here afterwards, e.g. from an FR4 email link).
// Wrong role    -> that role's home screen.
export default function RequireAuth({ role, children }) {
  const { isAuthenticated, role: userRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (role && userRole !== role) {
    return <Navigate to={HOME_FOR_ROLE[userRole] || "/"} replace />;
  }
  return children;
}
