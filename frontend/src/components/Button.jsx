import { Link } from "react-router-dom";

const VARIANTS = {
  lime: "bg-lime text-ink hover:bg-[#c3ec1f] hover:-translate-y-px",
  dark: "bg-ink text-white hover:bg-ink-soft hover:-translate-y-px",
  outline: "bg-transparent border-[1.5px] border-line text-ink hover:bg-ink hover:text-white hover:border-ink",
  "outline-light":
    "bg-transparent border-[1.5px] border-white/25 text-white hover:border-white/50",
  ghost: "bg-transparent text-white/80 hover:text-lime",
  "ghost-dark": "bg-transparent text-ink hover:text-lime-ink",
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
  const classes = `inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold font-sans transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
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
