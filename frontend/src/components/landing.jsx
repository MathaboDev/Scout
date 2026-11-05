// Building blocks for the public landing page (Landing.jsx).
// Display only: no API calls, no app state.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useReveal } from "../lib/useReveal.js";

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

// ---------- tile collage that flies in on scroll ----------

// Each tile has:
//   - a soft gradient drawn from Scout's hero palette
//   - an icon + short label
//   - a starting offset (dx, dy) that says where it flies in FROM
//   - a tiny rotation so the landing feels organic, not mechanical
// All positional/animation state is stored on the tile as CSS vars, so the
// transition itself lives in .tile / .tile.in-view in index.css.
const COLLAGE_TILES = [
  { // top-left
    gradient: "linear-gradient(135deg, #F26B4F 0%, #F7A86B 100%)",
    dx: "-80%", dy: "-40%", rot: "-6deg",
  },
  { // top-center
    gradient: "linear-gradient(160deg, #F6E36A 0%, #F4C48A 100%)",
    dx: "0", dy: "-120%", rot: "4deg",
  },
  { // top-right
    gradient: "linear-gradient(200deg, #EE8FB0 0%, #F26B4F 100%)",
    dx: "80%", dy: "-40%", rot: "6deg",
  },
  { // bottom-left
    gradient: "linear-gradient(145deg, #8CC4EC 0%, #C7A9E8 100%)",
    dx: "-80%", dy: "40%", rot: "4deg",
  },
  { // bottom-center
    gradient: "linear-gradient(175deg, #C7A9E8 0%, #EE8FB0 100%)",
    dx: "0", dy: "120%", rot: "-5deg",
  },
  { // bottom-right
    gradient: "linear-gradient(225deg, #F9D976 0%, #F7A86B 100%)",
    dx: "80%", dy: "40%", rot: "-6deg",
  },
];

export function TileCollage({ labels, icons }) {
  const { ref, visible } = useReveal({ threshold: 0.2, rootMargin: "0px 0px -10% 0px" });

  // Cursor-following glow — subtle radial that tracks the mouse across the
  // tile grid, so the collage feels interactive when a visitor hovers it.
  const [glow, setGlow] = useState({ x: 50, y: 50, on: false });
  function handleMove(e) {
    const r = e.currentTarget.getBoundingClientRect();
    setGlow({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
      on: true,
    });
  }

  return (
    <div
      ref={ref}
      className="relative overflow-x-clip py-4"
      onMouseMove={handleMove}
      onMouseLeave={() => setGlow((g) => ({ ...g, on: false }))}
    >
      {/* radial glow that follows the cursor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-10 rounded-[40px] transition-opacity duration-500"
        style={{
          opacity: glow.on ? 1 : 0,
          background: `radial-gradient(260px circle at ${glow.x}% ${glow.y}%, rgba(247,168,107,0.18), transparent 70%)`,
        }}
      />
      <div className="relative grid grid-cols-3 gap-3 sm:gap-4" aria-hidden="true">
        {COLLAGE_TILES.map((t, i) => {
          const Icon = icons[i];
          return (
            <div
              key={i}
              className={`tile group ${visible ? "in-view" : ""} relative aspect-[4/5] cursor-default overflow-hidden rounded-2xl p-4 text-white shadow-[0_12px_40px_-14px_rgba(0,0,0,0.6)] sm:p-5 hover:-translate-y-1 hover:rotate-[-1deg] hover:shadow-[0_20px_60px_-18px_rgba(247,168,107,0.45)]`}
              style={{
                "--tile-dx": t.dx,
                "--tile-dy": t.dy,
                "--tile-rot": t.rot,
                "--tile-scale": 0.85,
                "--tile-delay": `${i * 90}ms`,
                background: t.gradient,
              }}
            >
              {/* soft texture + darken at the bottom so the label reads */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/25" />
              {/* shine sweep on hover */}
              <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
              <div className="relative flex h-full flex-col justify-between">
                {Icon && (
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/25 backdrop-blur-sm transition-transform duration-300 ease-out group-hover:rotate-12 group-hover:scale-110">
                    <Icon size={16} strokeWidth={1.8} />
                  </span>
                )}
                <p className="text-[12.5px] font-medium uppercase tracking-[0.14em] text-white/95">
                  {labels[i]}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- thin scroll progress bar at the top of the viewport ----------

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const scrolled = doc.scrollTop;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? Math.min(100, (scrolled / max) * 100) : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-50 h-[2px] bg-transparent"
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-[#F26B4F] via-[#F6E36A] to-[#8CC4EC] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ---------- white button + square arrow button ----------

// `to` = in-app route (react-router Link), `href` = same-page anchor like "#how".
export function CtaPair({ label, to, href, dark = false }) {
  const base = `group inline-flex h-11 items-center justify-center rounded-md text-[12.5px] font-medium uppercase tracking-[0.14em] transition-all duration-200 ${
    dark ? "bg-ink text-white hover:bg-ink-soft" : "bg-white text-ink hover:bg-[#EDEDED]"
  }`;
  const Tag = to ? Link : "a";
  const target = to ? { to } : { href };
  return (
    <div className="flex items-center gap-1.5">
      <Tag {...target} className={`${base} px-6`}>
        {label}
      </Tag>
      <Tag
        {...target}
        aria-hidden="true"
        tabIndex={-1}
        className={`${base} w-11 hover:w-[52px]`}
      >
        <ArrowRight
          size={16}
          className="transition-transform duration-200 ease-out group-hover:translate-x-0.5"
        />
      </Tag>
    </div>
  );
}
