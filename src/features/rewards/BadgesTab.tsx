import { useEffect, useState } from "react";
import { GlassCard } from "../../components/ui/GlassCard";
import { SkeletonCard } from "../../components/feedback/Skeleton";
import { listBadges } from "../../mock/rewards/repository";
import type { Badge } from "../../types/rewards";

export function BadgesTab() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listBadges().then((b) => {
      setBadges(b);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
      {badges.map((b) => (
        <GlassCard key={b.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: b.color,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "var(--fs-title)",
                flexShrink: 0,
              }}
            >
              {b.name.charAt(0)}
            </div>
            <div className="text-primary" style={{ fontWeight: 600 }}>{b.name}</div>
          </div>
          <p className="text-secondary" style={{ fontSize: "var(--fs-label)", marginBottom: 14 }}>{b.criteria}</p>
          <div className="text-caption">{b.earnedCount.toLocaleString("en-IN")} users earned</div>
        </GlassCard>
      ))}
    </div>
  );
}
