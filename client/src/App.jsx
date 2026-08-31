import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import ProfilePage from "@/pages/profile/ProfilePage";
import ClubsDirectoryPage from "@/pages/clubs/ClubsDirectoryPage";
import ClubDetailPage from "@/pages/clubs/ClubDetailPage";
import MessagesPage from "@/pages/messages/MessagesPage";
import EventsHubPage from "@/pages/events/EventsHubPage";
import EventDetailPage from "@/pages/events/EventDetailPage";

// Socket connection lifecycle is owned solely by <SocketBridge> in
// main.jsx — it used to also be triggered from a useEffect here, which
// raced with SocketBridge's own effect on every mount/token change and
// caused the socket to disconnect and immediately reconnect. A message
// delivered during that reconnect window was silently dropped.
const App = () => {
  return (
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
  );
};
export default App;
