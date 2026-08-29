import { createContext, useContext, useState, type ReactNode } from "react";
import { delay } from "../../mock/shared/utils";

interface CurrentAdmin {
  name: string;
  email: string;
  avatarSeed: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  admin: CurrentAdmin | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

const STORAGE_KEY = "ggf-admin-session";

/** Mock credential store — this is a frontend-only prototype with no real auth backend. */
const MOCK_ACCOUNT = {
  email: "prajwal@gogetfit.com",
  password: "gogetfit@123",
  name: "Prajwal",
};

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

function readStoredAdmin(): CurrentAdmin | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as CurrentAdmin) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<CurrentAdmin | null>(readStoredAdmin);

  async function login(email: string, password: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const matches = normalizedEmail === MOCK_ACCOUNT.email && password === MOCK_ACCOUNT.password;

    if (!matches) {
      return delay({ success: false, error: "Invalid email or password" }, 500);
    }

    const current: CurrentAdmin = { name: MOCK_ACCOUNT.name, email: MOCK_ACCOUNT.email, avatarSeed: MOCK_ACCOUNT.name };
    setAdmin(current);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // localStorage unavailable — session just won't survive a reload
    }
    return delay({ success: true }, 500);
  }

  function logout() {
    setAdmin(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated: !!admin, login, logout }}>{children}</AuthContext.Provider>
  );
}
