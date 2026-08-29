import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Link2, FileBadge } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { ProfileHeaderEditor } from "../../components/media/ProfileHeaderEditor";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { Tabs } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { EmptyState } from "../../components/feedback/EmptyState";
import { getCoach } from "../../mock/coaches/repository";
import { MOCK_CLIENTS } from "../../mock/users/clientsData";
import { formatDate } from "../../utils/format";
import type { Coach } from "../../types/coach";
import type { Client } from "../../types/user";
import styles from "../users/UserDetailPage.module.css";

const STATUS_TONE: Record<string, StatusTone> = { Active: "success", "Pending Approval": "warning", Inactive: "neutral" };

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "clients", label: "Clients" },
  { key: "plans", label: "Plans" },
  { key: "performance", label: "Performance" },
  { key: "certificates", label: "Certificates" },
  { key: "activity", label: "Activity" },
];

export function CoachDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCoach(id).then((c) => setCoach(c)).catch(() => setError(true)).finally(() => setLoading(false));
  }, [id]);

  const clients = useMemo(() => MOCK_CLIENTS.filter((c) => c.coachId === id), [id]);

  const clientColumns: Column<Client>[] = [
    { key: "clientName", header: "Client" },
    { key: "planName", header: "Plan" },
    { key: "status", header: "Status", render: (c) => <StatusBadge label={c.status} tone={c.status === "Active" ? "success" : "neutral"} /> },
    { key: "startDate", header: "Start", render: (c) => formatDate(c.startDate) },
  ];

  if (loading) return <GlassCard><SkeletonProfile /></GlassCard>;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;
  if (!coach) return <EmptyState title="Coach not found" />;

  return (
    <>
      <div className={styles.topRow}>
        <button className={styles.backLink} onClick={() => navigate("/coaches")}>
          <ArrowLeft size={14} /> Back to Coaches
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" icon={<FileBadge size={15} />} onClick={() => navigate(`/coaches/${coach.id}/certificates`)}>
            Certificates
          </Button>
          <Button variant="primary" icon={<Pencil size={15} />} onClick={() => navigate(`/coaches/${coach.id}/edit`)}>
            Edit Coach
          </Button>
        </div>
      </div>

      <GlassCard padding="none" style={{ padding: "20px 20px 24px", marginBottom: 24 }}>
        <ProfileHeaderEditor
          readOnly
          name={`${coach.firstName} ${coach.lastName}`}
          coverUrl={coach.coverPhoto}
          avatarUrl={coach.profilePicture}
        />
        <div>
          <h1 className={styles.name}>{coach.firstName} {coach.lastName}</h1>
          <div className={styles.metaRow} style={{ marginTop: 6 }}>
            <span className="text-caption">Level {coach.level}</span>
            <StatusBadge label={coach.status} tone={STATUS_TONE[coach.status]} />
            <span className="text-caption">{coach.specialization}</span>
            <span className="text-caption">{coach.city}, {coach.state}</span>
            <span className="text-caption">Joined {formatDate(coach.joinedAt)}</span>
          </div>
        </div>
      </GlassCard>

      <div className={styles.tabsRow}>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === "overview" && (
        <div className={styles.overviewGrid}>
          <GlassCard className={styles.statsCard}>
            <div className={styles.statGrid}>
              <Stat label="Active Clients" value={String(coach.activeClients)} />
              <Stat label="Pending Clients" value={String(coach.pendingClients)} />
              <Stat label="Available Slots" value={String(coach.availableSlots)} />
              <Stat label="Transformations" value={String(coach.transformationsCount)} />
              <Stat label="Languages" value={coach.languages.join(", ")} />
              <Stat label="Email" value={coach.email} />
              <Stat label="Phone" value={coach.phone} />
              <Stat label="Certificates" value={String(coach.certificates.length)} />
            </div>
          </GlassCard>
          <GlassCard>
            <p className="text-title" style={{ marginBottom: 10 }}>About</p>
            <p className="text-secondary" style={{ lineHeight: 1.6 }}>{coach.description}</p>
            <div style={{ display: "flex", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
              {coach.facebook && <a href={coach.facebook} target="_blank" rel="noreferrer" className="text-caption" style={{ display: "flex", alignItems: "center", gap: 4 }}><Link2 size={14} /> Facebook</a>}
              {coach.instagram && <a href={coach.instagram} target="_blank" rel="noreferrer" className="text-caption" style={{ display: "flex", alignItems: "center", gap: 4 }}><Link2 size={14} /> Instagram</a>}
              {coach.linkedin && <a href={coach.linkedin} target="_blank" rel="noreferrer" className="text-caption" style={{ display: "flex", alignItems: "center", gap: 4 }}><Link2 size={14} /> LinkedIn</a>}
              {!coach.facebook && !coach.instagram && !coach.linkedin && <span className="text-caption">No social links added.</span>}
            </div>
          </GlassCard>
        </div>
      )}

      {tab === "clients" && (
        <DataTable
          columns={clientColumns}
          rows={clients}
          getRowId={(c) => c.id}
          emptyTitle="No clients assigned"
          emptyDescription="This coach doesn't have any active clients yet."
        />
      )}

      {tab === "certificates" && (
        <GlassCard>
          {coach.certificates.length === 0 ? (
            <EmptyState title="No certificates uploaded" description="Add certification documents for this coach." action={
              <Button variant="primary" onClick={() => navigate(`/coaches/${coach.id}/certificates`)}>Upload Certificate</Button>
            } />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {coach.certificates.map((cert) => (
                <div key={cert.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--glass-border)" }}>
                  <span>{cert.fileName}</span>
                  <span className="text-caption">{formatDate(cert.uploadedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {["plans", "performance", "activity"].includes(tab) && (
        <GlassCard>
          <EmptyState title={`No ${tab} data yet`} description="This section will populate as the coach's history grows." />
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
