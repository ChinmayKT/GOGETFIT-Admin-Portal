import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, ArrowLeft } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { Avatar } from "../../components/ui/Avatar";
import { ImageLightbox } from "../../components/ui/ImageLightbox";
import { resolveMediaUrl } from "../../api/media";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { RoleBadges } from "../../components/ui/RoleBadges";
import { Tabs } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { EmptyState } from "../../components/feedback/EmptyState";
import { getAdminUser } from "../../api/adminUsers";
import { ApiError } from "../../api/client";
import { formatCalendarDay, formatDate } from "../../utils/format";
import type { AccountStatus, AdminUser } from "../../types/admin";
import styles from "./UserDetailPage.module.css";

const STATUS_TONE: Record<AccountStatus, StatusTone> = {
  active: "success",
  inactive: "neutral",
  blocked: "error",
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "profile", label: "Profile" },
  { key: "health", label: "Health" },
  { key: "plans", label: "Plans" },
  { key: "progress", label: "Progress" },
  { key: "activity", label: "Activity" },
  { key: "challenges", label: "Challenges" },
  { key: "rewards", label: "Rewards" },
  { key: "orders", label: "Orders" },
];

const dash = (value: string | number | null | undefined, suffix = "") =>
  value === null || value === undefined || value === "" ? "—" : `${value}${suffix}`;

/** Only meaningful when both measurements are present. */
const bmiOf = (heightCm: number | null, weightKg: number | null) =>
  heightCm && weightKg ? (weightKg / (heightCm / 100) ** 2).toFixed(1) : null;

export function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState("overview");
  const [photoOpen, setPhotoOpen] = useState(false);
  const closePhoto = useCallback(() => setPhotoOpen(false), []);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);

    getAdminUser(id)
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof ApiError && cause.status === 404) setNotFound(true);
        else setError(cause instanceof ApiError ? cause : new ApiError(0, "UNKNOWN_ERROR", "Failed to load"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <GlassCard>
        <SkeletonProfile />
      </GlassCard>
    );
  }

  if (notFound) {
    return <EmptyState title="User not found" description="This user may have been removed." />;
  }

  // A 403 means the session is valid but this account is not an administrator.
  if (error?.isForbidden) {
    return (
      <EmptyState
        title="Not authorised"
        description="Your account does not have permission to view user records."
      />
    );
  }

  if (error) return <ErrorState onRetry={() => window.location.reload()} />;
  if (!user) return <EmptyState title="User not found" description="This user may have been removed." />;

  const fitness = user.profile.fitnessProfile;
  const bmi = bmiOf(fitness.height, fitness.weight);
  const displayName = user.profile.name ?? user.profile.email ?? "Unnamed user";
  const photo = resolveMediaUrl(user.profile.profilePicture);

  return (
    <>
      <div className={styles.topRow}>
        <button className={styles.backLink} onClick={() => navigate("/users")}>
          <ArrowLeft size={14} /> Back to Users
        </button>
        <Button variant="primary" icon={<Pencil size={15} />} onClick={() => navigate(`/users/${user.id}/edit`)}>
          Edit User
        </Button>
      </div>

      <div className={styles.header}>
        {photo ? (
          // The photo opens full screen; without one there is nothing to enlarge.
          <button type="button" className={styles.photoButton} onClick={() => setPhotoOpen(true)} aria-label={`View ${displayName}'s profile photo`}>
            <Avatar name={displayName} src={photo} size="xl" />
          </button>
        ) : (
          <Avatar name={displayName} size="xl" />
        )}
        {photo && <ImageLightbox open={photoOpen} src={photo} alt={`${displayName} - profile photo`} onClose={closePhoto} />}
        <div className={styles.headerInfo}>
          <h1 className={styles.name}>{displayName}</h1>
          <div className={styles.metaRow}>
            <span className="text-caption">{dash(user.phone.normalized)}</span>
            {user.status && <StatusBadge label={user.status[0].toUpperCase() + user.status.slice(1)} tone={STATUS_TONE[user.status]} />}
            {/* Additive roles - all of them, not a single persona. */}
            <RoleBadges roles={user.roles} />
            <span className="text-caption">Joined {user.createdAt ? formatDate(user.createdAt) : "—"}</span>
          </div>
        </div>
      </div>

      <div className={styles.tabsRow}>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === "overview" && (
        <div className={styles.overviewGrid}>
          <GlassCard className={styles.statsCard}>
            <div className={styles.statGrid}>
              <Stat label="Age" value={dash(user.profile.age, " yrs")} />
              <Stat label="Gender" value={dash(user.profile.gender)} />
              <Stat label="City" value={dash(user.profile.city)} />
              <Stat label="Height" value={dash(fitness.height, " cm")} />
              <Stat label="Weight" value={dash(fitness.weight, " kg")} />
              <Stat label="BMI" value={dash(bmi)} />
              <Stat label="Body Fat" value={dash(fitness.bodyFatPercentage, "%")} />
              <Stat label="BMR" value={dash(fitness.bmr, " cal/day")} />
              {/* Total daily energy expenditure, kcal/day. */}
              <Stat label="TDEE" value={dash(fitness.tdee, " cal/day")} />
              <Stat label="Goal" value={dash(fitness.goal)} />
              <Stat label="Activity Level" value={dash(fitness.activityLevel)} />
              <Stat label="Food Type" value={dash(fitness.foodType)} />
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-title" style={{ marginBottom: 12 }}>
              Account
            </p>
            <div className={styles.statGrid}>
              <Stat label="Email" value={dash(user.profile.email)} />
              <Stat label="Email Verified" value={user.profile.isEmailVerified ? "Yes" : "No"} />
              <Stat label="Date of Birth" value={formatCalendarDay(user.profile.dateOfBirth)} />
              <Stat label="Profile" value={user.profileCompleted ? "Complete" : "Incomplete"} />
              <Stat label="Phone (raw)" value={dash(user.phone.raw)} />
              <Stat label="Last Updated" value={user.updatedAt ? formatDate(user.updatedAt) : "—"} />
              {/* Migration aid: which legacy MariaDB row this account came from. */}
              <Stat label="Legacy User ID" value={dash(user.legacy?.userId ?? null)} />
              <Stat label="Legacy Source" value={dash(user.legacy?.source ?? null)} />
            </div>
          </GlassCard>
        </div>
      )}

      {tab !== "overview" && (
        <GlassCard>
          <EmptyState
            title={`No ${TABS.find((t) => t.key === tab)?.label.toLowerCase()} recorded yet`}
            description="The backend does not expose this data yet. It will appear here once the endpoint exists."
          />
        </GlassCard>
      )}
    </>
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
