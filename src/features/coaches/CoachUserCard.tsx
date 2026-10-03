import type { ReactNode } from "react";
import { GlassCard } from "../../components/ui/GlassCard";
import { Avatar } from "../../components/ui/Avatar";
import { RoleBadges } from "../../components/ui/RoleBadges";
import { resolveMediaUrl } from "../../api/media";
import type { AdminUser, Role } from "../../types/admin";
import type { CoachUserSummary } from "../../types/coach";
import styles from "../users/UserDetailPage.module.css";

/** "919876543210" -> "+91 98765 43210"; anything else is shown as stored. */
export function formatPhone(phone: string | null): string {
  if (!phone) return "—";
  const match = /^91(\d{5})(\d{5})$/.exec(phone);
  return match ? `+91 ${match[1]} ${match[2]}` : `+${phone}`;
}

/** The phone-search result carries the full admin user; the card needs the summary. */
export function toCoachUserSummary(user: AdminUser): CoachUserSummary {
  return {
    id: user.id,
    name: user.profile.name,
    phone: user.phone.normalized,
    email: user.profile.email,
    gender: user.profile.gender,
    city: user.profile.city,
    profilePicture: user.profile.profilePicture,
    roles: user.roles,
    status: user.status,
  };
}

const capitalize = (value: string) => value[0].toUpperCase() + value.slice(1);

/**
 * The user behind a coach, always read-only. These fields belong to the User
 * record and are never edited from a coach screen - only fields that are
 * actually set are shown.
 */
export function CoachUserCard({
  user,
  title = "User Information",
  footer,
}: {
  user: CoachUserSummary;
  title?: string;
  footer?: ReactNode;
}) {
  const rows: [string, ReactNode][] = [
    ["Name", user.name],
    ["Phone", formatPhone(user.phone)],
    ["Email", user.email],
    ["Gender", user.gender ? capitalize(user.gender) : null],
    ["City", user.city],
    ["Account Status", user.status ? capitalize(user.status) : null],
  ];

  return (
    <GlassCard>
      <p className="text-title" style={{ marginBottom: 4 }}>{title}</p>
      <p className="text-caption" style={{ marginBottom: 20 }}>
        From the user's account, including the account picture. Read-only here.
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <Avatar name={user.name ?? user.phone ?? "?"} src={resolveMediaUrl(user.profilePicture) ?? undefined} size="lg" />
        <div>
          <div style={{ fontWeight: 600 }}>{user.name ?? "Unnamed user"}</div>
          <div style={{ marginTop: 6 }}>
            <RoleBadges roles={user.roles as Role[]} />
          </div>
        </div>
      </div>
      <div className={styles.statGrid}>
        {rows
          .filter(([, value]) => value !== null && value !== undefined && value !== "")
          .map(([label, value]) => (
            <div key={label} className={styles.stat}>
              <span className={styles.statLabel}>{label}</span>
              <span className={styles.statValue}>{value}</span>
            </div>
          ))}
      </div>
      {footer && <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>{footer}</div>}
    </GlassCard>
  );
}
