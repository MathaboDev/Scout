import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, MailCheck, AlertCircle } from "lucide-react";
import AuthNavbar from "../components/AuthNavbar.jsx";
import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";
import { api } from "../lib/api.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [sent, setSent] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const next = {};
    if (!form.full_name.trim()) next.full_name = "Enter your full name.";
    if (!EMAIL_RE.test(form.email)) next.email = "Enter a valid email address.";
    if (form.password.length < 8) next.password = "Use at least 8 characters.";
    if (form.confirm_password !== form.password) next.confirm_password = "Passwords don't match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.register(form);
      setSent(true);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-cream px-6 py-12">
        <AuthNavbar current="register" />
        <div className="w-full max-w-[420px] rounded-2xl border border-line bg-white p-11 text-center shadow-sm">
          <MailCheck size={30} className="mx-auto mb-4 mt-8 text-lime-ink" />
          <h2 className="text-xl font-bold">Check your inbox</h2>
          <p className="mt-2.5 text-sm leading-relaxed text-muted">
            We've sent a verification link to <strong className="text-ink">{form.email}</strong>.
            Confirm it before you build your profile or apply to anything.
          </p>
          <Button to="/login" variant="dark" full className="mt-7">
            Go to log in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-cream px-6 py-12">
      <AuthNavbar current="register" />
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-[460px] rounded-2xl border border-line bg-white p-11 shadow-sm"
      >
        <h2 className="text-center text-[22px] font-bold">Create your account</h2>
        <p className="mb-6 text-center text-[13px] text-muted">
          Takes about two minutes. You will add academic details next.
        </p>

        {serverError && (
          <div className="mb-5 flex items-start gap-2 rounded-[10px] bg-amber-bg px-3.5 py-3 text-xs text-[#966B1F]">
            <AlertCircle size={15} className="mt-px shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <FormField
          label="Full name"
          icon={User}
          placeholder="e.g. Tumelo Mahlangu"
          value={form.full_name}
          onChange={(e) => update("full_name", e.target.value)}
          error={errors.full_name}
        />
        <FormField
          label="Email address"
          icon={Mail}
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          error={errors.email}
        />
        <div className="grid grid-cols-1 gap-x-3.5 sm:grid-cols-2">
          <FormField
            label="Password"
            icon={Lock}
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            error={errors.password}
          />
          <FormField
            label="Confirm password"
            icon={Lock}
            type="password"
            placeholder="••••••••"
            value={form.confirm_password}
            onChange={(e) => update("confirm_password", e.target.value)}
            error={errors.confirm_password}
          />
        </div>

        <Button type="submit" variant="dark" full disabled={submitting} className="mt-1.5">
          {submitting ? "Creating account..." : "Create account"}
        </Button>

        <div className="mt-5 flex items-start gap-2 rounded-[10px] bg-gray-bg px-3.5 py-3 text-[11.5px] leading-relaxed text-muted">
          <MailCheck size={15} className="mt-px shrink-0" />
          <span>
            We'll send a verification link to your email. You'll need to
            confirm it before applying to anything.
          </span>
        </div>

        <p className="mt-5 text-center text-[13px] text-muted">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-bold text-lime-ink hover:underline"
          >
            Log in
          </button>
        </p>
      </form>
    </div>
  );
}
