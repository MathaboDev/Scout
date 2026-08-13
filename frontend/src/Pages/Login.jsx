import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import AuthNavbar from "../components/AuthNavbar.jsx";
import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

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
      const redirectTo = location.state?.from || "/profile";
      navigate(redirectTo);
    } catch (err) {
      setError(err.message || "Could not log you in. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-cream px-6 py-12">
      <AuthNavbar current="login" />
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-[420px] rounded-2xl border border-line bg-white p-11 shadow-sm"
      >
        <h2 className="text-center text-[22px] font-bold">Welcome back</h2>
        <p className="mb-6 text-center text-[13px] text-muted">
          Sign in to continue to your dashboard.
        </p>

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-[10px] bg-amber-bg px-3.5 py-3 text-xs text-[#966B1F]">
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
        <label className="mb-1.5 block text-xs font-semibold text-ink">Password</label>
        <div className="mb-1.5 flex items-center gap-2.5 rounded-[10px] border-[1.5px] border-line bg-white px-3.5 py-3 text-sm focus-within:border-ink">
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

        <div className="mb-5 text-right">
          <button type="button" className="text-[13px] font-bold text-lime-ink hover:underline">
            Forgot password?
          </button>
        </div>

        <Button type="submit" variant="dark" full disabled={submitting}>
          {submitting ? "Signing in..." : "Log in"}
        </Button>

        <p className="mt-5 text-center text-[13px] text-muted">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-bold text-lime-ink hover:underline"
          >
            Sign up
          </button>
        </p>
      </form>
    </div>
  );
}
