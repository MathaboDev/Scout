import { Link } from "react-router-dom";

/**
 * Scout doesn't have a designed logo yet, so the mark below is a small
 * original glyph rather than a placeholder icon: a compass needle inside a
 * ring, standing in for "finding your bearing" among opportunities. It's
 * drawn as inline SVG (no image asset, no icon-font glyph) so it stays crisp
 * at any size and can be restyled the moment a real brand mark exists.
 */
export function Mark({ size = 34, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="17" cy="17" r="16" fill="#D7FF3D" />
      <circle cx="17" cy="17" r="16" stroke="#101014" strokeOpacity="0.08" />
      <path d="M17 8L21 17L17 26L13 17L17 8Z" fill="#101014" />
      <path d="M17 8L21 17L17 15.5L17 8Z" fill="#101014" fillOpacity="0.55" />
      <circle cx="17" cy="17" r="1.6" fill="#D7FF3D" />
    </svg>
  );
}

export default function Logo({ variant = "dark", className = "", to = "/" }) {
  const textColor = variant === "light" ? "text-white" : "text-ink";
  return (
    <Link to={to} className={`flex items-center gap-2.5 ${className}`}>
      <Mark />
      <span className={`font-display font-bold text-[19px] tracking-tight ${textColor}`}>
        Scout
      </span>
    </Link>
  );
}
