import { Link } from "react-router-dom";
import { Mark } from "./Logo.jsx";

// Landing page footer, in the same dark style as the sections above it.
const COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Create a profile", to: "/register" },
    ],
  },
  {
    title: "Trust",
    links: [{ label: "Data & POPIA", href: "#privacy" }],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", to: "/login" },
      { label: "Sign up", to: "/register" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0A0A0A] px-6 py-14 text-white/55 sm:px-8 md:px-10">
      <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5 text-white">
            <Mark size={36} />
            <span className="text-[19px] font-medium tracking-tight">Scout</span>
          </div>
          <p className="mt-5 text-sm leading-relaxed">
            Built by and for South African students. One profile, matched automatically, tracked in
            one place.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3 sm:gap-16">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link to={l.to} className="transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    ) : (
                      <a href={l.href} className="transition-colors hover:text-white">
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-14 border-t border-white/10 pt-6 text-xs text-white/30">
        © {new Date().getFullYear()} Scout. A student capstone project, not yet a registered service provider.
      </p>
    </footer>
  );
}
