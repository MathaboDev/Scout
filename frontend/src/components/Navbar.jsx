import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mark } from "./Logo.jsx";

// Landing page header: fixed to the top of the screen.
// Over the hero the logo sits straight on the gradient; once the visitor
// scrolls past ~80% of the screen it gets a white box, so it stays readable
// over the dark sections. `scrolled` is React state that the scroll
// listener updates.
const LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Privacy", href: "#privacy" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll); // tidy up when leaving the page
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex items-start justify-between px-4 pt-4 sm:px-6 md:px-10 md:pt-5">
      <Link
        to="/"
        aria-label="Scout home"
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors duration-300 ${
          scrolled ? "bg-white text-ink" : "bg-transparent text-white"
        }`}
      >
        <Mark size={32} className={scrolled ? "" : "ring-2 ring-white/90"} />
        <span className="text-[19px] font-medium tracking-tight">Scout</span>
      </Link>

      <nav className="flex items-center gap-1 rounded-lg bg-white p-1.5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="hidden rounded-md px-4 py-2 text-[12.5px] font-medium uppercase tracking-[0.14em] text-ink/80 transition-colors hover:text-ink md:inline-block"
          >
            {l.label}
          </a>
        ))}
        <Link
          to="/login?as=provider"
          className="hidden rounded-md px-4 py-2 text-[12.5px] font-medium uppercase tracking-[0.14em] text-ink/80 transition-colors hover:text-ink lg:inline-block"
        >
          For providers
        </Link>
        <Link
          to="/login"
          className="rounded-md px-3 py-2 text-[12.5px] font-medium uppercase tracking-[0.14em] text-ink/80 transition-colors hover:text-ink sm:px-4"
        >
          Log in
        </Link>
        <Link
          to="/register"
          className="rounded-md bg-ink px-3 py-2 text-[12.5px] font-medium uppercase tracking-[0.14em] text-white transition-colors hover:bg-ink-soft sm:px-4"
        >
          Get started
        </Link>
      </nav>
    </header>
  );
}
