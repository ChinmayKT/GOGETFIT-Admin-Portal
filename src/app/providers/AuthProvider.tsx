import { createContext, useContext, type ReactNode } from "react";

interface CurrentAdmin {
  name: string;
  email: string;
  avatarSeed: string;
}

const AuthContext = createContext<CurrentAdmin | null>(null);

export function useCurrentAdmin() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useCurrentAdmin must be used within AuthProvider");
  return ctx;
}

const CURRENT_ADMIN: CurrentAdmin = {
  name: "Chinmay",
  email: "chinmaykt10@gmail.com",
  avatarSeed: "Chinmay",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={CURRENT_ADMIN}>{children}</AuthContext.Provider>;
}
