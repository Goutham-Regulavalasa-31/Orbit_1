import { motion } from "framer-motion";
import { Heart, MessageCircle, Sparkles, CalendarCheck, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ORBIT_DURATION = 34; // seconds for one full revolution

// The orbit radius scales with viewport width below the `sm` breakpoint
// (640px) and is pinned to a fixed 190px above it — see the Chip component
// for why that split matters: labels only render at `sm:` and up, so the
// wide labeled chip only ever appears alongside the full fixed radius,
// never the shrunk one. Below `sm`, chips are icon-only and small enough
// that the shrunk radius still clears the central card comfortably.
const RADIUS = "min(190px, 34vw)";

const SATELLITES = [
  {
    angle: 0,
    icon: CalendarCheck,
    label: "You're going",
    className: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  },
  {
    angle: 120,
    icon: Users,
    label: "Design Club",
    className: "border-primary/30 bg-primary/15 text-primary",
  },
  {
    angle: 240,
    icon: Sparkles,
    label: "AI ready",
    className: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  },
];

// Icon-only below `sm` (a small circular badge, plenty of clearance at any
// radius), full pill-with-label from `sm` up once there's room to spare.
const Chip = ({ icon: Icon, label, className }) => (
  <div
    className={`flex h-8 w-8 items-center justify-center whitespace-nowrap rounded-full border text-xs font-medium shadow-lg shadow-black/40 backdrop-blur-sm sm:w-auto sm:justify-start sm:gap-1.5 sm:px-3 ${className}`}
  >
    <Icon className="h-3.5 w-3.5 shrink-0" />
    <span className="hidden sm:inline">{label}</span>
  </div>
);

/**
 * OrbitVisual — the landing page's signature element.
 *
 * The product is literally named for the idea that a campus's posts, clubs,
 * and events all orbit one shared hub. This renders that idea directly
 * instead of a stock illustration: a tilted recreation of the real feed
 * card sits at the center, while three chips — styled after the app's own
 * category colors (the emerald RSVP accent, the primary club tint, an
 * amber AI highlight) — revolve around it.
 *
 * All three ride the same rotating ring, fixed 120° apart, rather than
 * three independently-timed rings — that was the first version, and at
 * certain angles the differently-paced chips visually collided. Locking
 * them to one ring makes the spacing permanent by construction, and reads
 * as one orchestrated motion instead of three competing ones.
 *
 * Each chip counter-rotates against the ring (its own static placement
 * angle plus the ring's live rotation, negated) so it stays upright as it
 * travels — only its position moves, never its orientation.
 */
const OrbitVisual = () => {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[500px]">
      {/* Orbit path — the one ring the satellites actually travel on */}
      <div
        className="absolute rounded-full border border-border/60"
        style={{ inset: `calc(50% - ${RADIUS})` }}
      />
      {/* Purely decorative inner ring for depth */}
      <div className="absolute inset-[38%] rounded-full border border-border/40" />

      {/* Ambient glow behind the whole system */}
      <div className="absolute inset-[14%] -z-10 rounded-full bg-primary/10 blur-3xl" />

      {/* Central card — a recreation of the real feed's post card */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: -6 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
          whileHover={{ rotate: -2, scale: 1.02 }}
          className="w-40 rounded-xl border border-border bg-card p-3 shadow-2xl shadow-black/60"
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7 border border-border/60">
              <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">
                AK
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-semibold text-foreground">Aanya K.</p>
              <p className="text-[10px] text-muted-foreground">Computer Science</p>
            </div>
            <span className="ml-auto rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
              Note
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
            Midterm study guide for Data Structures is up — merged into one doc.
          </p>
          <div className="mt-2 flex items-center gap-3 border-t border-border pt-1.5 text-muted-foreground">
            <span className="flex items-center gap-1 text-[10px]">
              <Heart className="h-3 w-3" /> 24
            </span>
            <span className="flex items-center gap-1 text-[10px]">
              <MessageCircle className="h-3 w-3" /> 8
            </span>
            <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-primary">
              <Sparkles className="h-3 w-3" /> Summarize
            </span>
          </div>
        </motion.div>
      </div>

      {/* The ring itself — one rotating layer carrying all three satellites */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: ORBIT_DURATION, repeat: Infinity, ease: "linear" }}
      >
        {SATELLITES.map(({ angle, icon, label, className }) => (
          <div
            key={label}
            className="absolute left-1/2 top-1/2 origin-center"
            style={{ transform: `rotate(${angle}deg) translateY(calc(-1 * ${RADIUS}))` }}
          >
            <motion.div
              className="-translate-x-1/2 -translate-y-1/2"
              initial={{ rotate: -angle }}
              animate={{ rotate: -angle - 360 }}
              transition={{ duration: ORBIT_DURATION, repeat: Infinity, ease: "linear" }}
            >
              <Chip icon={icon} label={label} className={className} />
            </motion.div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default OrbitVisual;
