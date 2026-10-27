import AuthNavbar from "./AuthNavbar.jsx";
import { FluidGradient, SectionTag } from "./landing.jsx";

// Page frame for login + sign up, in the landing page style:
// fluid gradient panel with a big headline, and the form on a light card.
// Desktop: gradient on the left half. Phone: gradient banner on top,
// with the card overlapping it.
export default function AuthLayout({ current, headline, blurb, tag, title, subtitle, children }) {
  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white lg:grid lg:grid-cols-[1.05fr_1fr]">
      <AuthNavbar current={current} />

      <aside className="relative h-[320px] overflow-hidden rounded-b-[28px] lg:sticky lg:top-0 lg:h-screen lg:rounded-b-none lg:rounded-r-[28px]">
        <FluidGradient />
        <div className="relative flex h-full flex-col justify-end px-6 pb-14 sm:px-8 lg:p-12">
          <h1 className="max-w-[13ch] text-[clamp(2.25rem,4.6vw,4.75rem)] font-medium leading-[1.04] tracking-[-0.025em]">
            {headline}
          </h1>
          {blurb && <p className="mt-6 hidden max-w-sm text-lg leading-snug text-white/90 lg:block">{blurb}</p>}
        </div>
      </aside>

      <main className="relative -mt-8 flex justify-center px-4 pb-12 lg:mt-0 lg:items-center lg:px-12 lg:py-28">
        <div className="w-full max-w-[460px] rounded-2xl bg-[#F8F8F8] p-7 text-ink sm:p-10">
          {tag && <SectionTag light>{tag}</SectionTag>}
          {title && <h2 className="mt-5 text-3xl font-medium tracking-tight">{title}</h2>}
          {subtitle && <p className="mb-7 mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
