import { Wallet, ShoppingCart, Receipt } from "lucide-react";
import { GlassCard } from "../../../components/ui/GlassCard";
import { MetricCard } from "../../../components/charts/MetricCard";
import { LineChart } from "../../../components/charts/LineChart";
import { commerceKpis, revenueTrend } from "../../../mock/analytics/data";
import { formatCurrencyINR } from "../../../utils/format";
import styles from "../AnalyticsPage.module.css";

export function CommerceSection() {
  const kpis = commerceKpis();
  const trend = revenueTrend();
  // The shared LineChart's Y-axis has a fixed 40px width, which clips 5-6 digit tick labels
  // (e.g. renders "90,000" as "000"). Monthly revenue is comfortably in that range, so the
  // chart displays thousands of rupees while the KPI cards above keep the true rupee totals.
  const trendInThousands = trend.map((m) => ({ ...m, "Revenue (₹'000)": Math.round(Number(m.Revenue) / 100) / 10 }));

  return (
    <>
      <div className={styles.kpiGrid3}>
        <MetricCard
          label="Total Revenue"
          value={formatCurrencyINR(kpis.totalRevenue)}
          comparison="All orders to date"
          sparklineData={[20, 35, 28, 42, 38, 50, 60]}
          icon={<Wallet size={16} />}
        />
        <MetricCard
          label="Orders This Month"
          value={String(kpis.ordersThisMonth)}
          comparison="Created this calendar month"
          sparklineData={[8, 12, 10, 14, 13, 15, kpis.ordersThisMonth]}
          icon={<ShoppingCart size={16} />}
        />
        <MetricCard
          label="Avg Order Value"
          value={formatCurrencyINR(kpis.avgOrderValue)}
          comparison="Revenue / total orders"
          sparklineData={[1800, 2000, 1900, 2100, 2050, 2200, kpis.avgOrderValue]}
          icon={<Receipt size={16} />}
        />
      </div>

      <GlassCard>
        <p className="text-title" style={{ marginBottom: 16 }}>Revenue Trend (6 months, ₹ thousands)</p>
        <LineChart data={trendInThousands} xKey="month" series={[{ key: "Revenue (₹'000)", label: "Revenue (₹'000)" }]} height={280} />
      </GlassCard>
    </>
  );
}
