import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { Avatar } from "../../components/ui/Avatar";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { GlassModal } from "../../components/ui/GlassModal";
import { Textarea } from "../../components/forms/Textarea";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { EmptyState } from "../../components/feedback/EmptyState";
import { useToast } from "../../components/feedback/ToastProvider";
import { getChallenge, getParticipant, reviewParticipant } from "../../mock/challenges/repository";
import { formatDate } from "../../utils/format";
import type { Challenge, ChallengeParticipant, ReviewDecision } from "../../types/challenge";
import styles from "../users/UserDetailPage.module.css";

const REVIEW_TONE: Record<ReviewDecision, StatusTone> = {
  pending: "neutral",
  approved: "success",
  rejected: "error",
  changes_requested: "warning",
};
const REVIEW_LABEL: Record<ReviewDecision, string> = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes Requested",
};

export function ParticipantDetailPage() {
  const { id, userId } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [participant, setParticipant] = useState<ChallengeParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [confirmApprove, setConfirmApprove] = useState(false);
  const [noteDialog, setNoteDialog] = useState<"rejected" | "changes_requested" | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id || !userId) return;
    setLoading(true);
    Promise.all([getChallenge(id), getParticipant(id, userId)])
      .then(([c, p]) => {
        setChallenge(c);
        setParticipant(p);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, userId]);

  async function submitReview(decision: ReviewDecision, reviewNote: string | null) {
    if (!id || !userId) return;
    setSubmitting(true);
    try {
      const updated = await reviewParticipant(id, userId, decision, reviewNote);
      setParticipant(updated);
      show(`Submission marked as ${REVIEW_LABEL[decision].toLowerCase()}`);
      setConfirmApprove(false);
      setNoteDialog(null);
      setNote("");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <GlassCard><SkeletonProfile /></GlassCard>;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;
  if (!participant) return <EmptyState title="Participant not found" />;

  return (
    <>
      <button className={styles.backLink} onClick={() => navigate(`/challenges/${id}/participants`)} style={{ marginBottom: "var(--space-4)" }}>
        <ArrowLeft size={14} /> Back to Participants
      </button>

      <div className={styles.header}>
        <Avatar name={participant.name} size="xl" />
        <div className={styles.headerInfo}>
          <h1 className={styles.name}>{participant.name}</h1>
          <div className={styles.metaRow}>
            <span className="text-caption">{participant.ggfId}</span>
            <span className="text-caption">{challenge?.name}</span>
            <StatusBadge label={REVIEW_LABEL[participant.reviewDecision]} tone={REVIEW_TONE[participant.reviewDecision]} />
          </div>
        </div>
      </div>

      <div className={styles.overviewGrid}>
        <GlassCard className={styles.statsCard}>
          <div className={styles.statGrid}>
            <Stat label="User Name" value={participant.name} />
            <Stat label="User ID" value={participant.ggfId} />
            <Stat label="Gender" value={participant.gender} />
            <Stat label="Age" value={`${participant.age} yrs`} />
            <Stat label="Height" value={`${participant.heightCm} cm`} />
            <Stat label="Weight" value={`${participant.weightKg} kg`} />
            <Stat label="Joined Date" value={formatDate(participant.joinedDate)} />
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 16 }}>Submitted Video</p>
          {participant.hasSubmittedVideo ? (
            <div
              style={{
                position: "relative", height: 200, borderRadius: 12, overflow: "hidden",
                background: "linear-gradient(135deg, var(--glass-fill-bright), var(--glass-fill))",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
              role="button"
              aria-label="Play submitted video"
            >
              <div style={{
                width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.16)",
                border: "1px solid var(--glass-border)", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Play size={22} fill="currentColor" />
              </div>
              <span className="text-caption" style={{ position: "absolute", bottom: 10, right: 12 }}>Progress video</span>
            </div>
          ) : (
            <EmptyState title="No submission yet" description="This participant hasn't submitted a progress video for this challenge." />
          )}
        </GlassCard>
      </div>

      {participant.reviewNote && (
        <GlassCard style={{ marginTop: "var(--space-5)" }}>
          <p className="text-title" style={{ marginBottom: 8 }}>Review Note</p>
          <p className="text-secondary">{participant.reviewNote}</p>
        </GlassCard>
      )}

      <GlassCard style={{ marginTop: "var(--space-5)" }}>
        <p className="text-title" style={{ marginBottom: 16 }}>Review Submission</p>
        {participant.hasSubmittedVideo ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="primary" icon={<CheckCircle2 size={15} />} onClick={() => setConfirmApprove(true)}>
              Approve
            </Button>
            <Button variant="secondary" icon={<RotateCcw size={15} />} onClick={() => setNoteDialog("changes_requested")}>
              Request Changes
            </Button>
            <Button variant="danger" icon={<XCircle size={15} />} onClick={() => setNoteDialog("rejected")}>
              Reject
            </Button>
          </div>
        ) : (
          <p className="text-caption">Review actions unlock once the participant submits their progress video.</p>
        )}
      </GlassCard>

      <ConfirmDialog
        open={confirmApprove}
        title="Approve submission?"
        description={`Mark ${participant.name}'s submission as approved.`}
        confirmLabel="Approve"
        tone="primary"
        loading={submitting}
        onConfirm={() => submitReview("approved", null)}
        onCancel={() => setConfirmApprove(false)}
      />

      <GlassModal
        open={noteDialog !== null}
        onClose={() => { setNoteDialog(null); setNote(""); }}
        title={noteDialog === "rejected" ? "Reject submission" : "Request changes"}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setNoteDialog(null); setNote(""); }}>Cancel</Button>
            <Button
              variant={noteDialog === "rejected" ? "danger" : "primary"}
              loading={submitting}
              disabled={!note.trim()}
              onClick={() => noteDialog && submitReview(noteDialog, note.trim())}
            >
              {noteDialog === "rejected" ? "Reject" : "Send Request"}
            </Button>
          </>
        }
      >
        <p className="text-secondary" style={{ marginBottom: 12 }}>
          Let {participant.name} know what needs fixing before this submission can be approved.
        </p>
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the participant..." />
      </GlassModal>
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
