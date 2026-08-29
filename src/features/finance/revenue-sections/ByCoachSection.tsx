import { useMemo } from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "../../../components/ui/GlassCard";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { coachFinancialPerformanceList } from "../../../mock/finance/repository";
import { formatCurrencyINR } from "../../../utils/format";
import styles from "../RevenueAnalyticsPage.module.css";

export function ByCoachSection() {
  const top10 = useMemo(() => coachFinancialPerformanceList().slice(0, 10), []);
  const maxRevenue = Math.max(1, ...top10.map((c) => c.revenue));

  return (
    <GlassCard>
      <div className={styles.chartHeader}>
        <p className="text-title">Revenue by Coach</p>
        <Link to="/finance/coaches" className="text-caption">Full coach performance →</Link>
      </div>
      <p className={styles.note} style={{ marginTop: 0, marginBottom: 16 }}>
        Top 10 coaches by revenue — a quick preview. Visit Coach Performance for the complete breakdown.
      </p>

      {top10.length === 0 ? (
        <EmptyState title="No coach revenue yet" description="Revenue by coach will show up here once payments are recorded." />
      ) : (
        <div className={styles.rankList} style={{ maxHeight: "none" }}>
          {top10.map((c, i) => (
            <div key={c.coachId} className={styles.rankRow}>
              <span className={styles.rankIndex}>{i + 1}</span>
              <div className={styles.rankInfo}>
                <div className={styles.rankTop}>
                  <span className={styles.rankName}>{c.coachName}</span>
                  <span className="text-numeric" style={{ fontSize: 14 }}>{formatCurrencyINR(c.revenue)}</span>
                </div>
                <div className={styles.rankBarTrack}>
                  <div className={styles.rankBarFill} style={{ width: `${(c.revenue / maxRevenue) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
