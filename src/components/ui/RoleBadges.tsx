import { ROLE_LABELS, sortRoles, type Role } from "../../types/admin";
import { StatusBadge, type StatusTone } from "./StatusBadge";

/**
 * Roles are ADDITIVE, so this renders every role the account holds - never just
 * the first one. An account can legitimately be user + client + coach + admin.
 */
const TONES: Record<Role, StatusTone> = {
  user: "neutral",
  client: "info",
  coach: "orange",
  admin: "success",
};

export function RoleBadges({ roles }: { roles: Role[] }) {
  if (!roles || roles.length === 0) {
    return <span className="text-caption">—</span>;
  }

  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 4 }}>
      {sortRoles(roles).map((role) => (
        <StatusBadge key={role} label={ROLE_LABELS[role]} tone={TONES[role]} dot={false} />
      ))}
    </span>
  );
}
