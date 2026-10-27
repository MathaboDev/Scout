import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Bookmark, CheckCircle, Download, Trash2, X } from "lucide-react";
import AppShell from "../components/AppShell.jsx";
import StatusBadge, { StatusTimeline } from "../components/StatusBadge.jsx";
import { CompanyAvatar, SkeletonCard, UrgencyLabel } from "../components/ui.jsx";
import { api } from "../lib/api.js";
import { POLL_INTERVAL_MS, closingLabel, formatDate } from "../lib/constants.js";

// Student dashboard: FR5 (receipts + summary report), FR6 (live status),
// FR7 (bookmarks + notifications).
//
// "Live" = polls the API every 15 s while the tab is visible, which keeps
// status changes inside NFR2's 30-second window without websockets.

export default function Watchlist() {
  const [applications, setApplications] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [notifications, setNotifications] = useState({ unread_count: 0, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const lastStatuses = useRef(null);

  const refreshLive = useCallback(async () => {
    const [apps, notes] = await Promise.all([api.myApplications(), api.notifications()]);

    // Announce any status that changed since the last poll.
    const previous = lastStatuses.current;
    if (previous) {
      const changed = apps.results.find(
        (a) => previous[a.application_id] && previous[a.application_id] !== statusKey(a)
      );
      if (changed) setToast(`${changed.opportunity_title}: ${statusText(changed)}`);
    }
    lastStatuses.current = Object.fromEntries(apps.results.map((a) => [a.application_id, statusKey(a)]));

    setApplications(apps.results);
    setNotifications(notes);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([refreshLive(), api.listBookmarks().then((b) => !cancelled && setBookmarks(b.results))])
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refreshLive().catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [refreshLive]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function openReceipt(applicationId) {
    try {
      setReceipt(await api.getReceipt(applicationId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeBookmark(opportunityId) {
    const before = bookmarks;
    setBookmarks((rows) => rows.filter((b) => b.opportunity_id !== opportunityId));
    try {
      await api.removeBookmark(opportunityId);
    } catch (err) {
      setBookmarks(before);
      setError(err.message);
    }
  }

  async function markAllRead() {
    try {
      await api.markAllNotificationsRead();
      setNotifications((n) => ({
        unread_count: 0,
        results: n.results.map((r) => ({ ...r, is_read: true })),
      }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function downloadSummary() {
    setDownloading(true);
    try {
      const pdf = await api.applicationSummaryPdf();
      saveFile(pdf, `scout-applications-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  const counts = {
    total: applications.length,
    submitted: applications.filter((a) => a.status === "Submitted").length,
    review: applications.filter((a) => a.status === "Under Review").length,
    outcome: applications.filter((a) => a.status === "Outcome Received").length,
  };

  return (
    <AppShell title="My applications" subtitle="Live status, receipts, bookmarks and notifications in one place.">
      {error && <div className="mt-6 rounded-[10px] bg-amber-bg px-4 py-3 text-sm text-[#966B1F]">{error}</div>}

      {/* ---------- summary tiles + report ---------- */}
      <section className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Total", counts.total],
          ["Submitted", counts.submitted],
          ["Under review", counts.review],
          ["Outcome received", counts.outcome],
        ].map(([label, n]) => (
          <div key={label} className="rounded-2xl border border-line bg-white px-4 py-3">
            <p className="text-3xl font-medium tracking-tight leading-none">{n}</p>
            <p className="mt-1.5 text-xs text-muted">{label}</p>
          </div>
        ))}
      </section>

      {/* ---------- applications (FR6) ---------- */}
      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-medium tracking-tight">Applications</h2>
          <button
            type="button"
            onClick={downloadSummary}
            disabled={downloading || applications.length === 0}
            className="flex h-10 items-center gap-2 rounded-md border border-black/15 bg-white px-4 text-[12px] font-medium uppercase tracking-[0.12em] transition-colors hover:bg-ink hover:text-white disabled:opacity-50"
          >
            <Download size={14} /> {downloading ? "Preparing PDF..." : "Download PDF report"}
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="No applications yet"
            text="Applications you submit will appear here with their live status."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((a) => (
              <article
                key={a.application_id}
                className="flex flex-col rounded-2xl border border-line bg-white p-5"
              >
                <div className="flex items-start gap-3">
                  <CompanyAvatar name={a.company_name} size="sm" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold leading-snug">{a.opportunity_title}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted">{a.company_name}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <StatusBadge status={a.status} outcome={a.outcome_result} />
                </div>
                <p className="mt-3 text-[11px] text-muted">
                  Applied {formatDate(a.submitted_at)} · {a.reference_number}
                </p>
                <button
                  type="button"
                  onClick={() => openReceipt(a.application_id)}
                  className="mt-4 w-full rounded-md border border-ink px-4 py-2 text-[12px] font-medium uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-white"
                >
                  View receipt
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* ---------- bookmarks (FR7) ---------- */}
        <section>
          <h2 className="mb-4 text-xl font-medium tracking-tight">Bookmarked opportunities</h2>
          {bookmarks.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No bookmarks"
              text="Bookmark opportunities you're not ready to apply for. We'll remind you 3 days before they close."
            />
          ) : (
            <ul className="space-y-3">
              {bookmarks.map((b) => (
                <li
                  key={b.bookmark_id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 ${
                    b.is_closed ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <CompanyAvatar name={b.company_name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{b.title}</p>
                      <p className="text-xs text-muted">{b.company_name}</p>
                      <div className="mt-1.5">
                        <UrgencyLabel date={b.closing_date} label={closingLabel(b.closing_date)} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/jobs/${b.opportunity_id}`}
                      className="rounded-md bg-ink px-3.5 py-2 text-[12px] font-medium uppercase tracking-[0.12em] text-white"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeBookmark(b.opportunity_id)}
                      aria-label={`Remove bookmark for ${b.title}`}
                      className="rounded-[10px] p-2 text-muted hover:bg-gray-bg hover:text-ink"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ---------- notifications (FR7) ---------- */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-medium tracking-tight">
              Notifications
              {notifications.unread_count > 0 && (
                <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] text-ink">
                  {notifications.unread_count} new
                </span>
              )}
            </h2>
            {notifications.unread_count > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs font-bold text-muted hover:text-ink">
                Mark all read
              </button>
            )}
          </div>
          {notifications.results.length === 0 ? (
            <EmptyState icon={Bell} title="Nothing yet" text="Submissions, status changes and reminders show up here." />
          ) : (
            <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
              {notifications.results.map((n) => (
                <li key={n.notification_id} className="flex gap-3 p-4">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.is_read ? "bg-transparent" : "bg-lime-ink"}`}
                    aria-hidden="true"
                  />
                  <div>
                    <p className={`text-sm ${n.is_read ? "text-muted" : "font-semibold"}`}>{n.message}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{formatDate(n.sent_at, true)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {receipt && <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl2 bg-ink px-5 py-3.5 text-sm font-semibold text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </AppShell>
  );
}

function statusKey(a) {
  return `${a.status}|${a.outcome_result || ""}`;
}

function statusText(a) {
  return a.status === "Outcome Received" && a.outcome_result ? `Outcome: ${a.outcome_result}` : `now ${a.status}`;
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-6 py-10 text-center">
      <Icon size={22} className="mx-auto text-muted" />
      <h3 className="mt-3 text-sm font-bold">{title}</h3>
      <p className="mx-auto mt-1 max-w-xs text-xs text-muted">{text}</p>
      <Link
        to="/eligible"
        className="mt-4 inline-block rounded-md bg-ink px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] text-white"
      >
        Browse opportunities
      </Link>
    </div>
  );
}

function ReceiptModal({ receipt, onClose }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Application receipt"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Receipt</p>
            <p className="mt-1 text-xl font-medium tracking-tight">{receipt.reference_number}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <dl className="mt-5 divide-y divide-line border-y border-line text-sm">
          {[
            ["Name", receipt.student_name],
            ["Opportunity", receipt.opportunity_title],
            ["Provider", receipt.company_name],
            ["Submitted", formatDate(receipt.submitted_at, true)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted">{label}</dt>
              <dd className="text-right font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5">
          <StatusTimeline status={receipt.status} outcome={receipt.outcome_result} />
        </div>
      </div>
    </div>
  );
}

// FR5: save a file the API returned (the PDF summary report).
// The browser can only "download" a link, so we point a temporary link
// at the file in memory, click it, then free the memory.
function saveFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
