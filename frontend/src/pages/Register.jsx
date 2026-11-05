import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { User, Mail, Lock, AlertCircle, Building2, Briefcase, MapPin, Phone, ShieldCheck, RefreshCw } from "lucide-react";
import AuthLayout from "../components/AuthLayout.jsx";
import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";
import { HOME_FOR_ROLE } from "../components/RequireAuth.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { PROVINCE_OPTIONS } from "../lib/constants.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const asProvider = new URLSearchParams(location.search).get("as") === "provider";
  const { signIn } = useAuth();

  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    industry: "",
    province: "",
    phone: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  // OTP (email verification) step after registration.
  const [otpStep, setOtpStep] = useState(false);
  const [otpId, setOtpId] = useState(null);
  const [resendToken, setResendToken] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const otpInputRef = useRef(null);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const next = {};
    if (asProvider) {
      if (!form.company_name.trim()) next.company_name = "Enter the company name.";
      if (!form.industry.trim()) next.industry = "Enter your industry.";
      if (!form.province) next.province = "Select a province.";
    } else {
      if (!form.full_name.trim()) next.full_name = "Enter your full name.";
    }
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
      const payload = asProvider
        ? {
            role: "provider",
            company_name: form.company_name,
            industry: form.industry,
            province: form.province,
            phone: form.phone,
            email: form.email,
            password: form.password,
            confirm_password: form.confirm_password,
          }
        : {
            full_name: form.full_name,
            email: form.email,
            password: form.password,
            confirm_password: form.confirm_password,
          };
      const data = await api.register(payload);
      if (data.requires_verification) {
        setOtpId(data.otp_id);
        setResendToken(data.resend_token);
        setOtpMessage(data.message || "");
        setOtpStep(true);
        setTimeout(() => otpInputRef.current?.focus(), 50);
      }
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setServerError("");
    setOtpMessage("");
    if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      setServerError("Enter the six-digit code from your email.");
      return;
    }
    setVerifying(true);
    try {
      const data = await api.verifyOtp({ otp_id: otpId, otp_code: otpCode });
      signIn(data.token, data.user);
      navigate(HOME_FOR_ROLE[data.user.role] || "/", { replace: true });
    } catch (err) {
      setServerError(err.message || "Verification failed. Please try again.");
      setOtpCode("");
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setServerError("");
    setOtpMessage("");
    setResending(true);
    try {
      const data = await api.resendOtp({ otp_id: otpId, resend_token: resendToken });
      setOtpId(data.otp_id);
      setResendToken(data.resend_token);
      setOtpCode("");
      setOtpMessage(data.message || "A new code has been sent.");
      otpInputRef.current?.focus();
    } catch (err) {
      setServerError(err.message || "Could not resend the code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  if (otpStep) {
    return (
      <AuthLayout
        current="register"
        headline="Check your email"
        tag={asProvider ? "Provider sign up" : "Sign up"}
        title="Verify your email"
        subtitle={`We sent a six-digit code to ${form.email}.`}
      >
        <form onSubmit={handleVerify} noValidate>
          {serverError && (
            <div className="mb-5 flex items-start gap-2 rounded-md bg-amber-bg px-3.5 py-3 text-xs text-[#966B1F]">
              <AlertCircle size={15} className="mt-px shrink-0" />
              <span>{serverError}</span>
            </div>
          )}
          {otpMessage && !serverError && (
            <div className="mb-5 flex items-start gap-2 rounded-md bg-emerald-50 px-3.5 py-3 text-xs text-emerald-700">
              <ShieldCheck size={15} className="mt-px shrink-0" />
              <span>{otpMessage}</span>
            </div>
          )}

          <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink/60">
            Verification code
          </label>
          <div className="mb-6 flex h-12 items-center gap-2.5 rounded-md border border-black/10 bg-white px-3.5 text-sm transition-colors focus-within:border-ink">
            <ShieldCheck size={16} className="shrink-0 text-muted" />
            <input
              ref={otpInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              className="w-full bg-transparent text-ink outline-none placeholder:text-[#A6A59D] tracking-[0.3em] text-center text-lg font-medium"
            />
          </div>

          <Button type="submit" variant="dark" full disabled={verifying}>
            {verifying ? "Verifying..." : "Verify & continue"}
          </Button>

          <div className="mt-5 text-center text-[13px] text-muted">
            Didn't get the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center gap-1 font-medium text-ink underline underline-offset-4 hover:no-underline disabled:opacity-50 disabled:no-underline"
            >
              <RefreshCw size={13} className={resending ? "animate-spin" : ""} />
              {resending ? "Sending..." : "Resend code"}
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      current="register"
      headline={asProvider ? "Post. Verify. Hire." : "One profile. Every opportunity."}
      blurb={
        asProvider
          ? "Set up your company account to post listings and review applicants once an admin verifies them."
          : "Upload your documents once, get matched to what you qualify for, and track every application in one place."
      }
      tag={asProvider ? "Provider sign up" : "Sign up"}
      title={asProvider ? "Create your company account" : "Create your account"}
      subtitle={
        asProvider
          ? "A platform admin verifies every listing before students see it."
          : "Takes about two minutes. You will add academic details next."
      }
    >
      <form onSubmit={handleSubmit} noValidate>

        {serverError && (
          <div className="mb-5 flex items-start gap-2 rounded-md bg-amber-bg px-3.5 py-3 text-xs text-[#966B1F]">
            <AlertCircle size={15} className="mt-px shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {asProvider ? (
          <>
            <FormField
              label="Company name"
              icon={Building2}
              placeholder="e.g. ByteWorks"
              value={form.company_name}
              onChange={(e) => update("company_name", e.target.value)}
              error={errors.company_name}
            />
            <FormField
              label="Industry"
              icon={Briefcase}
              placeholder="e.g. Software, Finance, Mining"
              value={form.industry}
              onChange={(e) => update("industry", e.target.value)}
              error={errors.industry}
            />
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink/60">Province</label>
            <div className="mb-5 flex h-12 items-center gap-2.5 rounded-md border border-black/10 bg-white px-3.5 text-sm transition-colors focus-within:border-ink">
              <MapPin size={16} className="shrink-0 text-muted" />
              <select
                value={form.province}
                onChange={(e) => update("province", e.target.value)}
                className="w-full bg-transparent text-ink outline-none"
              >
                <option value="">Select a province</option>
                {PROVINCE_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            {errors.province && <p className="mb-3 -mt-3 text-[11.5px] text-red-600">{errors.province}</p>}
            <FormField
              label="Phone (optional)"
              icon={Phone}
              placeholder="e.g. 021 000 0000"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </>
        ) : (
          <FormField
            label="Full name"
            icon={User}
            placeholder="e.g. Tumelo Mahlangu"
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            error={errors.full_name}
          />
        )}

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
            onClick={() => navigate(asProvider ? "/login?as=provider" : "/login")}
            className="font-medium text-ink underline underline-offset-4 hover:no-underline"
          >
            Log in
          </button>
        </p>

        <p className="mt-2 text-center text-[13px] text-muted">
          {asProvider ? (
            <>
              Looking for opportunities?{" "}
              <Link to="/register" className="font-medium text-ink underline underline-offset-4 hover:no-underline">
                Student sign up
              </Link>
            </>
          ) : (
            <>
              Hiring?{" "}
              <Link to="/register?as=provider" className="font-medium text-ink underline underline-offset-4 hover:no-underline">
                Provider sign up
              </Link>
            </>
          )}
        </p>
      </form>
    </AuthLayout>
  );
}
