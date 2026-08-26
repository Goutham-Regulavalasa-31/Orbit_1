import { motion } from "framer-motion";
import { LogOut, User, Orbit, Users, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import useAuthStore from "@/store/useAuthStore";
import { useLogout } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/notifications/NotificationBell";
import MessageBell from "@/components/messages/MessageBell";

/**
 * Top navigation bar for authenticated pages.
 * Slides down from the top on mount via Framer Motion.
 * Displays the Orbit logo, current user info, and a logout button.
 */
const Navbar = () => {
  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending } = useLogout();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-2xl"
    >
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* ── Logo ──────────────────────────────────────────────────── */}
        <Link
          to="/dashboard"
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/30 transition-all duration-200 group-hover:ring-primary/60 group-hover:shadow-glow">
            <Orbit className="h-4 w-4 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Orbit
          </span>
        </Link>

        {/* ── Center: primary nav links ──────────────────────────────── */}
        <div className="hidden items-center gap-1 sm:flex">
          <Link
            to="/clubs"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <Users className="h-4 w-4" />
            Clubs
          </Link>
          <Link
            to="/events"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <Calendar className="h-4 w-4" />
            Events
          </Link>
        </div>

        {/* ── Right side: user info + logout ────────────────────────── */}
        {user && (
          <div className="flex items-center gap-3">
            {/* Message bell */}
            <MessageBell />

            {/* Notification bell */}
            <NotificationBell />

            {/* User pill */}
            <Link
              to={`/profile/${user._id}`}
              className="hidden sm:flex items-center gap-2.5 rounded-lg border border-border/40 bg-muted/30 px-3 py-1.5 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 ring-1 ring-primary/30">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-semibold text-foreground">
                  {user.name}
                </span>
                <span className="text-[11px] capitalize text-muted-foreground">
                  {user.department || user.role}
                </span>
              </div>
            </Link>

            {/* Logout button */}
            <button
              id="navbar-logout-btn"
              onClick={() => logout()}
              disabled={isPending}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                "text-muted-foreground transition-all duration-200",
                "hover:bg-muted/60 hover:text-foreground",
                "disabled:cursor-not-allowed disabled:opacity-40"
              )}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isPending ? "Signing out…" : "Sign out"}
              </span>
            </button>
          </div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
