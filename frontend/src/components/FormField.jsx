// Labelled input (or select) used on sign up, login and profile forms.
// Labels are small uppercase text, like the landing page's section tags.
export default function FormField({
  label,
  icon: Icon,
  error,
  className = "",
  as = "input",
  children,
  ...inputProps
}) {
  const sharedClassName = "w-full min-w-0 bg-transparent text-ink outline-none placeholder:text-[#A3A3A3]";

  return (
    <label className={`mb-4 block ${className}`}>
      <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink/60">{label}</span>
      <span
        className={`flex h-12 items-center gap-2.5 rounded-md border bg-white px-3.5 text-sm transition-colors focus-within:border-ink ${
          error ? "border-rust" : "border-black/10"
        }`}
      >
        {Icon && <Icon size={16} className="shrink-0 text-muted" />}
        {as === "select" ? (
          <select {...inputProps} className={`${sharedClassName} appearance-none`}>
            {children}
          </select>
        ) : (
          <input {...inputProps} type={inputProps.type || "text"} className={sharedClassName} />
        )}
      </span>

      {error && <span className="mt-1.5 block text-xs font-medium text-rust">{error}</span>}
    </label>
  );
}
