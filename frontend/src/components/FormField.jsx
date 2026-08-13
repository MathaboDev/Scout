export default function FormField({
  label,
  icon: Icon,
  error,
  className = "",
  as = "input",
  children,
  ...inputProps
}) {
  return (
    <label className={`mb-4 block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-ink">{label}</span>
      <span
        className={`flex items-center gap-2.5 rounded-[10px] border-[1.5px] bg-white px-3.5 py-3 text-sm transition-colors focus-within:border-ink ${
          error ? "border-rust" : "border-line"
        }`}
      >
        {Icon && <Icon size={16} className="shrink-0 text-muted" />}
        {as === "select" ? (
          <select
            className="w-full appearance-none bg-transparent text-ink outline-none placeholder:text-[#A6A59D]"
            {...inputProps}
          >
            {children}
          </select>
        ) : (
          <input
            className="w-full bg-transparent text-ink outline-none placeholder:text-[#A6A59D]"
            {...inputProps}
          />
        )}
      </span>
      {error && <span className="mt-1.5 block text-xs font-medium text-rust">{error}</span>}
    </label>
  );
}
