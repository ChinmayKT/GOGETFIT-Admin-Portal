import { useMemo } from "react";
import { GlassCard } from "../../../components/ui/GlassCard";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { revenueByBusinessType } from "../../../mock/finance/repository";
import { formatCurrencyINR } from "../../../utils/format";
import styles from "../RevenueAnalyticsPage.module.css";

export function NewVsRenewalSection() {
  const byType = useMemo(() => revenueByBusinessType(), []);
  const newValue = byType.find((c) => c.label === "Coaching Plans")?.value ?? 0;
  const renewalValue = byType.find((c) => c.label === "Renewals")?.value ?? 0;
  const total = newValue + renewalValue;
  const newPct = total > 0 ? (newValue / total) * 100 : 0;
  const renewalPct = total > 0 ? (renewalValue / total) * 100 : 0;

  return (
    <GlassCard>
      <p className="text-title" style={{ marginBottom: 8 }}>New Enrollments vs. Renewals</p>
      <p className={styles.note} style={{ marginTop: 0, marginBottom: 0 }}>
        Split of recognized revenue between first-time coaching plan enrollments and subscription renewals.
      </p>

      {total === 0 ? (
        <EmptyState title="No enrollment or renewal revenue yet" />
      ) : (
        <>
          <div className={styles.splitBar}>
            <div className={styles.splitSegmentNew} style={{ width: `${newPct}%` }} />
            <div className={styles.splitSegmentRenewal} style={{ width: `${renewalPct}%` }} />
          </div>

          <div className={styles.splitLegend}>
            <div className={styles.splitStat}>
              <div className={styles.splitStatHeader}>
                <span className={styles.splitDot} style={{ background: "var(--ggf-orange)" }} />
                <span className={styles.splitStatLabel}>New Enrollments</span>
              </div>
              <span className={`text-numeric ${styles.splitStatValue}`}>{formatCurrencyINR(newValue)}</span>
              <span className={styles.splitStatSub}>{newPct.toFixed(1)}% of new + renewal revenue</span>
            </div>
            <div className={styles.splitStat}>
              <div className={styles.splitStatHeader}>
                <span className={styles.splitDot} style={{ background: "#3987e5" }} />
                <span className={styles.splitStatLabel}>Renewals</span>
              </div>
              <span className={`text-numeric ${styles.splitStatValue}`}>{formatCurrencyINR(renewalValue)}</span>
              <span className={styles.splitStatSub}>{renewalPct.toFixed(1)}% of new + renewal revenue</span>
            </div>
          </div>
        </>
      )}
    </GlassCard>
  );
}
