/**
 * The one deliberately "bold" element on the landing page. Scout's core
 * idea is that every listing gets checked against a student's profile and
 * only the matches surface, so the hero visual is a radar sweep that
 * "lights up" a handful of dots (matches) while leaving others dim
 * (not eligible yet). It's built entirely from SVG + CSS keyframes, no
 * image assets, so it stays crisp and cheap.
 */
const DOTS = [
  { x: 62, y: 40, eligible: true, label: "Internship" },
  { x: 130, y: 78, eligible: true, label: "Learnership" },
  { x: 180, y: 150, eligible: false, label: "" },
  { x: 90, y: 168, eligible: true, label: "Graduate" },
  { x: 210, y: 60, eligible: false, label: "" },
  { x: 150, y: 210, eligible: true, label: "Internship" },
  { x: 40, y: 120, eligible: false, label: "" },
];

export default function RadarPanel() {
  return (
    <div className="relative h-[360px] overflow-hidden rounded-2xl border border-ink-line bg-ink-soft p-8">
      <div className="grain absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="relative flex h-full items-center justify-center">
        <svg viewBox="0 0 240 240" className="h-full w-full max-w-[300px]" aria-hidden="true">
          {/* concentric rings */}
          {[110, 82, 54].map((r) => (
            <circle
              key={r}
              cx="120"
              cy="120"
              r={r}
              fill="none"
              stroke="#2B2B30"
              strokeWidth="1"
            />
          ))}
          {/* sweep */}
          <g className="origin-[120px_120px] animate-sweep">
            <path
              d="M120 120 L120 10 A110 110 0 0 1 195 47 Z"
              fill="url(#sweepFade)"
            />
          </g>
          <defs>
            <linearGradient id="sweepFade" x1="120" y1="10" x2="195" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#D7FF3D" stopOpacity="0.28" />
              <stop offset="1" stopColor="#D7FF3D" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* dots representing listings */}
          {DOTS.map((d, i) => (
            <g key={i}>
              <circle
                cx={d.x}
                cy={d.y}
                r={d.eligible ? 5 : 3}
                fill={d.eligible ? "#D7FF3D" : "#3A3A40"}
                className={d.eligible ? "animate-pulse-dot" : ""}
                style={d.eligible ? { animationDelay: `${i * 0.3}s` } : undefined}
              />
            </g>
          ))}
          <circle cx="120" cy="120" r="3" fill="#D7FF3D" />
        </svg>
      </div>
      <div className="absolute bottom-6 left-8 right-8 flex items-center justify-between text-xs text-white/50">
        <span>Scouting eligible matches...</span>
        <span className="font-display font-semibold text-lime">4 opportunities found</span>
      </div>
    </div>
  );
}
