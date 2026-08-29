import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Users, Film, Star } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { EmptyState } from "../../components/feedback/EmptyState";
import { getChallenge, listParticipants } from "../../mock/challenges/repository";
import { deriveChallengeStatus, CHALLENGE_STATUS_TONE } from "../../mock/challenges/status";
import { formatDate } from "../../utils/format";
import type { Challenge } from "../../types/challenge";
import styles from "../users/UserDetailPage.module.css";

export function ChallengeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getChallenge(id), listParticipants(id, { pageSize: 1 })])
      .then(([c, participants]) => {
        setChallenge(c);
        setParticipantCount(participants.total);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <GlassCard><SkeletonProfile /></GlassCard>;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;
  if (!challenge) return <EmptyState title="Challenge not found" />;

  const status = deriveChallengeStatus(challenge);

  return (
    <>
      <div className={styles.topRow}>
        <button className={styles.backLink} onClick={() => navigate("/challenges")}>
          <ArrowLeft size={14} /> Back to Challenges
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" icon={<Users size={15} />} onClick={() => navigate(`/challenges/${challenge.id}/participants`)}>
            View Participants
          </Button>
          <Button variant="primary" icon={<Pencil size={15} />} onClick={() => navigate(`/challenges/${challenge.id}/edit`)}>
            Edit Challenge
          </Button>
        </div>
      </div>

      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {challenge.priority && <Star size={18} color="var(--color-warning)" fill="var(--color-warning)" />}
            {challenge.name}
          </h1>
          <div className={styles.metaRow}>
            <StatusBadge label={status} tone={CHALLENGE_STATUS_TONE[status]} />
            <StatusBadge label={challenge.priority ? "Priority" : "Normal"} tone={challenge.priority ? "warning" : "neutral"} dot={false} />
            <span className="text-caption">{participantCount} participant{participantCount === 1 ? "" : "s"}</span>
          </div>
        </div>
      </div>

      <div className={styles.overviewGrid}>
        <GlassCard className={styles.statsCard}>
          <div className={styles.statGrid}>
            <Stat label="Start Date" value={formatDate(challenge.startDate)} />
            <Stat label="End Date" value={formatDate(challenge.endDate)} />
            <Stat label="Enrollment Last Date" value={formatDate(challenge.enrollmentLastDate)} />
            <Stat label="Created" value={formatDate(challenge.createdAt)} />
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 10 }}>Description</p>
          <p className="text-secondary" style={{ lineHeight: 1.6 }}>{challenge.description}</p>
        </GlassCard>
      </div>

      <GlassCard style={{ marginTop: "var(--space-5)" }}>
        <p className="text-title" style={{ marginBottom: 16 }}>Sample Video</p>
        {challenge.sampleVideoUrl ? (
          <video controls src={challenge.sampleVideoUrl} style={{ width: "100%", maxWidth: 480, borderRadius: 10, background: "#000" }} />
        ) : (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
            height: 140, maxWidth: 480, borderRadius: 10, border: "1px dashed var(--glass-border)", color: "var(--text-muted)",
          }}>
            <Film size={20} />
            <span className="text-caption">No sample video uploaded yet</span>
          </div>
        )}
      </GlassCard>
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
