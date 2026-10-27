import { useNavigate, useLocation } from "react-router-dom";
import {
  User,
  Briefcase,
  Bookmark,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { Mark } from "./Logo.jsx";

export default function Sidebar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const fullName = user?.fullName || "Your Name";

  const initials =
    fullName !== "Your Name"
      ? fullName
          .split(" ")
          .filter(Boolean)
          .map((name) => name[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "YN";

  const navItems = [
    { key: "profile", label: "Scouter", path: "/profile", icon: User },
    {
      key: "eligible",
      label: "Scouted jobs",
      path: "/eligible",
      icon: Briefcase,
    },
    {
      key: "watchlist",
      label: "Watchlist",
      path: "/watchlist",
      icon: Bookmark,
    },
    {
      key: "settings",
      label: "Settings",
      path: "/dashboard",
      icon: Settings,
    },
  ];

  function handleSignOut() {
    signOut();
    navigate("/login");
  }

  return (
    <aside className="flex min-h-screen w-[225px] shrink-0 flex-col justify-between bg-ink px-4 py-6 text-white">
      <div>
        {/* Scout logo */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-lime text-lg font-bold text-ink">
            <Mark size={38} />
          </div>

          <span className="text-xl font-bold">Scout</span>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.path)}
                aria-current={isActive ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                  isActive
                    ? "bg-lime text-ink"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Student information and logout */}
      <div className="border-t border-white/10 px-2 pt-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {fullName}
            </p>

            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="text-xs text-white/60 hover:text-white hover:underline"
            >
              View profile
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-5 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={16} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
