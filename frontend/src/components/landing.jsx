// Building blocks for the public landing page (Landing.jsx).
// Display only: no API calls, no app state.
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// ---------- fluid gradient background ----------

// Soft colour blobs that drift slowly behind a heavy blur, which reads as
// one flowing "liquid" gradient. --dx / --dy / --s tell each blob how far
// to drift and how much to grow (see @keyframes drift in index.css).
const BLOBS = [
  { color: "#F26B4F", x: -10, y: 45, size: 60, dx: "18%", dy: "-12%", s: 1.15, dur: 19 },
  { color: "#F7A86B", x: 20, y: -15, size: 55, dx: "-10%", dy: "16%", s: 1.25, dur: 23 },
  { color: "#F6E36A", x: 40, y: 35, size: 50, dx: "14%", dy: "10%", s: 0.9, dur: 17 },
  { color: "#8CC4EC", x: 55, y: -10, size: 45, dx: "-16%", dy: "14%", s: 1.2, dur: 21 },
  { color: "#EE8FB0", x: 65, y: 50, size: 55, dx: "-12%", dy: "-14%", s: 1.1, dur: 25 },
  { color: "#F4C48A", x: 85, y: 10, size: 45, dx: "-14%", dy: "18%", s: 1.3, dur: 20 },
  { color: "#C7A9E8", x: 5, y: 85, size: 40, dx: "20%", dy: "-10%", s: 1.2, dur: 27 },
  { color: "#F9D976", x: 80, y: 80, size: 40, dx: "-18%", dy: "-16%", s: 1.15, dur: 18 },
];

export function FluidGradient({ className = "" }) {
  return (
    <div aria-hidden="true" className={`absolute inset-0 overflow-hidden bg-[#F3B58A] ${className}`}>
      <div className="absolute inset-[-15%] blur-[70px] saturate-[1.15]">
        {BLOBS.map((b, i) => (
          <span
            key={i}
            className="fluid-blob absolute rounded-full"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.size}%`,
              aspectRatio: "1",
              background: b.color,
              "--dx": b.dx,
              "--dy": b.dy,
              "--s": b.s,
              animationDuration: `${b.dur}s`,
              animationDelay: `${-i * 3}s`,
            }}
          />
        ))}
      </div>
      {/* a touch of shade so white text stays readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/[0.04] via-transparent to-black/[0.12]" />
    </div>
  );
}

// ---------- small outlined section label ("OUR OFFER") ----------

export function SectionTag({ children, light = false }) {
  return (
    <span
      className={`inline-block rounded-md border px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] ${
        light ? "border-black/10 text-ink/70" : "border-white/10 text-white/70"
      }`}
    >
      {children}
    </span>
  );
}

// ---------- white button + square arrow button ----------

// `to` = in-app route (react-router Link), `href` = same-page anchor like "#how".
export function CtaPair({ label, to, href, dark = false }) {
  const base = `inline-flex h-11 items-center justify-center rounded-md text-[12.5px] font-medium uppercase tracking-[0.14em] transition-colors ${
    dark ? "bg-ink text-white hover:bg-ink-soft" : "bg-white text-ink hover:bg-[#EDEDED]"
  }`;
  const Tag = to ? Link : "a";
  const target = to ? { to } : { href };
  return (
    <div className="flex items-center gap-1.5">
      <Tag {...target} className={`${base} px-6`}>
        {label}
      </Tag>
      <Tag {...target} aria-hidden="true" tabIndex={-1} className={`${base} w-11`}>
        <ArrowRight size={16} />
      </Tag>
    </div>
  );
}
