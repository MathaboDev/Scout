import {
  BellRing,
  CheckCircle2,
  Compass,
  Eye,
  FileCheck2,
  FileText,
  Lock,
  Send,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import {
  CtaPair,
  FluidGradient,
  ScrollProgress,
  SectionTag,
  TileCollage,
} from "../components/landing.jsx";
import { Reveal } from "../lib/useReveal.js";

// Six touchpoints the student actually experiences, pictured in the About
// tile grid. The icons & labels pair by index with COLLAGE_TILES positions
// in components/landing.jsx.
const COLLAGE_LABELS = [
  "Profile set up",
  "Documents attached",
  "Matched to you",
  "Review before submit",
  "Status tracked live",
  "Outcome received",
];
const COLLAGE_ICONS = [UserRound, FileText, Sparkles, FileCheck2, BellRing, CheckCircle2];

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
    title: "Apply, then track it live",
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
    <div className="min-h-screen overflow-x-hidden bg-[#0A0A0A] text-white">
      <ScrollProgress />
      <Navbar />

      {/* ---------- HERO ---------- */}
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden rounded-b-[28px]">
        <FluidGradient />
        <div className="relative flex flex-1 flex-col justify-between px-6 pb-10 pt-36 sm:px-8 md:px-10 md:pb-12 md:pt-[22vh]">
          <h1 className="max-w-[15ch] text-[clamp(3rem,7.4vw,7rem)] font-medium leading-[1.02] tracking-[-0.025em] anim-fade-up">
            We find what <span className="text-shine">fits</span> for you.
          </h1>
          <div className="mt-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p className="max-w-[34rem] text-lg leading-snug text-white/90 md:text-[22px] anim-fade-up anim-delay-4">
              The one-profile platform for South African students to find, apply for and
              track internships, learnerships and graduate programmes faster than ever.
            </p>
            <div className="anim-fade-up anim-delay-5">
              <CtaPair label="Create your profile" to="/register" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- ABOUT ---------- */}
      <section id="about" className="scroll-mt-20 px-6 py-28 sm:px-8 md:px-10 md:py-36">
        <div className="mx-auto grid max-w-7xl gap-14 md:grid-cols-[1fr_1.15fr] md:items-center md:gap-16">
          <div>
            <Reveal>
              <SectionTag>About Scout</SectionTag>
            </Reveal>
            <Reveal
              as="h2"
              delay={1}
              className="mt-6 text-[clamp(2.25rem,4.4vw,4rem)] font-medium leading-[1.06] tracking-[-0.025em]"
            >
              One profile.{" "}
              <span className="text-white/40">Every opportunity.</span>
            </Reveal>
            <Reveal
              as="p"
              delay={2}
              className="mt-7 max-w-md text-[17px] leading-relaxed text-white/60"
            >
              Scout replaces the patchwork of company portals, re-typed forms and inbox
              refreshing with a single place where every application flows from match to
              outcome. Six moments. One continuous rhythm.
            </Reveal>
            <Reveal delay={3} className="mt-10">
              <CtaPair label="Get started" to="/register" />
            </Reveal>
          </div>

          <TileCollage labels={COLLAGE_LABELS} icons={COLLAGE_ICONS} />
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how" className="scroll-mt-20 border-t border-white/5 px-6 py-24 sm:px-8 md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-[1fr_1.25fr]">
            <Reveal className="md:sticky md:top-28 md:self-start">
              <SectionTag>How it works</SectionTag>
            </Reveal>
            <div>
              <Reveal
                as="h2"
                className="text-[clamp(2.25rem,4.4vw,4rem)] font-medium leading-[1.08] tracking-[-0.02em]"
              >
                Three simple steps.
              </Reveal>
              <Reveal
                as="p"
                delay={1}
                className="mt-8 max-w-[34rem] text-xl font-light leading-relaxed text-white/60"
              >
                Each one carries part of the journey, turning the frustrating effort of hunting
                for jobs into a single, continuous motion.
              </Reveal>
            </div>
          </div>

          <div className="mt-20 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => {
              const light = i === 0;
              return (
                <Reveal
                  key={s.title}
                  as="article"
                  delay={Math.min(i + 1, 4)}
                  className={`group card-lift flex min-h-[360px] flex-col justify-between rounded-2xl p-8 hover:shadow-[0_18px_50px_-18px_rgba(0,0,0,0.45)] ${
                    light ? "bg-[#F8F8F8] text-ink" : "bg-[#141414] text-white"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-md transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110 ${
                      light ? "bg-black/[0.08]" : "bg-white/[0.08]"
                    }`}
                  >
                    <s.icon size={19} strokeWidth={1.6} />
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] opacity-50">
                      0{i + 1} · {s.tag}
                    </p>
                    <h3 className="mt-3 text-[26px] font-medium tracking-tight">{s.title}</h3>
                    <p className="mt-3 text-[15px] leading-relaxed opacity-60">{s.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- DATA & POPIA ---------- */}
      <section id="privacy" className="scroll-mt-20 border-t border-white/5 px-6 py-24 sm:px-8 md:px-10 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-[1fr_1.25fr]">
            <Reveal className="md:sticky md:top-28 md:self-start">
              <SectionTag>Data &amp; POPIA</SectionTag>
            </Reveal>
            <Reveal
              as="h2"
              className="text-[clamp(2.25rem,4.4vw,4rem)] font-medium leading-[1.08] tracking-[-0.02em]"
            >
              Your profile only ever holds what an{" "}
              <span className="text-white/40">application needs.</span>
            </Reveal>
          </div>
          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {PRIVACY_POINTS.map((p, i) => (
              <Reveal
                key={p.title}
                delay={Math.min(i + 1, 4)}
                className="group card-lift rounded-2xl border border-white/10 p-8 hover:border-white/25 hover:bg-white/[0.02]"
              >
                <p.icon
                  size={22}
                  strokeWidth={1.5}
                  className="text-white/80 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:text-white"
                />
                <h3 className="mt-10 text-xl font-medium">{p.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/55">{p.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CALL TO ACTION ---------- */}
      <section className="px-4 pb-16 sm:px-6 md:px-10">
        <div className="relative flex min-h-[460px] flex-col justify-between overflow-hidden rounded-3xl p-8 sm:p-12 md:px-14 md:py-16">
          <FluidGradient />
          <Reveal
            as="h2"
            className="relative max-w-[14ch] text-[clamp(2.75rem,5.6vw,5.25rem)] font-medium leading-[1.04] tracking-[-0.025em]"
          >
            Upload once, apply everywhere.
          </Reveal>
          <div className="relative mt-14 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <Reveal
              as="p"
              delay={1}
              className="max-w-[30rem] text-lg font-light leading-snug text-white/90 md:text-[24px]"
            >
              Set up your profile in minutes. Your documents are reused for every
              application. No re-typing, no friction.
            </Reveal>
            <Reveal delay={2}>
              <CtaPair label="Start now" to="/register" />
            </Reveal>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
