import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, MailCheck, AlertCircle } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
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
    if (form.password.length < 10) next.password = "Use at least 10 characters.";
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
      <AuthLayout current="register" headline="You're in. Let's find what fits." tag="Sign up">
        <div className="text-center">
          <MailCheck size={30} className="mx-auto mb-4 mt-4 text-ink" />
          <h2 className="text-3xl font-medium tracking-tight">Account created</h2>
          <p className="mt-2.5 text-sm leading-relaxed text-muted">
            Your account for <strong className="text-ink">{form.email}</strong> is ready.
            Log in to build your profile and upload your documents.
          </p>
          <Button to="/login" variant="dark" full className="mt-7">
            Go to log in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      current="register"
      headline="One profile. Every opportunity."
      blurb="Upload your documents once, get matched to what you qualify for, and track every application in one place."
      tag="Sign up"
      title="Create your account"
      subtitle="Takes about two minutes. You will add academic details next."
    >
      <form onSubmit={handleSubmit} noValidate>

        {serverError && (
          <div className="mb-5 flex items-start gap-2 rounded-md bg-amber-bg px-3.5 py-3 text-xs text-[#966B1F]">
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

        <p className="mt-4 text-center text-[11.5px] text-muted">
          Use at least 10 characters for your password.
        </p>

        <p className="mt-6 text-center text-[13px] text-muted">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-medium text-ink underline underline-offset-4 hover:no-underline"
          >
            Log in
          </button>
        </p>

        <p className="mt-2 text-center text-[13px] text-muted">
          Hiring?{" "}
          <Link to="/login?as=provider" className="font-medium text-ink underline underline-offset-4 hover:no-underline">
            Provider log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
