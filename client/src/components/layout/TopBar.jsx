import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import MessageBell from "@/components/messages/MessageBell";

const ROUTE_TITLES = [
  { pattern: "/dashboard", title: "Dashboard" },
  { pattern: "/clubs", title: "Clubs" },
  { pattern: "/clubs/:id", title: "Club" },
  { pattern: "/events", title: "Events" },
  { pattern: "/events/:id", title: "Event" },
  { pattern: "/messages", title: "Messages" },
  { pattern: "/messages/:userId", title: "Messages" },
  { pattern: "/profile/:userId", title: "Profile" },
];

// Minimal path matcher: same segment count, literal segments equal,
// ":param" segments match anything.
const matchPath = (pattern, pathname) => {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return false;
  return patternParts.every((part, i) => part.startsWith(":") || part === pathParts[i]);
};

/**
 * Resolves the current route to a page title for the top bar. Keeps every
 * page from having to declare its own duplicate title markup — the sidebar
 * already carries iconography for each section, so this stays text-only.
 */
const usePageTitle = () => {
  const { pathname } = useLocation();
  const match = ROUTE_TITLES.find(({ pattern }) => matchPath(pattern, pathname));
  return match?.title ?? "Orbit";
};

/**
 * TopBar — slim header above the main content area. Carries the current
 * page title, the mobile nav trigger, and the two live-status bells.
 * Deliberately does not duplicate primary navigation (that's the sidebar's
 * job) or add a search box the product doesn't have yet.
 */
const TopBar = ({ onOpenMobileNav }) => {
  const title = usePageTitle();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
      <button
        onClick={onOpenMobileNav}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{title}</h2>

      <div className="flex shrink-0 items-center gap-1">
        <MessageBell />
        <NotificationBell />
      </div>
    </header>
  );
};

export default TopBar;
