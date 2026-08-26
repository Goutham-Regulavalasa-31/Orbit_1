import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Users, Check, UserPlus } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import useEventDetail from "@/hooks/useEventDetail";
import useToggleRSVP from "@/hooks/useToggleRSVP";

// ── Hero skeleton ─────────────────────────────────────────────────────────────
const HeroSkeleton = () => (
  <div className="animate-pulse overflow-hidden rounded-2xl border border-border/40 bg-card/30">
    <div className="h-48 bg-muted/30" />
    <div className="space-y-2 p-6">
      <div className="h-5 w-48 rounded bg-muted/40" />
      <div className="h-3 w-72 rounded bg-muted/40" />
    </div>
  </div>
);

// ── Error state ───────────────────────────────────────────────────────────────
const EventError = () => (
  <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 py-16 text-center">
    <p className="text-sm text-muted-foreground">This event couldn&apos;t be found.</p>
    <Link
      to="/events"
      className="flex items-center gap-1.5 rounded-lg border border-border/40 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to Events
    </Link>
  </div>
);

const formatFullDate = (isoString) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoString));

const EventDetailPage = () => {
  const { id: eventId } = useParams();

  const { event, isLoading, isError } = useEventDetail(eventId);
  const { mutate: toggleRSVP, isPending: isToggling } = useToggleRSVP(eventId);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto max-w-2xl px-6 py-10">
        {isLoading && <HeroSkeleton />}

        {isError && !isLoading && <EventError />}

        {!isLoading && !isError && event && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="overflow-hidden rounded-2xl border border-border/40 bg-card/35 backdrop-blur-sm"
          >
            <div className="relative h-48">
              {event.coverImage?.url ? (
                <img src={event.coverImage.url} alt={event.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/10 to-transparent" />
            </div>

            <div className="px-6 pb-6">
              <div className="relative z-10 -mt-6 flex flex-wrap items-start justify-between gap-3">
                <h1 className="max-w-md text-2xl font-bold tracking-tight text-foreground">{event.title}</h1>

                <button
                  onClick={() => toggleRSVP()}
                  disabled={isToggling}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                    event.isAttending
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
                  }`}
                >
                  {event.isAttending ? <Check className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                  {event.isAttending ? "You're going" : "RSVP"}
                </button>
              </div>

              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0 text-primary/70" />
                  {formatFullDate(event.date)}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-primary/70" />
                  {event.location}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0 text-primary/70" />
                  {event.attendeesCount} {event.attendeesCount === 1 ? "person" : "people"} going
                </span>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{event.description}</p>

              <div className="mt-4 border-t border-border/25 pt-4 text-xs text-muted-foreground">
                Hosted by{" "}
                <Link to={`/profile/${event.creator?._id}`} className="font-medium text-foreground/80 hover:underline">
                  {event.creator?.name}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default EventDetailPage;
