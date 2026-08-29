import { useMemo } from "react";
import { GlassCard } from "../../../components/ui/GlassCard";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { coachAcquisitionList } from "../../../mock/finance/repository";
import { formatCurrencyINR } from "../../../utils/format";
import styles from "../RevenueAnalyticsPage.module.css";

export function ByAcquisitionSection() {
  const acquisition = useMemo(() => coachAcquisitionList(), []);
  const maxRevenue = Math.max(1, ...acquisition.map((a) => a.acquisitionRevenue));

  return (
    <GlassCard>
      <p className="text-title" style={{ marginBottom: 8 }}>Revenue by Acquisition Source</p>
      <p className={styles.note} style={{ marginTop: 0, marginBottom: 16 }}>
        Coaches are the acquisition channel in this data model — each row is the revenue a coach's newly acquired clients
        (enrolled in the last 90 days) brought in, ranked by number of new clients acquired.
      </p>

      {acquisition.length === 0 ? (
        <EmptyState title="No acquisition data yet" description="New client acquisition by coach will show up here once clients enroll." />
      ) : (
        <div className={styles.rankList}>
          {acquisition.map((a, i) => (
            <div key={a.coachId} className={styles.rankRow}>
              <span className={styles.rankIndex}>{i + 1}</span>
              <div className={styles.rankInfo}>
                <div className={styles.rankTop}>
                  <span className={styles.rankName}>
                    {a.coachName} <span className={styles.rankSub}>· {a.newClientsAcquired} new client{a.newClientsAcquired === 1 ? "" : "s"}</span>
                  </span>
                  <span className="text-numeric" style={{ fontSize: 14 }}>{formatCurrencyINR(a.acquisitionRevenue)}</span>
                </div>
                <div className={styles.rankBarTrack}>
                  <div className={styles.rankBarFill} style={{ width: `${(a.acquisitionRevenue / maxRevenue) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
