import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";
import { HOME_FOR_ROLE } from "../components/RequireAuth.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

// Only follow a "from" redirect if it belongs to the role that just logged in.
function destinationFor(role, from) {
  const providerPath = from?.startsWith("/provider");
  if (from && role === "provider" && providerPath) return from;
  if (from && role === "student" && !providerPath) return from;
  return HOME_FOR_ROLE[role] || "/";
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await api.login({ email, password });
      signIn(data.token, data.user);
      navigate(destinationFor(data.user.role, location.state?.from), { replace: true });
    } catch (err) {
      setError(err.message || "Could not log you in. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      current="login"
      headline="Good to see you again."
      blurb="Pick up where you left off: new matches, saved listings and live application statuses."
      tag="Log in"
      title="Welcome back"
      subtitle="Students and providers both sign in here."
    >
      <form onSubmit={handleSubmit} noValidate>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-md bg-amber-bg px-3.5 py-3 text-xs text-[#966B1F]">
            <AlertCircle size={15} className="mt-px shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <FormField
          label="Email address"
          icon={Mail}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink/60">Password</label>
        <div className="mb-6 flex h-12 items-center gap-2.5 rounded-md border border-black/10 bg-white px-3.5 text-sm transition-colors focus-within:border-ink">
          <Lock size={16} className="shrink-0 text-muted" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-transparent text-ink outline-none placeholder:text-[#A6A59D]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="shrink-0 text-muted hover:text-ink"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <Button type="submit" variant="dark" full disabled={submitting}>
          {submitting ? "Signing in..." : "Log in"}
        </Button>

        <p className="mt-6 text-center text-[13px] text-muted">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-medium text-ink underline underline-offset-4 hover:no-underline"
          >
            Sign up
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
