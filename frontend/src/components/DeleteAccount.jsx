import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Lock, Trash2, X } from "lucide-react";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

// FR30: self-service account deletion for students and providers.
// `role` only changes the wording of what gets deleted.
const WHAT_GOES = {
  student: "your profile, uploaded documents, applications, bookmarks and notifications",
  provider: "your company profile, every listing you posted, and the applications to those listings",
};

export default function DeleteAccount({ role = "student" }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-8 rounded-xl2 border border-[#C24A3A]/25 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-[#C24A3A]">
            <AlertTriangle size={16} /> Delete account
          </h2>
          <p className="mt-1.5 text-[13px] text-muted">
            Permanently removes {WHAT_GOES[role]}. This can't be undone. You can sign up again later with the same
            email address.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border border-[#C24A3A] px-4 py-2 text-sm font-medium text-[#C24A3A] hover:bg-[#C24A3A] hover:text-white"
        >
          <Trash2 size={15} /> Delete my account
        </button>
      </div>
      {open && <ConfirmDialog role={role} onClose={() => setOpen(false)} />}
    </section>
  );
}

function ConfirmDialog({ role, onClose }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function handleDelete(e) {
    e.preventDefault();
    if (!password || !understood || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.deleteAccount(password);
      // The token no longer exists on the server; clear it locally too.
      await signOut();
      navigate("/login", {
        replace: true,
        state: { flash: "Your account has been deleted. You can sign up again with the same email at any time." },
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm anim-fade" onClick={busy ? undefined : onClose} />
      <form
        onSubmit={handleDelete}
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl anim-fade-scale"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-medium">Delete your account?</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-full p-1 text-muted hover:bg-gray-bg hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-2 text-[13px] text-muted">
          This permanently deletes {WHAT_GOES[role]}. Enter your password to confirm.
        </p>

        {error && <div className="mt-4 rounded-md bg-amber-bg px-3.5 py-2.5 text-xs text-[#966B1F]">{error}</div>}

        <label className="mb-2 mt-5 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink/60">
          Password
        </label>
        <div className="flex h-11 items-center gap-2.5 rounded-md border border-black/10 px-3.5 text-sm focus-within:border-ink">
          <Lock size={15} className="shrink-0 text-muted" />
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[13px]">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            className="mt-0.5 accent-[#C24A3A]"
          />
          <span>I understand this can't be undone.</span>
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-md px-4 py-2 text-sm font-medium text-ink/70 hover:bg-gray-bg hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!password || !understood || busy}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#C24A3A] px-4 py-2 text-sm font-medium text-white hover:bg-[#A93D2F] disabled:opacity-50"
          >
            <Trash2 size={15} />
            {busy ? "Deleting..." : "Delete account"}
          </button>
        </div>
      </form>
    </div>
  );
}
