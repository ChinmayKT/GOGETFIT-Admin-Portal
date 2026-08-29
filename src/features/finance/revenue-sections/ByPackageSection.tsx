import { useMemo } from "react";
import { GlassCard } from "../../../components/ui/GlassCard";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { revenueByPackage } from "../../../mock/finance/repository";
import { formatCurrencyINR } from "../../../utils/format";
import styles from "../RevenueAnalyticsPage.module.css";

export function ByPackageSection() {
  const byPackage = useMemo(() => revenueByPackage(), []);
  const maxRevenue = Math.max(1, ...byPackage.map((p) => p.revenue));

  return (
    <GlassCard>
      <p className="text-title" style={{ marginBottom: 16 }}>Revenue by Package</p>
      <p className={styles.note} style={{ marginTop: 0, marginBottom: 16 }}>
        Every package with recognized revenue, ranked highest to lowest — the full list, not just the top few.
      </p>

      {byPackage.length === 0 ? (
        <EmptyState title="No package revenue yet" description="Revenue by package will show up here once payments are recorded." />
      ) : (
        <div className={styles.rankList}>
          {byPackage.map((p, i) => (
            <div key={p.packageId} className={styles.rankRow}>
              <span className={styles.rankIndex}>{i + 1}</span>
              <div className={styles.rankInfo}>
                <div className={styles.rankTop}>
                  <span className={styles.rankName}>{p.packageName}</span>
                  <span className="text-numeric" style={{ fontSize: 14 }}>{formatCurrencyINR(p.revenue)}</span>
                </div>
                <div className={styles.rankBarTrack}>
                  <div className={styles.rankBarFill} style={{ width: `${(p.revenue / maxRevenue) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
