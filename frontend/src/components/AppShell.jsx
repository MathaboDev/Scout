import { User, Briefcase, Bookmark, Settings, LogOut } from "lucide-react";
import Logo from "./Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const NAV = [
  { key: "profile", label: "Profile", icon: User, active: true },
  { key: "jobs", label: "Eligible jobs", icon: Briefcase, soon: true },
  { key: "watchlist", label: "Watchlist", icon: Bookmark, soon: true },
  { key: "settings", label: "Settings", icon: Settings, soon: true },
];

export default function AppShell({ title, subtitle, children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.full_name || "Scout Student")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleSignOut() {
    signOut();
    navigate("/login");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="flex flex-col bg-ink px-5 py-7 text-white">
        <Logo variant="light" />
        <nav className="mt-10 flex flex-col gap-1">
          {NAV.map((item) => (
            <div
              key={item.key}
              className={`flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-sm font-medium transition-colors ${
                item.active
                  ? "bg-lime font-bold text-ink"
                  : item.soon
                  ? "cursor-default text-white/30"
                  : "text-white/70 hover:bg-ink-soft hover:text-white"
              }`}
              title={item.soon ? "Coming soon" : undefined}
            >
              <item.icon size={17} />
              {item.label}
              {item.soon && (
                <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                  Soon
                </span>
              )}
            </div>
          ))}
        </nav>
        <button
          onClick={handleSignOut}
          className="mt-auto flex items-center gap-2.5 border-t border-ink-line pt-5 text-left text-sm text-white/60 hover:text-lime"
        >
          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-lime text-[13px] font-bold text-ink">
            {initials}
          </span>
          <span className="flex-1">
            <span className="block text-[13px] font-bold text-white">
              {user?.full_name || "Your account"}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-white/40">
              <LogOut size={11} /> Log out
            </span>
          </span>
        </button>
      </aside>
      <main className="bg-cream px-6 py-10 md:px-11">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
