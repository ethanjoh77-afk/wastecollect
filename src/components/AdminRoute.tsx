import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types";

interface AdminRouteProps {
  /**
   * Roles allowed to access the nested routes.
   * Default: super_admin + municipality_admin
   */
  roles?: UserRole[];
}

export function AdminRoute({
  roles = ["super_admin", "municipality_admin"],
}: AdminRouteProps) {
  const { user, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  // Hajalogin -> login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Amelogin lakini hana role inayoruhusiwa -> rudisha dashboard yake ya kawaida
  if (!hasRole(roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}