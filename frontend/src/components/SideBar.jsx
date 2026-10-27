import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { User, Briefcase, Bookmark, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { Mark } from "./Logo.jsx";

// Student navigation, in this order: Profile, Scouted jobs, Watchlist.
// Styled like the landing page nav: uppercase, widely spaced letters,
// and the current page shown as a white tab.
const NAV_ITEMS = [
  { label: "Profile", path: "/profile", icon: User },
  { label: "Scouted jobs", path: "/eligible", icon: Briefcase },
  { label: "Watchlist", path: "/watchlist", icon: Bookmark },
];

// `onNavigate` lets the mobile drawer close itself after a link is clicked.
export default function Sidebar({ user, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const fullName = user?.fullName || "Your Name";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((name) => name[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleSignOut() {
    signOut();
    navigate("/login");
  }

  // a job page or apply page counts as being inside "Scouted jobs"
  function isActive(path, matched) {
    return matched || (path === "/eligible" && /^\/(jobs|apply)\//.test(location.pathname));
  }

  return (
    <aside className="flex h-full w-[240px] flex-col justify-between bg-[#0A0A0A] px-4 py-6 text-white">
      <div>
        <div className="mb-10 flex items-center gap-2.5 px-2">
          <Mark size={32} />
          <span className="text-[19px] font-medium tracking-tight">Scout</span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onNavigate}
              className={({ isActive: matched }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-[12px] font-medium uppercase tracking-[0.14em] transition-colors ${
                  isActive(path, matched) ? "bg-white text-ink" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10 px-2 pt-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-medium">
            {initials || "?"}
          </div>
          <p className="min-w-0 truncate text-sm font-medium">{fullName}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-4 flex w-full items-center gap-2 py-2 text-[12px] font-medium uppercase tracking-[0.14em] text-white/50 transition-colors hover:text-white"
        >
          <LogOut size={15} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
