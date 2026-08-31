import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Users, Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import useEventDetail from "@/hooks/useEventDetail";
import useToggleRSVP from "@/hooks/useToggleRSVP";
import useEventRoom from "@/hooks/useEventRoom";

// ── Hero skeleton ─────────────────────────────────────────────────────────────
const HeroSkeleton = () => (
  <div className="animate-pulse overflow-hidden rounded-xl border border-border bg-card">
    <div className="h-40 bg-muted" />
    <div className="space-y-2 p-6">
      <div className="h-5 w-48 rounded bg-muted" />
      <div className="h-3 w-72 rounded bg-muted" />
    </div>
  </div>
);

// ── Error state ───────────────────────────────────────────────────────────────
const EventError = () => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
    <p className="text-sm text-muted-foreground">This event couldn&apos;t be found.</p>
    <Link
      to="/events"
      className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
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
  useEventRoom(eventId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {isLoading && <HeroSkeleton />}

      {isError && !isLoading && <EventError />}

      {!isLoading && !isError && event && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="relative h-40">
            {event.coverImage?.url ? (
              <img src={event.coverImage.url} alt={event.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>

          <div className="px-6 pb-6 pt-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="max-w-md text-xl font-semibold tracking-tight text-foreground">{event.title}</h1>

              <Button
                onClick={() => toggleRSVP()}
                disabled={isToggling}
                size="sm"
                variant={event.isAttending ? "outline" : "default"}
                className={event.isAttending ? "gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15" : "gap-1.5"}
              >
                {event.isAttending ? <Check className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                {event.isAttending ? "You're going" : "RSVP"}
              </Button>
            </div>

            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-primary" />
                {formatFullDate(event.date)}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                {event.location}
              </span>
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0 text-primary" />
                {event.attendeesCount} {event.attendeesCount === 1 ? "person" : "people"} going
              </span>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{event.description}</p>

            <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
              Hosted by{" "}
              <Link to={`/profile/${event.creator?._id}`} className="font-medium text-foreground/80 hover:underline">
                {event.creator?.name}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
