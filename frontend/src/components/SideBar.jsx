import { useNavigate, useLocation } from "react-router-dom";
import { Mark } from "./Logo.jsx";

export default function Sidebar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
    : "YN";

  const navItems = [
    {
      label: "Profile",
      path: "/profile",
    },
    {
      label: "Eligible jobs",
      path: "/eligible",
    },
    {
      label: "Watchlist",
      path: "/watchlist",
    },
    {
      label: "Settings",
      path: "/settings",
    },
  ];

  return (
    <aside className="flex min-h-screen w-[225px] shrink-0 flex-col justify-between bg-ink px-4 py-6 text-white">
      <div>
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-lime text-lg font-bold text-ink">
          <Mark size ={38} />
          </div>

          <span className="text-xl font-bold">Scout</span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                  isActive
                    ? "bg-lime text-ink"
                    : "text-white hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3 border-t border-white/10 px-2 pt-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
          {initials}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {user?.fullName || "Your Name"}
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
    </aside>
  );
}


