import Logo from "./Logo.jsx";

export default function Footer() {
  return (
    <footer className="bg-ink px-6 py-14 text-white/60 md:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Logo variant="light" />
          <p className="mt-4 text-sm leading-relaxed">
            Built by and for South African students, one profile, matched
            automatically, tracked in one place.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
          <div>
            <p className="mb-3 font-display font-semibold text-white">Platform</p>
            <ul className="space-y-2">
              <li><a href="#why-scout" className="hover:text-lime">How it works</a></li>
              <li><a href="/register" className="hover:text-lime">Create a profile</a></li>
              <li><span className="text-white/30">Opportunity listings, soon</span></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-display font-semibold text-white">Trust</p>
            <ul className="space-y-2">
              <li><a href="#privacy" className="hover:text-lime">Data &amp; POPIA</a></li>
              <li><span className="text-white/30">Verified listings only</span></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-display font-semibold text-white">Account</p>
            <ul className="space-y-2">
              <li><a href="/login" className="hover:text-lime">Log in</a></li>
              <li><a href="/register" className="hover:text-lime">Sign up</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-ink-line pt-6 text-xs text-white/30">
        © {new Date().getFullYear()} Scout. A student capstone project, not yet a registered service provider.
      </div>
    </footer>
  );
}
