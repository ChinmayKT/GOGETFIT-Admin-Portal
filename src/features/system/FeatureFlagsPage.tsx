import { useEffect, useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Toggle } from "../../components/forms/Toggle";
import { SkeletonRows } from "../../components/feedback/Skeleton";
import { useToast } from "../../components/feedback/ToastProvider";
import { listFeatureFlags, toggleFeatureFlag } from "../../mock/system/featureFlagRepository";
import type { FeatureFlag } from "../../types/system";

export function FeatureFlagsPage() {
  const { show } = useToast();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    listFeatureFlags().then((list) => {
      setFlags(list);
      setLoading(false);
    });
  }, []);

  async function handleToggle(flag: FeatureFlag) {
    const nextEnabled = !flag.enabled;
    setPendingId(flag.id);
    try {
      const updated = await toggleFeatureFlag(flag.id, nextEnabled);
      setFlags((prev) => prev.map((f) => (f.id === flag.id ? updated : f)));
      show(`${flag.name} ${nextEnabled ? "enabled" : "disabled"}`, "success");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Feature Flags"
        breadcrumb={[{ label: "System" }, { label: "Feature Flags" }]}
        description="Roll features out gradually or switch them off instantly without a deploy."
      />

      <GlassCard padding="none">
        {loading ? (
          <div style={{ padding: 20 }}>
            <SkeletonRows rows={6} columns={1} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {flags.map((flag, i) => (
              <div
                key={flag.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "16px 20px",
                  borderBottom: i < flags.length - 1 ? "1px solid var(--glass-border)" : "none",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{flag.name}</span>
                    <StatusBadge
                      label={flag.environment}
                      tone={flag.environment === "All" ? "info" : "warning"}
                      dot={false}
                    />
                  </div>
                  <span className="text-caption">{flag.description}</span>
                </div>
                <Toggle
                  checked={flag.enabled}
                  disabled={pendingId === flag.id}
                  onChange={() => handleToggle(flag)}
                />
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </>
  );
}
