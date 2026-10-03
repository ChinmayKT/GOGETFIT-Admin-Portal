import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, setUnauthorizedHandler, tokenStore } from "../../api/client";
import { adminLogin, getAdminMe } from "../../api/adminUsers";
import type { AdminUser, Role } from "../../types/admin";

interface LoginResult {
  success: boolean;
  error?: string;
}

interface CurrentAdmin {
  id: string;
  name: string;
  email: string;
  avatarSeed: string;
  roles: Role[];
}

interface AuthContextValue {
  admin: CurrentAdmin | null;
  /** The full backend document, for screens that need more than the header needs. */
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  /** True until the stored token has been checked against the backend. */
  initializing: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useCurrentAdmin(): CurrentAdmin {
  const { admin } = useAuth();
  if (!admin) throw new Error("useCurrentAdmin must be used within an authenticated session");
  return admin;
}

const toCurrentAdmin = (user: AdminUser): CurrentAdmin => {
  const name = user.profile.name?.trim() || user.profile.email || "Administrator";
  return {
    id: user.id,
    name,
    email: user.profile.email ?? "",
    avatarSeed: name,
    roles: user.roles,
  };
};

/**
 * Session state for the Admin Portal.
 *
 * The backend is the authority. Nothing here decides whether someone is an
 * administrator: the token is exchanged for the stored MongoDB document via
 * GET /api/admin/me, which is itself gated by requireRole('admin'). If that call
 * does not succeed there is no session, so a tampered localStorage value cannot
 * manufacture one.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [initializing, setInitializing] = useState(() => tokenStore.get() !== null);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setAdminUser(null);
  }, []);

  // Any 401 from any request invalidates the whole session, in one place.
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
  }, [clearSession]);

  // On a reload the stored token is re-validated against the backend rather
  // than trusted. A revoked admin role is caught here, not after a 403 later.
  useEffect(() => {
    if (tokenStore.get() === null) {
      setInitializing(false);
      return;
    }

    let cancelled = false;

    getAdminMe()
      .then((user) => {
        if (!cancelled) setAdminUser(user);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      // Only the token is taken from the login response. The user document is
      // then re-read from /admin/me, which is the role-gated source of truth.
      const { token } = await adminLogin(email, password);
      tokenStore.set(token);

      // Confirm the token really grants admin access before showing the portal.
      // The login endpoint already enforces this; re-reading /me means the UI
      // never depends on that being true.
      const me = await getAdminMe();
      setAdminUser(me);
      return { success: true };
    } catch (error) {
      clearSession();

      if (error instanceof ApiError) {
        if (error.isForbidden) {
          return { success: false, error: "This account does not have Admin Portal access" };
        }
        if (error.code === "NETWORK_ERROR") {
          return { success: false, error: "Could not reach the server. Check your connection." };
        }
        if (error.code === "TOO_MANY_REQUESTS") {
          return { success: false, error: "Too many attempts. Please try again in a few minutes." };
        }
        return { success: false, error: error.message };
      }

      return { success: false, error: "Something went wrong. Please try again." };
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      admin: adminUser ? toCurrentAdmin(adminUser) : null,
      adminUser,
      isAuthenticated: adminUser !== null,
      initializing,
      login,
      logout: clearSession,
    }),
    [adminUser, initializing, login, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
