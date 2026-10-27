import { Link } from "react-router-dom";

// Shared button, styled like the landing page buttons:
// squared corners, small uppercase letters with wide spacing.
// Variant names are unchanged so every page keeps working.
const VARIANTS = {
  dark: "bg-ink text-white hover:bg-ink-soft",
  // "lime" was the old bright button; it now matches the landing's white button
  lime: "bg-white text-ink border border-black/10 hover:bg-[#EDEDED]",
  outline: "bg-transparent border border-black/15 text-ink hover:bg-ink hover:text-white hover:border-ink",
  "outline-light": "bg-transparent border border-white/25 text-white hover:border-white/60",
  ghost: "bg-transparent text-white/80 hover:text-white",
  "ghost-dark": "bg-transparent text-ink/70 hover:text-ink",
};

export default function Button({
  as = "button",
  to,
  href,
  variant = "dark",
  className = "",
  children,
  full = false,
  ...props
}) {
  const classes = `inline-flex h-11 items-center justify-center gap-2 rounded-md px-6 text-[12.5px] font-medium uppercase tracking-[0.14em] font-sans transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
    VARIANTS[variant]
  } ${full ? "w-full" : ""} ${className}`;

  if (as === "link" || to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
