import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

/**
 * UX protection only. This hides screens from someone who is not signed in; it
 * is NOT the security boundary. Every /api/admin/* endpoint independently
 * enforces authentication and the admin role, so bypassing this guard in the
 * browser reveals nothing but empty screens.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  // While the stored token is being re-validated, render nothing rather than
  // bouncing a legitimately signed-in operator to /login on every reload.
  if (initializing) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
