import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "@/store/useAuthStore";

/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * Behaviour:
 *  - If the user is authenticated → renders the child route via <Outlet />
 *  - If not → redirects to /login, preserving the intended destination
 *    in `location.state.from` so we can redirect back after login if desired.
 *
 * Usage in App.jsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<DashboardPage />} />
 *   </Route>
 */
const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
