import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Sparkles,
  Users,
  CalendarCheck,
  Bell,
  MessageCircle,
  Radio,
  Orbit,
} from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import LandingNavbar from "@/components/landing/LandingNavbar";
import OrbitVisual from "@/components/landing/OrbitVisual";

// ── Motion primitives ────────────────────────────────────────────────────
// One shared vocabulary for the whole page: fade + rise on entrance,
// staggered across children. Framer Motion's `whileInView` already no-ops
// translate/opacity animation when the OS requests reduced motion is
// handled per-section below via `viewport={{ once: true }}` + plain CSS
// fallbacks — nothing here relies on layout animation or JS scroll listeners.
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = (staggerChildren = 0.12, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

const Reveal = ({ children, className, ...props }) => (
  <motion.div
    variants={fadeUp}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: "-80px" }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

const SectionEyebrow = ({ children }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
    {children}
  </span>
);

// ── Content sections ─────────────────────────────────────────────────────

const PostTypeCard = ({ icon: Icon, label, tone, description }) => (
  <motion.div
    variants={fadeUp}
    className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
  >
    <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg border ${tone}`}>
      <Icon className="h-4 w-4" />
    </div>
    <h3 className="font-semibold text-foreground">{label}</h3>
    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
  </motion.div>
);

const FeedSection = () => (
  <section id="feed" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
    <Reveal className="max-w-2xl">
      <SectionEyebrow>One feed</SectionEyebrow>
      <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        Not everything you post is the same thing.
      </h2>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        Orbit's feed knows the difference between a shower thought, a study note, and a
        question that actually needs an answer — so your campus stops losing the useful
        stuff in a wall of chat messages.
      </p>
    </Reveal>

    <motion.div
      variants={stagger()}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="mt-12 grid gap-4 sm:grid-cols-3"
    >
      <PostTypeCard
        icon={MessageSquare}
        label="General"
        tone="border-blue-500/30 bg-blue-500/10 text-blue-400"
        description="Everyday campus talk — announcements, plans, things worth sharing."
      />
      <PostTypeCard
        icon={BookOpen}
        label="Notes"
        tone="border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
        description="Study material and write-ups your classmates can actually search for later."
      />
      <PostTypeCard
        icon={HelpCircle}
        label="Doubts"
        tone="border-amber-500/30 bg-amber-500/10 text-amber-400"
        description="A real question, flagged as one, so it doesn't scroll past unanswered."
      />
    </motion.div>

    <Reveal className="mt-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] p-5">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p className="text-sm leading-relaxed text-foreground/90">
        <span className="font-semibold text-foreground">Long notes summarize themselves.</span>{" "}
        Any post can be condensed with one click — so a dense write-up is still readable at
        1am before an exam.
      </p>
    </Reveal>
  </section>
);

const TogetherSection = () => (
  <section id="together" className="border-t border-border bg-card/30">
    <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <Reveal className="max-w-2xl">
        <SectionEyebrow>Clubs & events</SectionEyebrow>
        <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Find your people, then find the time to show up.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Every club has a real feed of its own. Every event has a real headcount. RSVP once,
          and Orbit keeps your calendar and your community in the same place.
        </p>
      </Reveal>

      <motion.div
        variants={stagger()}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mt-12 grid gap-4 md:grid-cols-2"
      >
        <motion.div
          variants={fadeUp}
          className="flex flex-col justify-between rounded-xl border border-border bg-card p-6"
        >
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
            <h3 className="mt-3 font-semibold text-foreground">Clubs with a pulse</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Join, post, and see who's actually active — not a member list that hasn't moved
              since orientation week.
            </p>
          </div>
          <div className="mt-5 flex -space-x-2">
            {["AK", "RS", "PM", "TU"].map((initials) => (
              <div
                key={initials}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground"
              >
                {initials}
              </div>
            ))}
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary/15 text-[10px] font-bold text-primary">
              +12
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="flex flex-col justify-between rounded-xl border border-border bg-card p-6"
        >
          <div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <CalendarCheck className="h-4 w-4" />
            </div>
            <h3 className="mt-3 font-semibold text-foreground">RSVPs that update live</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Attendee counts update the second someone RSVPs — for you and everyone else
              looking at that event, no refresh needed.
            </p>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-lg border border-border bg-background/60 px-4 py-3">
            <span className="text-sm font-medium text-foreground">Dev Fest — Fri, 8:30 PM</span>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
              <CalendarCheck className="h-3 w-3" /> Going
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

const LiveSection = () => (
  <section id="live" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <Reveal>
        <SectionEyebrow>Real-time</SectionEyebrow>
        <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Built to feel like everyone's actually online.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Messages arrive as you type them. Notifications land the moment something happens.
          Orbit runs on a live connection to your campus, not a page you have to keep
          reloading.
        </p>
        <ul className="mt-6 space-y-3">
          {[
            { icon: MessageCircle, text: "Direct messages, delivered instantly" },
            { icon: Bell, text: "Notified the moment someone replies or likes" },
            { icon: Radio, text: "Feed and RSVP counts update live for everyone watching" },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-foreground/90">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="relative">
        <div className="mx-auto w-full max-w-sm rounded-xl border border-border bg-card p-1.5 shadow-2xl shadow-black/50">
          <div className="rounded-lg bg-background/60 p-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-muted-foreground">Live · Campus Messages</span>
            </div>
            <div className="mt-3 space-y-2.5">
              <div className="max-w-[75%] rounded-xl rounded-bl-sm bg-muted px-3.5 py-2 text-xs text-foreground/90">
                are you still going to the design club meet tonight?
              </div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="ml-auto max-w-[75%] rounded-xl rounded-br-sm bg-primary px-3.5 py-2 text-xs text-primary-foreground"
              >
                yep, heading over now
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="flex items-center gap-1.5 pl-1 text-[10px] text-muted-foreground"
              >
                <span className="flex gap-0.5">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground" />
                </span>
                typing
              </motion.div>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

const ClosingSection = () => (
  <section className="border-t border-border">
    <Reveal className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8 sm:py-32">
      <h2 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
        Your campus is already talking.
        <br />
        Give it a place to happen.
      </h2>
      <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
        Free for students, built for one campus at a time.
      </p>
      <div className="mt-8 flex justify-center">
        <Button asChild size="lg" className="gap-2 px-8 font-semibold">
          <Link to="/register">
            Create your account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Reveal>
  </section>
);

const Footer = () => (
  <footer className="border-t border-border">
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-10 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-8">
      <div className="flex items-center gap-2">
        <Orbit className="h-4 w-4 text-primary" />
        <span className="font-medium text-foreground">Orbit</span>
      </div>
      <p>&copy; {new Date().getFullYear()} Orbit. Built for students, by students.</p>
    </div>
  </footer>
);

// ── Hero ──────────────────────────────────────────────────────────────────

const Hero = () => (
  <section className="relative overflow-hidden">
    {/* Faint corner glow — the only atmospheric effect on the page, kept to one spot */}
    <div className="pointer-events-none absolute -top-40 right-0 h-[560px] w-[560px] rounded-full bg-primary/10 blur-[120px]" />

    <div className="mx-auto grid max-w-6xl items-center gap-16 px-5 pb-24 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-2 lg:gap-8 lg:pb-32 lg:pt-24">
      <motion.div
        variants={stagger(0.13, 0.1)}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp}>
          <SectionEyebrow>For one campus at a time</SectionEyebrow>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="mt-6 font-display text-4xl font-medium leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]"
        >
          Everything your campus is talking about, actually organized.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground"
        >
          Posts, clubs, events, and messages — in one focused feed instead of five
          different group chats. Built for a single university, not the whole internet.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="gap-2 px-7 font-semibold">
            <Link to="/register">
              Create your account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="font-medium text-foreground">
            <a
              href="#feed"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("feed")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See how it works
            </a>
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
      >
        <OrbitVisual />
      </motion.div>
    </div>
  </section>
);

// ── Page ──────────────────────────────────────────────────────────────────

const LandingPage = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // A signed-in visitor landing on "/" (e.g. a bookmark) belongs in the
  // app, not back on the pitch for it.
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />
      <Hero />
      <FeedSection />
      <TogetherSection />
      <LiveSection />
      <ClosingSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
