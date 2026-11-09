import { useEffect, useState } from "react";
import { GlassCard } from "../../components/ui/GlassCard";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ErrorState } from "../../components/feedback/ErrorState";
import { SkeletonRows } from "../../components/feedback/Skeleton";
import { getActivity } from "../../api/ambassadors";
import { formatDateTime } from "../../utils/format";
import type { AmbassadorActivity } from "../../types/ambassador";
import styles from "./Ambassadors.module.css";

/** What happened to this ambassador and their code, newest first, and who did it. */
export function ActivityLogTab({ ambassadorId }: { ambassadorId: string }) {
  const [rows, setRows] = useState<AmbassadorActivity[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setRows(null);
    setFailed(false);
    getActivity(ambassadorId)
      .then((r) => live && setRows(r))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [ambassadorId, attempt]);

  return (
    <GlassCard>
      {failed ? (
        <ErrorState onRetry={() => setAttempt((a) => a + 1)} />
      ) : rows === null ? (
        <SkeletonRows rows={6} columns={3} />
      ) : rows.length === 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <ol className={styles.timeline} aria-label="Activity log">
          {rows.map((r) => (
            <li key={r.id} className={styles.timelineItem}>
              <span className={styles.timelineDot} aria-hidden="true" />
              <span className={styles.whoText}>
                <span className={styles.timelineAction}>{r.action}</span>
                <span className={styles.sub}>{r.detail}</span>
              </span>
              <span className={styles.timelineMeta}>
                {formatDateTime(r.at)}
                <br />
                by {r.actor}
              </span>
            </li>
          ))}
        </ol>
      )}
    </GlassCard>
  );
}
