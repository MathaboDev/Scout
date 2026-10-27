import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, PlusCircle, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { Mark } from "./Logo.jsx";

// Layout for every provider screen. Defined at module level (never inside
// another component) so pages don't remount and inputs keep focus.
const NAV = [
  { to: "/provider/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/provider/listings/new", label: "Post a listing", icon: PlusCircle },
];

export default function ProviderShell({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const company = user?.company_name || "Provider";

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen w-full bg-cream text-ink">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-[#0A0A0A] px-4 py-6 text-white md:flex">
        <div className="flex items-center gap-2.5 px-2">
          <Mark size={32} />
          <span className="text-[19px] font-medium tracking-tight">Scout</span>
        </div>
        <p className="mt-3 px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">Provider portal</p>

        <nav className="mt-9 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/provider/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-[12px] font-medium uppercase tracking-[0.14em] transition-colors ${
                  isActive ? "bg-white text-ink" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={17} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 px-2 pt-5">
          <p className="text-sm font-medium">{company}</p>
          <p className="text-[11px] text-white/50">{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-white/50 hover:text-white"
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {/* compact nav for small screens */}
        <div className="mb-6 md:hidden">
          <div className="flex items-center justify-between">
            <span className="font-bold">Scout · {company}</span>
            <button type="button" onClick={handleLogout} className="text-xs font-semibold text-muted">
              Log out
            </button>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/provider/dashboard"}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.14em] ${
                    isActive ? "bg-ink text-white" : "bg-white text-muted"
                  }`
                }
              >
                <Icon size={14} /> {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

// Small shared pieces used across provider pages.
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-[clamp(2rem,3.4vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`rounded-2xl border border-black/[0.06] bg-white p-6 ${className}`}>{children}</div>;
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <div className="mb-5 rounded-[10px] bg-amber-bg px-4 py-3 text-sm font-medium text-[#966B1F]">{children}</div>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-50 rounded-md bg-ink px-5 py-3.5 text-sm font-semibold text-white shadow-lg"
    >
      {message}
    </div>
  );
}
