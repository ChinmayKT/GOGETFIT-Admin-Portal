import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Link2 } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Tabs } from "../../components/ui/Tabs";
import { ImageLightbox } from "../../components/ui/ImageLightbox";
import { ProfileHeaderEditor } from "../../components/media/ProfileHeaderEditor";
import { Button } from "../../components/ui/Button";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ApiError } from "../../api/client";
import { getCoach } from "../../api/coaches";
import { CoachClients } from "./CoachClients";
import { resolveMediaUrl } from "../../api/media";
import { formatDate } from "../../utils/format";
import type { CoachRecord } from "../../types/coach";
import { CoachUserCard } from "./CoachUserCard";
import { CoachLevelPlans } from "./CoachLevelPlans";
import styles from "../users/UserDetailPage.module.css";

/** The same tabbed layout as User and Client details. */
const TABS = [
  { key: "user", label: "User Profile" },
  { key: "coach", label: "Coach Profile" },
  { key: "plans", label: "Plans" },
  { key: "clients", label: "Clients" },
];
type TabKey = "user" | "coach" | "plans" | "clients";

export function CoachDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coach, setCoach] = useState<CoachRecord | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "notFound" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [tab, setTab] = useState<TabKey>("user");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState("loading");
    getCoach(id)
      .then((c) => {
        if (cancelled) return;
        setCoach(c);
        setState("ready");
      })
      .catch((cause) => {
        if (cancelled) return;
        setState(cause instanceof ApiError && cause.status === 404 ? "notFound" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  if (state === "loading") return <GlassCard><SkeletonProfile /></GlassCard>;
  if (state === "error") return <ErrorState onRetry={() => setAttempt((n) => n + 1)} />;
  if (state === "notFound" || !coach) return <EmptyState title="Coach not found" />;

  const { profile, user } = coach;
  const links = [
    ["Facebook", profile.facebook],
    ["Instagram", profile.instagram],
    ["LinkedIn", profile.linkedin],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <>
      <div className={styles.topRow}>
        <button className={styles.backLink} onClick={() => navigate("/coaches")}>
          <ArrowLeft size={14} /> Back to Coaches
        </button>
        <Button variant="primary" icon={<Pencil size={15} />} onClick={() => navigate(`/coaches/${coach.id}/edit`)}>
          Edit Coach
        </Button>
      </div>

      <GlassCard style={{ marginBottom: 24 }}>
        <div className={styles.headerInfo}>
          <h1 className={styles.name}>{user?.name ?? "Unnamed coach"}</h1>
          <div className={styles.metaRow}>
            <span className="text-caption">{profile.level}</span>
            <StatusBadge
              label={coach.status === "active" ? "Active" : "Inactive"}
              tone={coach.status === "active" ? "success" : "neutral"}
            />
            {profile.specialization && <span className="text-caption">{profile.specialization}</span>}
            {coach.createdAt && <span className="text-caption">Coach since {formatDate(coach.createdAt)}</span>}
          </div>
        </div>
      </GlassCard>

      <div className={styles.tabsRow}>
        <Tabs tabs={TABS} active={tab} onChange={(key) => setTab(key as TabKey)} />
      </div>

      {tab === "user" &&
        (user ? (
          <CoachUserCard user={user} title="User Profile" />
        ) : (
          <GlassCard>
            <p className="text-caption">The user linked to this coach could not be loaded.</p>
          </GlassCard>
        ))}

      {tab === "coach" && (
        <GlassCard>
          <CoachPhotos
            name={user?.name ?? "Coach"}
            coverUrl={resolveMediaUrl(profile.coverPicture?.url)}
            avatarUrl={resolveMediaUrl(profile.profilePicture?.url)}
          />
          <p className="text-title" style={{ margin: "20px 0" }}>Coach Profile</p>
          <div className={styles.statGrid}>
            <Stat label="Level" value={profile.level} />
            <Stat label="Specialization" value={profile.specialization ?? "—"} />
            <Stat label="Languages" value={profile.languages.length ? profile.languages.join(", ") : "—"} />
            <Stat label="Transformations" value={String(profile.transformations ?? 0)} />
            <Stat label="Available Slots" value={String(profile.availableSlots ?? 0)} />
            <Stat label="Coach Status" value={coach.status === "active" ? "Active" : "Inactive"} />
          </div>
          <p className="text-title" style={{ margin: "24px 0 10px" }}>Description</p>
          <p className="text-secondary" style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {profile.description ?? "No description added."}
          </p>
          <div style={{ display: "flex", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
            {links.map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="text-caption"
                style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Link2 size={14} /> {label}
              </a>
            ))}
            {links.length === 0 && <span className="text-caption">No social links added.</span>}
          </div>
        </GlassCard>
      )}

      {tab === "plans" && <CoachLevelPlans level={profile.level} />}
      {tab === "clients" && <CoachClients coachId={coach.id} />}
    </>
  );
}

/**
 * The coach's OWN cover and profile pictures (never the user's account picture),
 * in the same cover + avatar layout as the coach form. Clicking a picture shows
 * it full screen.
 */
function CoachPhotos({ name, coverUrl, avatarUrl }: { name: string; coverUrl: string | null; avatarUrl: string | null }) {
  const [viewing, setViewing] = useState<{ src: string; alt: string } | null>(null);
  const close = useCallback(() => setViewing(null), []);
  return (
    <div
      onClick={(event) => {
        const target = event.target;
        if (target instanceof HTMLImageElement) setViewing({ src: target.src, alt: target.alt });
      }}
      style={{ cursor: coverUrl || avatarUrl ? "zoom-in" : undefined }}
    >
      <ProfileHeaderEditor readOnly name={name} coverUrl={coverUrl} avatarUrl={avatarUrl} />
      <ImageLightbox open={viewing !== null} src={viewing?.src ?? ""} alt={viewing?.alt ?? ""} onClose={close} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}
