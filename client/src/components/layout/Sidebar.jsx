import { NavLink, useNavigate } from "react-router-dom";
import { Orbit, LayoutGrid, Users, Calendar, MessageSquare, LogOut, PanelLeftClose, PanelLeft } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { useLogout } from "@/hooks/useAuth";
import useUnreadMessagesCount from "@/hooks/useUnreadMessagesCount";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/clubs", label: "Clubs", icon: Users },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/messages", label: "Messages", icon: MessageSquare, badgeKey: "messages" },
];

/**
 * Sidebar — primary navigation. Collapsible on desktop (icon-only, width
 * persisted in localStorage), and rendered as a slide-in drawer on mobile
 * (controlled by TopBar's menu button via isMobileOpen/onMobileClose).
 *
 * Only real, navigable sections are listed here — notifications live in
 * the TopBar bell instead, since there's no dedicated notifications page
 * to link to; putting it in the sidebar would be a link to nowhere.
 */
const Sidebar = ({ isCollapsed, onToggleCollapse, isMobileOpen, onMobileClose }) => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { mutate: logout } = useLogout();
  const { unreadCount } = useUnreadMessagesCount();

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  const badgeFor = (key) => (key === "messages" && unreadCount > 0 ? unreadCount : null);

  const content = (
    <div className="flex h-full flex-col">
      {/* ── Logo + collapse toggle ─────────────────────────────────────── */}
      <div className={cn("flex h-16 shrink-0 items-center border-b border-border/40 px-4", isCollapsed ? "justify-center" : "justify-between")}>
        <NavLink to="/dashboard" className="flex items-center gap-2.5 overflow-hidden" onClick={onMobileClose}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/30">
            <Orbit className="h-4 w-4 text-primary" />
          </div>
          {!isCollapsed && <span className="text-base font-bold tracking-tight text-foreground">Orbit</span>}
        </NavLink>
        {!isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted/60 hover:text-foreground lg:flex"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Primary navigation ─────────────────────────────────────────── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2.5">
        {isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="mb-1.5 hidden h-9 w-full items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted/60 hover:text-foreground lg:flex"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}
        {NAV_ITEMS.map(({ to, label, icon: Icon, badgeKey }) => {
          const badge = badgeFor(badgeKey);
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onMobileClose}
              title={isCollapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isCollapsed && "justify-center px-0",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!isCollapsed && <span className="flex-1 truncate">{label}</span>}
              {badge && (
                <span
                  className={cn(
                    "flex h-4.5 min-w-[18px] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white",
                    isCollapsed && "absolute ml-5 mt-[-14px]"
                  )}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Account ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border/40 p-2.5">
        <button
          onClick={() => { navigate(`/profile/${user?._id}`); onMobileClose?.(); }}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-muted/50",
            isCollapsed && "justify-center"
          )}
          title={isCollapsed ? user?.name : undefined}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-xs font-bold text-primary ring-1 ring-border/30">
            {user?.avatar ? <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" /> : initials}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-xs font-semibold text-foreground">{user?.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user?.department || user?.role}</p>
            </div>
          )}
        </button>
        <button
          onClick={() => logout()}
          className={cn(
            "mt-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground",
            isCollapsed && "justify-center px-0"
          )}
          title="Sign out"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!isCollapsed && "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border/40 bg-card/40 transition-[width] duration-200 lg:block",
          isCollapsed ? "w-[68px]" : "w-60"
        )}
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onMobileClose} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-border/40 bg-card shadow-xl">{content}</aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
