import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "./SideBar.jsx";
import { Mark } from "./Logo.jsx";

// Layout for every student screen.
// Desktop: sidebar stays fixed on the left while the page scrolls.
// Phone:   a top bar with a menu button that slides the sidebar in.
// `title` is optional: pages with their own banner (Eligible) leave it out.
export default function AppShell({ title, subtitle, children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // close the phone menu whenever the page changes
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const sidebarUser = {
    fullName:
      [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
      user?.full_name ||
      user?.name ||
      "",
  };

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* desktop sidebar */}
      <div className="fixed inset-y-0 left-0 z-30 hidden md:block">
        <Sidebar user={sidebarUser} />
      </div>

      {/* phone top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-[#0A0A0A] px-4 py-3 text-white md:hidden">
        <div className="flex items-center gap-2.5">
          <Mark size={32} />
          <span className="text-[18px] font-medium tracking-tight">Scout</span>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-ink"
        >
          <Menu size={19} />
        </button>
      </header>

      {/* phone drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-ink/50"
          />
          <div className="absolute inset-y-0 left-0 animate-[slideIn_0.2s_ease-out]">
            <Sidebar user={sidebarUser} onNavigate={() => setMenuOpen(false)} />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <main className="min-w-0 px-4 py-6 sm:px-6 md:ml-[240px] md:px-10 md:py-10 lg:px-12">
        <div className="mx-auto max-w-6xl">
          {title && (
            <div className="mb-8">
              <h1 className="text-[clamp(2rem,3.4vw,2.75rem)] font-medium leading-[1.08] tracking-[-0.02em]">{title}</h1>
              {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
