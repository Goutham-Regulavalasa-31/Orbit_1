import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import ProfilePage from "@/pages/profile/ProfilePage";
import useAuthStore from "@/store/useAuthStore";
import useSocketStore from "@/store/useSocketStore";

const App = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const connectSocket = useSocketStore((s) => s.connect);

  // FIX: Only attempt to connect when a token exists.
  useEffect(() => {
    if (accessToken) {
      connectSocket(accessToken);
    }
  }, [accessToken, connectSocket]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
export default App;