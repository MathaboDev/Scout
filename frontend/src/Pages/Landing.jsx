import {
  Target,
  Zap,
  Radar,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  BellRing,
  Eye,
  Lock,
  Trash2,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import Button from "../components/Button.jsx";
import Marquee from "../components/Marquee.jsx";
import CountUp from "../components/CountUp.jsx";
import RadarPanel from "../components/RadarPanel.jsx";
import FeatureCard from "../components/FeatureCard.jsx";

const MARQUEE_ITEMS = [
  "Eligibility matching",
  "One profile, every application",
  "Deadline reminders",
  "POPIA compliant",
  "Verified listings only",
];

const FEATURES = [
  {
    icon: Target,
    name: "Only see what fits",
    desc: "Listings are checked against the relevant parts of your profile and the provider requirements before they reach your eligible feed.",
  },
  {
    icon: Zap,
    name: "Assisted apply",
    desc: "Your profile pre-fills the form. You review every field before anything is sent. Scout never submits on its own.",
  },
  {
    icon: Radar,
    name: "One dashboard to track",
    desc: "Status changes from providers land on your dashboard automatically, no five-tab portal check-in.",
  },
  {
    icon: BellRing,
    name: "Reminders that matter",
    desc: "A nudge three days before a bookmarked closing date, and the moment an outcome comes in.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Build one profile",
    desc: "Field of study, institution, year or qualification, academic average, plus your CV, matric certificate and optional supporting documents.",
  },
  {
    n: "02",
    title: "Get matched, not flooded",
    desc: "Toggle between eligible opportunities and all verified active opportunities. Expired listings are hidden automatically.",
  },
  {
    n: "03",
    title: "Apply, then forget the tab",
    desc: "Confirm the pre-filled review screen, get a reference number, and let your dashboard chase the status update.",
  },
];

const PRIVACY_POINTS = [
  {
    icon: Eye,
    title: "You can see what's stored",
    desc: "Every field Scout holds on you, professional or sensitive, is visible in your account at any time.",
  },
  {
    icon: Lock,
    title: "Sensitive data stays separate",
    desc: "ID numbers, banking details and health information are never mixed with the profile providers can see, and are never shared without your consent.",
  },
  {
    icon: Trash2,
    title: "You can restrict or delete it",
    desc: "In line with POPIA (No. 4 of 2013), you can restrict or permanently delete your personal data whenever you choose.",
  },
];

export default function Landing() {
  return (
    <div>
      {/* HERO */}
      <div className="bg-ink">
        <Navbar />
        <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-6 md:grid-cols-[1.15fr_0.85fr] md:items-center md:px-12">
          <div className="animate-rise text-white">
            <h1 className="text-[38px] font-bold leading-[1.12] md:text-[46px]">
              Find and apply for{" "}
              <span className="inline-block rounded-lg bg-lime px-3 py-0.5 text-ink">
                opportunities
              </span>{" "}
              faster.
            </h1>
            <p className="mt-5 max-w-md text-white/65">
              Scout builds one verified student profile and uses it to match,
              pre-fill, and track applications for internships, learnerships
              and graduate programmes. Nothing gets missed and nothing
              gets re-typed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3.5">
              <Button to="/register" variant="lime">
                Get started <ArrowRight size={16} />
              </Button>
              <Button href="#why-scout" variant="outline-light">
                Learn more
              </Button>
            </div>
            <dl className="mt-12 flex gap-10">
              <div>
                <dt className="sr-only">Documents uploaded once</dt>
                <dd className="font-display text-2xl font-bold text-lime">
                  <CountUp end={1} suffix="×" />
                </dd>
                <p className="text-xs text-white/40">upload, reused everywhere</p>
              </div>
              <div>
                <dt className="sr-only">Applications tracked in one place</dt>
                <dd className="font-display text-2xl font-bold text-lime">
                  <CountUp end={100} suffix="%" />
                </dd>
                <p className="text-xs text-white/40">of statuses in one dashboard</p>
              </div>
              <div>
                <dt className="sr-only">Minimum uptime</dt>
                <dd className="font-display text-2xl font-bold text-lime">
                  <CountUp end={99} suffix="%" />
                </dd>
                <p className="text-xs text-white/40">uptime target</p>
              </div>
            </dl>
          </div>
          <RadarPanel />
        </div>
      </div>

      <Marquee items={MARQUEE_ITEMS} className="bg-lime px-6 py-4 text-[13px] font-bold text-lime-ink md:px-12" />

      {/* WHY SCOUT */}
      <section id="why-scout" className="bg-cream px-6 py-16 md:px-12">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-lime-ink">
              Why Scout
            </span>
            <h2 className="mt-4 max-w-sm text-[26px] font-bold leading-tight">
              Built around the problems students actually described
            </h2>
            <p className="mt-3.5 max-w-sm text-sm leading-relaxed text-muted">
              No re-entering the same documents for every application. No
              scrolling past listings you don't qualify for. No checking five
              portals to find out an outcome came in. Every feature traces
              back to a specific frustration from student research.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <FeatureCard key={f.name} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS, a real 3-step sequence, so numbering earns its place */}
      <section className="bg-white px-6 py-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-md text-[26px] font-bold leading-tight">
            From blank profile to submitted application
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative pl-0">
                <span className="font-display text-sm font-bold text-lime-ink">{s.n}</span>
                <h3 className="mt-2 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="mt-6 hidden h-px bg-line md:block" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIVACY / POPIA */}
      <section id="privacy" className="bg-gray-bg px-6 py-16 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={20} className="text-lime-ink" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-lime-ink">
              Data &amp; POPIA
            </span>
          </div>
          <h2 className="mt-3 max-w-lg text-[26px] font-bold leading-tight">
            Your profile only ever holds what an application needs
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
            Scout profiles are professional information only.
          </p>
          <div className="mt-9 grid gap-5 sm:grid-cols-3">
            {PRIVACY_POINTS.map((p) => (
              <div key={p.title} className="rounded-xl2 border border-line bg-white p-5">
                <p.icon size={18} className="text-lime-ink" />
                <p className="mt-3 text-sm font-bold">{p.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink px-6 py-16 text-center md:px-12">
        <FileCheck2 size={26} className="mx-auto text-lime" />
        <h2 className="mx-auto mt-4 max-w-md text-[26px] font-bold leading-tight text-white">
          Upload your documents once. Apply everywhere they fit.
        </h2>
        <div className="mt-7 flex justify-center gap-3.5">
          <Button to="/register" variant="lime">
            Create your profile <ArrowRight size={16} />
          </Button>
          <Button to="/login" variant="outline-light">
            I already have an account
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
