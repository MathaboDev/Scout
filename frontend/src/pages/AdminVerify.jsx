import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  LogOut,
  Calendar,
  Building2,
  AlertCircle,
  X,
  Mail,
  MapPin,
  GraduationCap,
  TrendingUp,
  Briefcase,
  FileText,
  Clock,
} from "lucide-react";
import { Mark } from "../components/Logo.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDate, closingLabel } from "../lib/constants.js";

// FR9: platform admin verifies listings before they go live to students.
export default function AdminVerify() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifyingId, setVerifyingId] = useState(null);
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api
      .adminPendingListings()
      .then((data) => setListings(data.results || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleVerify(listing) {
    if (verifyingId) return;
    setVerifyingId(listing.opportunity_id);
    setError("");
    try {
      await api.adminVerifyListing(listing.opportunity_id);
      setListings((rows) => rows.filter((l) => l.opportunity_id !== listing.opportunity_id));
      setToast(`Verified "${listing.title}". Students can see it now.`);
      setSelected(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen w-full bg-cream text-ink">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-[#0A0A0A] px-4 py-6 text-white md:flex">
        <div className="flex items-center gap-2.5 px-2">
          <Mark size={32} />
          <span className="text-[19px] font-medium tracking-tight">Scout</span>
        </div>
        <p className="mt-3 px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">Admin portal</p>

        <nav className="mt-6 flex flex-col gap-0.5">
          <span className="flex items-center gap-2.5 rounded-md bg-white/10 px-3 py-2 text-sm font-medium">
            <ShieldCheck size={16} />
            Verification queue
          </span>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-auto flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
        >
          <LogOut size={16} />
          Log out
        </button>
      </aside>

      <main className="flex-1 px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-medium tracking-tight">Verification queue</h1>
              <p className="mt-1.5 text-sm text-muted">
                Listings providers have posted but students can't see yet.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-black/5">
              <Clock size={14} className="text-muted" />
              <span className="font-medium">{listings.length}</span>
              <span className="text-muted">pending</span>
            </div>
          </div>

          {toast && (
            <div className="mb-5 flex items-start gap-2 rounded-md bg-green-bg px-3.5 py-3 text-xs text-[#3F7A33] anim-fade-up">
              <CheckCircle2 size={15} className="mt-px shrink-0" />
              <span>{toast}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-md bg-amber-bg px-3.5 py-3 text-xs text-[#966B1F]">
              <AlertCircle size={15} className="mt-px shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/60" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/15 bg-white px-6 py-20 text-center anim-fade-scale">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-bg">
                <ShieldCheck size={26} className="text-[#3F7A33]" />
              </div>
              <h2 className="text-lg font-medium">Queue is clear</h2>
              <p className="mt-1 text-sm text-muted">Every provider listing has been reviewed.</p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {listings.map((l, i) => (
                <li
                  key={l.opportunity_id}
                  className={`anim-fade-up ${["", "anim-delay-1", "anim-delay-2", "anim-delay-3", "anim-delay-4", "anim-delay-5", "anim-delay-6"][Math.min(i, 6)]}`}
                >
                  <button
                    type="button"
                    onClick={() => setSelected(l)}
                    className="group flex h-full w-full flex-col rounded-2xl border border-black/10 bg-white p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ink/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full bg-amber-bg px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#966B1F]">
                        Pending
                      </span>
                      <span className="text-[11px] text-muted">
                        Posted {formatDate(l.posted_at)}
                      </span>
                    </div>

                    <h2 className="mt-3 text-[17px] font-medium leading-snug group-hover:text-ink">
                      {l.title}
                    </h2>

                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
                      <Building2 size={12} />
                      {l.provider_name}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Chip icon={Briefcase}>{l.opportunity_type}</Chip>
                      <Chip icon={GraduationCap}>{l.field_of_study}</Chip>
                      {l.province && <Chip icon={MapPin}>{l.province}</Chip>}
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4 text-[12px] text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {closingLabel(l.closing_date)}
                      </span>
                      <span className="font-medium text-ink/70 group-hover:text-ink">Review →</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {selected && (
        <DetailPanel
          listing={selected}
          onClose={() => setSelected(null)}
          onVerify={() => handleVerify(selected)}
          verifying={verifyingId === selected.opportunity_id}
        />
      )}
    </div>
  );
}

function Chip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-bg px-2.5 py-1 text-[11px] text-ink/70">
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

function DetailPanel({ listing, onClose, onVerify, verifying }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm anim-fade"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl anim-slide-over">
        <header className="flex items-start justify-between gap-3 border-b border-black/5 px-7 py-5">
          <div>
            <span className="rounded-full bg-amber-bg px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#966B1F]">
              Pending verification
            </span>
            <h2 className="mt-2.5 text-2xl font-medium leading-tight tracking-tight">{listing.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-1.5 text-muted hover:bg-gray-bg hover:text-ink"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-6">
          <section className="mb-6">
            <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Provider</h3>
            <div className="rounded-xl bg-gray-bg/60 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Building2 size={14} className="text-muted" />
                {listing.provider_name}
              </p>
              {listing.provider_email && (
                <p className="mt-1.5 flex items-center gap-2 text-[13px] text-muted">
                  <Mail size={12} />
                  {listing.provider_email}
                </p>
              )}
            </div>
          </section>

          <section className="mb-6 grid grid-cols-2 gap-3">
            <Detail icon={Briefcase} label="Type" value={listing.opportunity_type} />
            <Detail icon={GraduationCap} label="Field of study" value={listing.field_of_study} />
            <Detail
              icon={Calendar}
              label="Closing date"
              value={formatDate(listing.closing_date)}
              sub={closingLabel(listing.closing_date)}
            />
            <Detail icon={MapPin} label="Province" value={listing.province || "Nationwide"} />
            {listing.minimum_average != null && (
              <Detail icon={TrendingUp} label="Minimum average" value={`${listing.minimum_average}%`} />
            )}
            {listing.required_qualification && (
              <Detail icon={GraduationCap} label="Required qualification" value={listing.required_qualification} />
            )}
            {listing.year_level_required && (
              <Detail icon={GraduationCap} label="Year level" value={`Year ${listing.year_level_required}`} />
            )}
            {listing.eligibility_type && (
              <Detail icon={ShieldCheck} label="Eligibility" value={listing.eligibility_type} />
            )}
          </section>

          <section>
            <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <FileText size={11} />
                Description
              </span>
            </h3>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink/85">
              {listing.description}
            </p>
          </section>
        </div>

        <footer className="border-t border-black/5 bg-white px-7 py-4">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-ink/70 hover:bg-gray-bg hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onVerify}
              disabled={verifying}
              className="inline-flex items-center gap-1.5 rounded-md bg-ink px-5 py-2 text-sm font-medium text-white hover:bg-ink/90 disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              {verifying ? "Verifying..." : "Verify listing"}
            </button>
          </div>
        </footer>
      </aside>

    </div>
  );
}

function Detail({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl bg-gray-bg/60 p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
        {Icon && <Icon size={10} />}
        {label}
      </p>
      <p className="mt-1 text-[13.5px] font-medium">{value}</p>
      {sub && <p className="mt-0.5 text-[11.5px] text-muted">{sub}</p>}
    </div>
  );
}
