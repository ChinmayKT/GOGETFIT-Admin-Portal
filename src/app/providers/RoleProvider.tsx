import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { ROLES, getRole, canView } from "../../mock/system/roles";
import type { ModuleKey, Role } from "../../types/permissions";

interface RoleContextValue {
  role: Role;
  roles: Role[];
  setRoleId: (id: string) => void;
  can: (module: ModuleKey, action?: "view" | "create" | "edit" | "delete" | "publish") => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [roleId, setRoleId] = useState("role_super_admin");
  const role = getRole(roleId);

  const value = useMemo<RoleContextValue>(
    () => ({
      role,
      roles: ROLES,
      setRoleId,
      can: (module, action = "view") =>
        action === "view" ? canView(role, module) : role.permissions[module]?.includes(action) ?? false,
    }),
    [role],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
