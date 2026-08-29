import { GlassDrawer } from "../../components/ui/GlassDrawer";
import { LineChart } from "../../components/charts/LineChart";
import { formatDate } from "../../utils/format";
import type { UserMeasurementHistory } from "../../types/progress";

interface Props {
  target: UserMeasurementHistory | null;
  onClose: () => void;
}

export function MeasurementTrendDrawer({ target, onClose }: Props) {
  const latest = target?.history[target.history.length - 1];
  const chartData =
    target?.history.map((h) => ({
      month: new Date(h.date).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      Weight: h.weightKg,
    })) ?? [];

  return (
    <GlassDrawer
      open={!!target}
      onClose={onClose}
      title={target ? `${target.userName} — Measurement Trend` : "Measurement Trend"}
      width={480}
    >
      {target && latest && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div className="text-caption" style={{ marginBottom: 4 }}>User</div>
            <div className="text-primary">{target.userName} · {target.ggfId}</div>
          </div>

          <div>
            <p className="text-title" style={{ marginBottom: 12 }}>Weight Trend</p>
            <LineChart data={chartData} xKey="month" series={[{ key: "Weight", label: "Weight (kg)" }]} height={220} yDomain="tight" />
          </div>

          <div>
            <p className="text-title" style={{ marginBottom: 12 }}>Latest Values</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Stat label="Weight" value={`${latest.weightKg} kg`} />
              <Stat label="Waist" value={`${latest.waistCm} cm`} />
              <Stat label="Chest" value={`${latest.chestCm} cm`} />
              <Stat label="Hips" value={`${latest.hipsCm} cm`} />
              <Stat label="Body Fat" value={`${latest.bodyFatPct}%`} />
              <Stat label="Recorded" value={formatDate(latest.date)} />
            </div>
          </div>
        </div>
      )}
    </GlassDrawer>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span className="text-caption">{label}</span>
      <span className="text-primary" style={{ fontSize: "var(--fs-title)", fontWeight: 600 }}>{value}</span>
    </div>
  );
}
