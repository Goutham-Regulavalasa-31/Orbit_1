import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Check } from "lucide-react";
import useToggleRSVP from "@/hooks/useToggleRSVP";

const formatEventDate = (isoString) => {
  const date = new Date(isoString);
  return {
    day: date.toLocaleDateString("en-US", { day: "2-digit" }),
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
};

/**
 * EventCard — grid item for the events hub.
 * The card links to the event's detail page; the RSVP button is its own
 * hit-target so attending doesn't require leaving the grid.
 */
const EventCard = ({ event }) => {
  const { mutate: toggleRSVP, isPending } = useToggleRSVP(event._id);
  const { day, month, time } = formatEventDate(event.date);

  const handleRSVP = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;
    toggleRSVP();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Link
        to={`/events/${event._id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/35 backdrop-blur-sm transition-all duration-300 hover:border-border/70 hover:bg-card/50 hover:shadow-xl hover:shadow-black/20"
      >
        <div className="relative h-32 shrink-0 overflow-hidden">
          {event.coverImage?.url ? (
            <img
              src={event.coverImage.url}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/25 via-primary/10 to-transparent" />
          )}

          <div className="absolute left-2 top-2 flex flex-col items-center rounded-lg bg-black/60 px-2 py-1 backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase leading-none text-red-300">{month}</span>
            <span className="text-sm font-bold leading-tight text-white">{day}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-1 text-sm font-bold text-foreground">{event.title}</h3>

          <div className="space-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 shrink-0" />
              {time}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.location}</span>
            </span>
          </div>

          <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">{event.description}</p>

          <div className="mt-1 flex items-center justify-between border-t border-border/20 pt-2.5">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Users className="h-3 w-3" />
              {event.attendeesCount} going
            </span>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleRSVP}
              disabled={isPending}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                event.isAttending
                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {event.isAttending && <Check className="h-3 w-3" />}
              {event.isAttending ? "Going" : "RSVP"}
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default EventCard;
