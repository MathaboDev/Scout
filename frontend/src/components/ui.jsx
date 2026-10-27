// Small visual building blocks shared by student and provider pages.
// All of them are plain display components: no API calls, no state.
import { Clock } from "lucide-react";

// ---------- company logos ----------

// Simple flat logos for the demo companies (see seed_demo). Each entry is
// a background colour plus the white shapes drawn on a 40x40 grid.
// Any company not listed here gets a plain monogram instead.
const COMPANY_LOGOS = {
  ByteWorks: {
    bg: "#1E3A8A",
    glyph: (
      <g fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 13l-7 7 7 7" />
        <path d="M24 13l7 7-7 7" />
      </g>
    ),
  },
  "Kopano Analytics": {
    bg: "#0F766E",
    glyph: (
      <g fill="#fff">
        <rect x="10" y="22" width="5" height="9" rx="1" />
        <rect x="17.5" y="16" width="5" height="15" rx="1" />
        <rect x="25" y="9" width="5" height="22" rx="1" />
      </g>
    ),
  },
  "Mzansi Rail & Power Engineering": {
    bg: "#C2410C",
    glyph: <path fill="#fff" d="M23 7L11 22h7.5L16 33l13-16h-7.5z" />,
  },
  "Indaba Ledger Accountants": {
    bg: "#166534",
    glyph: (
      <g fill="#fff">
        <rect x="10" y="11" width="20" height="3.5" rx="1" />
        <rect x="10" y="18.25" width="20" height="3.5" rx="1" />
        <rect x="10" y="25.5" width="12" height="3.5" rx="1" />
      </g>
    ),
  },
  "Umoya Community Health": {
    bg: "#B91C1C",
    glyph: (
      <g fill="#fff">
        <rect x="16.5" y="9" width="7" height="22" rx="1.5" />
        <rect x="9" y="16.5" width="22" height="7" rx="1.5" />
      </g>
    ),
  },
  "Lekgotla Legal Chambers": {
    bg: "#3F1D38",
    glyph: (
      <g fill="#fff">
        <path d="M8 15.5L20 8l12 7.5z" />
        <rect x="11" y="17.5" width="3.2" height="10" />
        <rect x="18.4" y="17.5" width="3.2" height="10" />
        <rect x="25.8" y="17.5" width="3.2" height="10" />
        <rect x="8" y="29" width="24" height="3" rx="0.8" />
      </g>
    ),
  },
  "Sizwe Youth Research Institute": {
    bg: "#5B21B6",
    glyph: (
      <g fill="none" stroke="#fff" strokeWidth="3">
        <circle cx="16" cy="20" r="7" />
        <circle cx="24" cy="20" r="7" />
      </g>
    ),
  },
  "Fynbos BioLabs": {
    bg: "#3F6212",
    glyph: (
      <g>
        <path fill="#fff" d="M11 29c0-11 7.5-18 19-18 0 11.5-7.5 18-19 18z" />
        <path stroke="#3F6212" strokeWidth="2.2" strokeLinecap="round" d="M13 27l10-10" />
      </g>
    ),
  },
  "Bright Futures Schools Trust": {
    bg: "#B45309",
    glyph: (
      <g fill="#fff">
        <path d="M10 26a10 10 0 0120 0z" />
        <rect x="7" y="28" width="26" height="3" rx="1" />
      </g>
    ),
  },
  "Karoo Craft Studios": {
    bg: "#7C2D12",
    glyph: <path fill="#fff" d="M6 30l10-16 6 9 4-5 8 12z" />,
  },
};

const LOGO_SIZES = { sm: 36, md: 44, lg: 64 };

function initials(name = "") {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").split(" ").filter(Boolean);
  return ((words[0]?.[0] || "?") + (words[1]?.[0] || "")).toUpperCase();
}

export function CompanyAvatar({ name, size = "md" }) {
  const px = LOGO_SIZES[size];
  const logo = COMPANY_LOGOS[name];

  if (!logo) {
    return (
      <span
        aria-hidden="true"
        style={{ width: px, height: px, fontSize: px * 0.32 }}
        className="flex shrink-0 items-center justify-center rounded-lg border border-line bg-white font-bold text-ink"
      >
        {initials(name)}
      </span>
    );
  }

  return (
    <svg width={px} height={px} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
      <rect width="40" height="40" rx="8" fill={logo.bg} />
      {logo.glyph}
    </svg>
  );
}

// ---------- opportunity type tag ----------

// Neutral tag with a small coloured dot so the three types are easy to tell apart.
const TYPE_DOTS = {
  Internship: "bg-[#2F6B4F]",
  Learnership: "bg-[#2F5FA0]",
  "Graduate programme": "bg-[#7A4A9C]",
};

export function TypeChip({ type }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-2 py-0.5 text-xs font-medium text-ink">
      <span className={`h-1.5 w-1.5 rounded-full ${TYPE_DOTS[type] || "bg-muted"}`} />
      {type}
    </span>
  );
}

export function FieldChip({ field }) {
  return (
    <span className="inline-flex items-center rounded-md bg-gray-bg px-2 py-0.5 text-xs font-medium text-muted">
      {field}
    </span>
  );
}

// ---------- closing-date urgency ----------

export function daysUntil(value) {
  if (!value) return null;
  return Math.ceil((new Date(value) - new Date()) / 86400000);
}

// Red text when 3 days or fewer remain, amber within a week, grey otherwise.
export function UrgencyLabel({ date, label }) {
  const days = daysUntil(date);
  const tone =
    days === null || days < 0 ? "text-muted" : days <= 3 ? "text-rust" : days <= 7 ? "text-[#966B1F]" : "text-muted";
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${tone}`}>
      <Clock size={12} /> {label}
    </span>
  );
}

// ---------- loading placeholder ----------

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-line bg-white p-5">
      <div className="flex gap-3">
        <div className="h-11 w-11 rounded-lg bg-gray-bg" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 w-3/4 rounded bg-gray-bg" />
          <div className="h-3 w-1/3 rounded bg-gray-bg" />
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-5 w-20 rounded bg-gray-bg" />
        <div className="h-5 w-28 rounded bg-gray-bg" />
      </div>
      <div className="mt-6 h-9 rounded-lg bg-gray-bg" />
    </div>
  );
}

// ---------- plain stat tile ----------

export function StatTile({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-white px-4 py-3">
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1.5 text-xs text-muted">{label}</p>
    </div>
  );
}
