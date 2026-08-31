import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, Crown } from "lucide-react";

/**
 * ClubCard — grid item for the clubs directory.
 * The whole card links to the club's detail page.
 */
const ClubCard = ({ club }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8, scale: 0.98 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    <Link
      to={`/clubs/${club._id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
    >
      <div className="relative h-24 shrink-0 overflow-hidden">
        {club.coverImage?.url ? (
          <img
            src={club.coverImage.url}
            alt={club.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
        {club.isCreator && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-amber-400/30 bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300 backdrop-blur-sm">
            <Crown className="h-2.5 w-2.5" />
            Creator
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-sm font-bold text-foreground">{club.name}</h3>
        <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">{club.description}</p>

        {club.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {club.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary/80">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-1 flex items-center justify-between border-t border-border pt-2.5">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Users className="h-3 w-3" />
            {club.membersCount} {club.membersCount === 1 ? "member" : "members"}
          </span>
          {club.isMember && (
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
              Joined
            </span>
          )}
        </div>
      </div>
    </Link>
  </motion.div>
);

export default ClubCard;
