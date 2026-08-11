export default function FeatureCard({ icon: Icon, name, desc }) {
  return (
    <div className="rounded-xl2 border border-line bg-white p-5 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 inline-flex rounded-lg bg-lime p-2 text-lime-ink">
        <Icon size={20} strokeWidth={2} />
      </div>
      <p className="mb-1 text-sm font-bold">{name}</p>
      <p className="text-xs leading-relaxed text-muted">{desc}</p>
    </div>
  );
}
