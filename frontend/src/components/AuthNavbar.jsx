import { Link } from "react-router-dom";
import { Mark } from "./Logo.jsx";

// Header for the login and sign-up pages: the same logo + white pill
// as the landing page navbar, so moving between them feels seamless.
const PILL_LINK =
  "rounded-md px-3 py-2 text-[12.5px] font-medium uppercase tracking-[0.14em] transition-colors sm:px-4";

export default function AuthNavbar({ current }) {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between px-4 pt-4 sm:px-6 md:px-10 md:pt-5">
      <Link to="/" aria-label="Scout home" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-white">
        <Mark size={32} className="ring-2 ring-white/90" />
        <span className="text-[19px] font-medium tracking-tight">Scout</span>
      </Link>

      <nav className="flex items-center gap-1 rounded-lg bg-white p-1.5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
        <Link to="/" className={`${PILL_LINK} hidden text-ink/80 hover:text-ink sm:inline-block`}>
          Back to website
        </Link>
        {current === "login" ? (
          <Link to="/register" className={`${PILL_LINK} bg-ink text-white hover:bg-ink-soft`}>
            Create account
          </Link>
        ) : (
          <Link to="/login" className={`${PILL_LINK} bg-ink text-white hover:bg-ink-soft`}>
            Log in
          </Link>
        )}
      </nav>
    </header>
  );
}
