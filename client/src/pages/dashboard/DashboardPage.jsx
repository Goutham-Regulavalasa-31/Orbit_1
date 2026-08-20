import { motion } from "framer-motion";
import { Users, BookOpen, Bell, TrendingUp } from "lucide-react";

import Navbar from "@/components/common/Navbar";
import useAuthStore from "@/store/useAuthStore";
import { Card, CardContent } from "@/components/ui/card";
import PostFeed from "@/components/posts/PostFeed";

// ── Static stats (will be dynamic in a future iteration) ──────────────────
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

// ── Animation variants ─────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

// ── Dashboard component ───────────────────────────────────────────────────
const DashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0] ?? "Explorer";

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto max-w-4xl px-6 py-10">
        {/* ── Welcome header ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-8"
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
          className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {STATS.map(({ id, label, value, icon: Icon, trend, trendLabel }) => (
            <motion.div key={id} variants={cardVariants}>
              <Card className="group cursor-pointer border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {label}
                      </p>
                      <p className="text-2xl font-bold tabular-nums text-foreground">
                        {value}
                      </p>
                      {trend && trendLabel && (
                        <p className="mt-0.5 text-xs font-medium text-green-400">
                          {trend}{" "}
                          <span className="font-normal text-muted-foreground">
                            {trendLabel}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-all duration-200 group-hover:ring-primary/40">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Live Social Feed (V2) ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <PostFeed />
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardPage;
