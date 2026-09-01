import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";

// Route-level code splitting: each page ships in its own chunk, fetched
// only when its route is actually visited, instead of one monolithic
// bundle upfront. AppShell/ProtectedRoute stay eager — they're needed
// immediately for every authenticated route, so splitting them would
// just add a waterfall for no payload savings.
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const ProfilePage = lazy(() => import("@/pages/profile/ProfilePage"));
const ClubsDirectoryPage = lazy(() => import("@/pages/clubs/ClubsDirectoryPage"));
const ClubDetailPage = lazy(() => import("@/pages/clubs/ClubDetailPage"));
const MessagesPage = lazy(() => import("@/pages/messages/MessagesPage"));
const EventsHubPage = lazy(() => import("@/pages/events/EventsHubPage"));
const EventDetailPage = lazy(() => import("@/pages/events/EventDetailPage"));

/**
 * RouteFallback — Suspense boundary shown while a lazy page chunk loads.
 * Centered in the viewport since it can appear either standalone (before
 * AppShell mounts, e.g. first visit to /login) or nested inside AppShell's
 * main content area (switching between authenticated pages).
 */
const RouteFallback = () => (
  <div className="flex min-h-[50vh] w-full items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

// Socket connection lifecycle is owned solely by <SocketBridge> in
// main.jsx — it used to also be triggered from a useEffect here, which
// raced with SocketBridge's own effect on every mount/token change and
// caused the socket to disconnect and immediately reconnect. A message
// delivered during that reconnect window was silently dropped.
const App = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/clubs" element={<ClubsDirectoryPage />} />
            <Route path="/clubs/:id" element={<ClubDetailPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:userId" element={<MessagesPage />} />
            <Route path="/events" element={<EventsHubPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};
export default App;
