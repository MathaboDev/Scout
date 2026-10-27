// One badge for application status, used on BOTH the student dashboard
// and the provider screens, so both sides see the same visual language.

const STYLES = {
  Submitted: "bg-gray-bg text-[#5B5A52]",
  "Under Review": "bg-amber-bg text-[#966B1F]",
  "Outcome Received": "bg-[#E7EEF9] text-[#2F5FA0]",
  Successful: "bg-green-bg text-[#3F7A33]",
  Unsuccessful: "bg-[#FBE8E4] text-[#C24A3A]",
};

export default function StatusBadge({ status, outcome }) {
  const showOutcome = status === "Outcome Received" && outcome;
  const label = showOutcome ? `Outcome: ${outcome}` : status || "Submitted";
  const style = STYLES[showOutcome ? outcome : status] || STYLES.Submitted;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${style}`}
    >
      {label}
    </span>
  );
}

// Three-step progress used on the receipt and the student dashboard.
export function StatusTimeline({ status, outcome }) {
  const steps = [
    { key: "Submitted", label: "Submitted", hint: "Your application was received." },
    { key: "Under Review", label: "Under review", hint: "The provider is reviewing it." },
    {
      key: "Outcome Received",
      label: outcome ? `Outcome: ${outcome}` : "Outcome",
      hint: "You'll be notified when a decision is made.",
    },
  ];
  const reached = ["Submitted", "Under Review", "Outcome Received"].indexOf(status || "Submitted");

  return (
    <ol className="space-y-4">
      {steps.map((step, i) => {
        const done = i <= reached;
        return (
          <li key={step.key} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                done ? "bg-ink text-white" : "bg-gray-bg text-muted"
              }`}
              aria-hidden="true"
            >
              {done ? "✓" : i + 1}
            </span>
            <div>
              <p className={`text-sm font-bold ${done ? "text-ink" : "text-muted"}`}>{step.label}</p>
              <p className="mt-0.5 text-xs text-muted">{step.hint}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}