import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  Bell,
  TrendingUp,
  Orbit,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import Navbar from "@/components/common/Navbar";
import useAuthStore from "@/store/useAuthStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ── Static data ────────────────────────────────────────────────────────────
const STATS = [
  {
    id: "members",
    label: "Community Members",
    value: "1,247",
    icon: Users,
    trend: "+12%",
    trendLabel: "this week",
  },
  {
    id: "posts",
    label: "Active Posts",
    value: "342",
    icon: BookOpen,
    trend: "+8%",
    trendLabel: "this week",
  },
  {
    id: "notifications",
    label: "Notifications",
    value: "7",
    icon: Bell,
    trend: null,
    trendLabel: null,
  },
  {
    id: "trending",
    label: "Trending Topics",
    value: "24",
    icon: TrendingUp,
    trend: "+3",
    trendLabel: "today",
  },
];

const UPCOMING_FEATURES = [
  "Community Posts",
  "Student Clubs",
  "Event Board",
  "Direct Messages",
  "Resource Library",
  "Study Groups",
];

// ── Animation variants ─────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

// ── Dashboard component ───────────────────────────────────────────────────
const DashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0] ?? "Explorer";

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto max-w-6xl px-6 py-10">
        {/* ── Welcome header ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-3xl" aria-hidden>
              👋
            </span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Welcome back,{" "}
                <span className="text-gradient">{firstName}</span>
              </h1>
              <p className="mt-1.5 text-muted-foreground">
                You&apos;re in{" "}
                <span className="font-medium text-foreground">
                  {user?.department || "Orbit"}
                </span>
                . Here&apos;s what&apos;s happening in your community.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Stats grid ───────────────────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {STATS.map(({ id, label, value, icon: Icon, trend, trendLabel }) => (
            <motion.div key={id} variants={cardVariants}>
              <Card className="group cursor-pointer border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {label}
                      </p>
                      <p className="text-3xl font-bold tabular-nums text-foreground">
                        {value}
                      </p>
                      {trend && trendLabel && (
                        <p className="mt-1 text-xs font-medium text-green-400">
                          {trend}{" "}
                          <span className="font-normal text-muted-foreground">
                            {trendLabel}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-all duration-200 group-hover:ring-primary/40">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Upcoming features card ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-indigo-500/3 to-transparent">
            <CardHeader>
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    V2 Features — Coming Soon
                    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-primary">
                      In Development
                    </span>
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    Posts, discussions, clubs, and real-time events are next on
                    the roadmap.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {UPCOMING_FEATURES.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 rounded-lg border border-border/30 bg-background/30 px-3 py-2.5 text-sm text-muted-foreground backdrop-blur-sm transition-colors hover:border-border/60 hover:text-foreground"
                  >
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {feature}
                  </div>
                ))}
              </div>

              {/* User profile summary */}
              {user && (
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-border/30 bg-background/20 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 ring-2 ring-primary/20 text-sm font-bold text-primary">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email} ·{" "}
                      <span className="capitalize">{user.role}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <Orbit className="h-3 w-3" />
                    Active
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardPage;
