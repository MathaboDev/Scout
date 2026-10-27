import { BellRing, Compass, Eye, FileCheck2, Lock, ScanSearch, Send, Trash2, UserRound } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { CtaPair, FluidGradient, SectionTag } from "../components/landing.jsx";

// Public landing page. Sections, top to bottom:
//   hero (fluid gradient) -> our offer -> three feature panels ->
//   how it works (three steps) -> data & POPIA -> call to action -> footer
// The only "functionality" here is links: /register, /login and the
// #how / #privacy anchors used by the navbar.

const FEATURES = [
  {
    icon: ScanSearch,
    name: "Eligibility matching",
    desc: "Every listing is checked against your field, average, year and province before it reaches your feed.",
  },
  {
    icon: FileCheck2,
    name: "Assisted apply",
    desc: "Your profile pre-fills the form. You review every field before anything is sent.",
  },
  {
    icon: BellRing,
    name: "Live tracking",
    desc: "Status changes land on your watchlist, plus a nudge three days before a saved listing closes.",
  },
];

// panel backgrounds, left to right (first one light, like the reference)
const PANEL_STYLES = [
  "bg-[#F8F8F8] text-ink",
  "bg-[#1F1F1F] text-white",
  "bg-[#171717] text-white",
];

const STEPS = [
  {
    icon: UserRound,
    tag: "Profile",
    title: "Build one profile",
    desc: "Field of study, institution, year or qualification and average, plus your CV and matric certificate. Once.",
  },
  {
    icon: Compass,
    tag: "Match",
    title: "Get matched, not flooded",
    desc: "Switch between what you qualify for and everything that's open. Expired listings disappear on their own.",
  },
  {
    icon: Send,
    tag: "Apply",
    title: "Apply, then forget the tab",
    desc: "Confirm the pre-filled review screen, get a reference number, and let your watchlist chase the outcome.",
  },
];

const PRIVACY_POINTS = [
  {
    icon: Eye,
    title: "You can see what's stored",
    desc: "Every field Scout holds on you is visible in your account at any time.",
  },
  {
    icon: Lock,
    title: "Only what an application needs",
    desc: "No ID numbers, banking, health or address details. Providers only see your professional profile.",
  },
  {
    icon: Trash2,
    title: "You stay in control",
    desc: "In line with POPIA (Act 4 of 2013), you can restrict or delete your personal data whenever you choose.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      {/* ---------- HERO ---------- */}
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden rounded-b-[28px]">
        <FluidGradient />
        <div className="relative flex flex-1 flex-col justify-between px-6 pb-10 pt-36 sm:px-8 md:px-10 md:pb-12 md:pt-[22vh]">
          <h1 className="max-w-[15ch] text-[clamp(3rem,7.4vw,7rem)] font-medium leading-[1.02] tracking-[-0.025em]">
            We find what fits for you.
          </h1>
          <div className="mt-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p className="max-w-[34rem] text-lg leading-snug text-white/90 md:text-[22px]">
              The one-profile platform for South African students to find, apply for and track
              internships, learnerships and graduate programmes faster than ever.
            </p>
            <CtaPair label="Create your profile" to="/register" />
          </div>
        </div>
      </section>

      {/* ---------- OUR OFFER ---------- */}
      <section className="grid gap-10 px-6 py-24 sm:px-8 md:grid-cols-[1fr_1.25fr] md:px-10 md:py-32">
        <div className="md:sticky md:top-28 md:self-start">
          <SectionTag>Our offer</SectionTag>
        </div>
        <div>
          <h2 className="text-[clamp(2.25rem,4.4vw,4rem)] font-medium leading-[1.08] tracking-[-0.02em]">
            Everything you need to get hired, that actually moves{" "}
            <span className="text-white/40">your career forward.</span>
          </h2>
          <p className="mt-10 max-w-[30rem] text-[17px] leading-relaxed text-white/60">
            Scout replaces the patchwork of company portals, re-typed forms and inbox refreshing with
            a single profile where every application flows from match to outcome. Matching hides what
            you don't qualify for, assisted apply pre-fills every form, and live tracking tells you the
            moment a provider updates your status.
          </p>
          <div className="mt-10">
            <CtaPair label="Discover how it works" href="#how" />
          </div>
        </div>
      </section>

      {/* ---------- FEATURE PANELS ---------- */}
      <section className="grid md:grid-cols-3">
        {FEATURES.map((f, i) => (
          <article
            key={f.name}
            className={`flex min-h-[340px] flex-col justify-between p-10 md:min-h-[380px] md:p-12 ${PANEL_STYLES[i]}`}
          >
            <div className="flex items-start justify-between">
              <f.icon size={58} strokeWidth={1.1} />
              <span className="text-[11px] tracking-[0.2em] opacity-60">0{i + 1}.</span>
            </div>
            <div>
              <h3 className="text-[26px] font-medium tracking-tight">{f.name}</h3>
              <p className="mt-3 max-w-[24rem] text-[15px] leading-relaxed opacity-70">{f.desc}</p>
            </div>
          </article>
        ))}
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how" className="scroll-mt-20 px-6 py-24 sm:px-8 md:px-10 md:py-32">
        <div className="grid gap-10 md:grid-cols-[1fr_1.25fr]">
          <div className="md:sticky md:top-28 md:self-start">
            <SectionTag>How it works</SectionTag>
          </div>
          <div>
            <h2 className="text-[clamp(2.25rem,4.4vw,4rem)] font-medium leading-[1.08] tracking-[-0.02em]">
              Scout is built on three simple steps.
            </h2>
            <p className="mt-8 max-w-[34rem] text-xl font-light leading-relaxed text-white/60">
              Each one carries part of the journey, turning the frustrating effort of hunting for jobs into a
              single, continuous motion.
            </p>
          </div>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => {
            const light = i === 0;
            return (
              <article
                key={s.title}
                className={`flex min-h-[360px] flex-col justify-between rounded-2xl p-8 ${
                  light ? "bg-[#F8F8F8] text-ink" : "bg-[#141414] text-white"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-md ${
                    light ? "bg-black/[0.08]" : "bg-white/[0.08]"
                  }`}
                >
                  <s.icon size={19} strokeWidth={1.6} />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] opacity-50">
                    0{i + 1} — {s.tag}
                  </p>
                  <h3 className="mt-3 text-[26px] font-medium tracking-tight">{s.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed opacity-60">{s.desc}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ---------- DATA & POPIA ---------- */}
      <section id="privacy" className="scroll-mt-20 px-6 pb-24 sm:px-8 md:px-10 md:pb-32">
        <div className="grid gap-10 md:grid-cols-[1fr_1.25fr]">
          <div className="md:sticky md:top-28 md:self-start">
            <SectionTag>Data &amp; POPIA</SectionTag>
          </div>
          <h2 className="text-[clamp(2.25rem,4.4vw,4rem)] font-medium leading-[1.08] tracking-[-0.02em]">
            Your profile only ever holds what an <span className="text-white/40">application needs.</span>
          </h2>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {PRIVACY_POINTS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-white/10 p-8">
              <p.icon size={22} strokeWidth={1.5} className="text-white/80" />
              <h3 className="mt-10 text-xl font-medium">{p.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/55">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CALL TO ACTION ---------- */}
      <section className="px-4 pb-16 sm:px-6 md:px-10">
        <div className="relative flex min-h-[520px] flex-col justify-between overflow-hidden rounded-3xl p-8 sm:p-12 md:px-14 md:py-16">
          <FluidGradient />
          <h2 className="relative max-w-[14ch] text-[clamp(2.75rem,5.6vw,5.25rem)] font-medium leading-[1.04] tracking-[-0.025em]">
            Upload once, apply everywhere.
          </h2>
          <div className="relative mt-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p className="max-w-[30rem] text-lg font-light leading-snug text-white/90 md:text-[26px]">
              Set up your profile in minutes. Your documents are reused for every application, no
              re-typing, no friction.
            </p>
            <CtaPair label="Get started" to="/register" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
