import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil, ArrowLeft } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { Avatar } from "../../components/ui/Avatar";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { Tabs } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { LineChart } from "../../components/charts/LineChart";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { EmptyState } from "../../components/feedback/EmptyState";
import { getUser } from "../../mock/users/repository";
import { formatDate, timeAgo, age } from "../../utils/format";
import type { AppUser } from "../../types/user";
import styles from "./UserDetailPage.module.css";

const STATUS_TONE: Record<string, StatusTone> = { Active: "success", Inactive: "neutral", Pending: "warning" };

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

function generateWeightHistory(currentWeight: number) {
  const points = [];
  let w = currentWeight + 6;
  for (let i = 11; i >= 0; i--) {
    w -= Math.random() * 1.2 - 0.3;
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    points.push({ month: d.toLocaleDateString("en-IN", { month: "short" }), weight: Math.round(w * 10) / 10 });
  }
  points[points.length - 1].weight = currentWeight;
  return points;
}

export function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getUser(id)
      .then((u) => setUser(u))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const weightHistory = useMemo(() => (user ? generateWeightHistory(user.weightKg) : []), [user]);

  if (loading) {
    return (
      <GlassCard>
        <SkeletonProfile />
      </GlassCard>
    );
  }
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;
  if (!user) return <EmptyState title="User not found" description="This user may have been removed." />;

  const bmi = (user.weightKg / ((user.heightCm / 100) ** 2)).toFixed(1);

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
        <Avatar name={`${user.firstName} ${user.lastName}`} size="xl" />
        <div className={styles.headerInfo}>
          <h1 className={styles.name}>
            {user.firstName} {user.lastName}
          </h1>
          <div className={styles.metaRow}>
            <span className="text-caption">{user.ggfId}</span>
            <StatusBadge label={user.status} tone={STATUS_TONE[user.status]} />
            <span className="text-caption">Coach: {user.coachName ?? "Unassigned"}</span>
            <span className="text-caption">Joined {formatDate(user.joinedAt)}</span>
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
              <Stat label="Age" value={`${age(user.dob)} yrs`} />
              <Stat label="Gender" value={user.gender} />
              <Stat label="Height" value={`${user.heightCm} cm`} />
              <Stat label="Weight" value={`${user.weightKg} kg`} />
              <Stat label="BMI" value={bmi} />
              <Stat label="Body Fat" value={`${user.bodyFatPct}%`} />
              <Stat label="BMR" value={`${user.bmr} cal/day`} />
              <Stat label="TDEE" value={`${user.tdee} cal/day`} />
              <Stat label="Goal" value={user.goal} />
              <Stat label="Streak" value={`${user.streakDays} days`} />
              <Stat label="Last Active" value={timeAgo(user.lastActiveAt)} />
              <Stat label="Plan" value={user.planName ?? "Not assigned"} />
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-title" style={{ marginBottom: 12 }}>
              Weight Trend — Last 12 Months
            </p>
            <LineChart data={weightHistory} xKey="month" series={[{ key: "weight", label: "Weight (kg)" }]} height={240} yDomain="tight" />
          </GlassCard>
        </div>
      )}

      {tab !== "overview" && (
        <GlassCard>
          <EmptyState
            title={`No ${TABS.find((t) => t.key === tab)?.label.toLowerCase()} recorded yet`}
            description="Data for this tab will appear here once the user has activity in this area."
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
