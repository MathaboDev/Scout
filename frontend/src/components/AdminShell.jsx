import { NavLink, useNavigate } from "react-router-dom";
import { ShieldCheck, Activity, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { Mark } from "./Logo.jsx";

// Navigation shared by every admin screen.
const NAV = [
  { to: "/admin/verify", label: "Verification queue", icon: ShieldCheck },
  { to: "/admin/activity", label: "Activity", icon: Activity },
];

function useLogout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return async () => {
    await signOut();
    navigate("/login");
  };
}

// Dark sidebar on desktop. Rendered by AdminShell, and directly by
// AdminVerify (which owns its own layout for the slide-over panel).
export function AdminSidebar() {
  const handleLogout = useLogout();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-[#0A0A0A] px-4 py-6 text-white md:flex">
      <div className="flex items-center gap-2.5 px-2">
        <Mark size={32} />
        <span className="text-[19px] font-medium tracking-tight">Scout</span>
      </div>
      <p className="mt-3 px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">Admin portal</p>

      <nav className="mt-6 flex flex-col gap-0.5">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-auto flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
      >
        <LogOut size={16} />
        Log out
      </button>
    </aside>
  );
}

// Compact nav for small screens.
export function AdminMobileNav() {
  const handleLogout = useLogout();
  return (
    <div className="mb-6 md:hidden">
      <div className="flex items-center justify-between">
        <span className="font-bold">Scout · Admin</span>
        <button type="button" onClick={handleLogout} className="text-xs font-semibold text-muted">
          Log out
        </button>
      </div>
      <nav className="mt-3 flex gap-2 overflow-x-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium ${
                isActive ? "bg-ink text-white" : "bg-white text-muted"
              }`
            }
          >
            <Icon size={14} /> {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function AdminShell({ children }) {
  return (
    <div className="flex min-h-screen w-full bg-cream text-ink">
      <AdminSidebar />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-12">
        <AdminMobileNav />
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
