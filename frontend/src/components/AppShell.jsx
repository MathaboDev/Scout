
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "./SideBar.jsx";

export default function AppShell({ title, subtitle, children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Adapt the authenticated user to the Sidebar's expected format.
  const sidebarUser = {
    fullName:
      [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
      user?.full_name ||
      user?.name ||
      "",
  };

  function handleSignOut() {
    signOut();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen bg-cream text-ink">
      <Sidebar user={sidebarUser} />

      <main className="min-w-0 flex-1 px-6 py-10 md:px-11">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && (
              <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
            )}
          </div>

          {location.pathname !== "/profile" && (
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm font-semibold text-muted hover:text-ink"
            >
              Log out
            </button>
          )}
        </div>

        {children}
      </main>
    </div>
  );
}
