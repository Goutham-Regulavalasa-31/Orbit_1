import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "@/components/common/ProtectedRoute";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";

/**
 * Root application component.
 * Defines the client-side route tree:
 *  - /login       → public
 *  - /register    → public
 *  - /dashboard   → protected (requires authentication)
 *  - /*           → redirects to /login
 */
const App = () => {
  return (
    <Routes>
      {/* ── Public routes ──────────────────────────────────────────── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── Protected routes (auth wall) ──────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* Future protected routes will be nested here */}
      </Route>

      {/* ── Catch-all: redirect to login ──────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
