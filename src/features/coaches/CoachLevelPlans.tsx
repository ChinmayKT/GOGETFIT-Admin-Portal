import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "../../components/ui/GlassCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { listGogetfitPlans } from "../../api/gogetfitPlans";
import { formatCurrencyINR } from "../../utils/format";
import type { GogetfitPlanRow } from "../../types/gogetfitPlans";

type LevelPlans = { status: "loading" } | { status: "error" } | { status: "ready"; plans: GogetfitPlanRow[]; total: number };

/**
 * The active GoGetFit Plans of one level - which is exactly what a coach of that
 * level offers. Derived from the level; nothing is assigned to the coach.
 */
export function useLevelPlans(level: string | null | undefined): LevelPlans | null {
  const [state, setState] = useState<LevelPlans | null>(null);
  useEffect(() => {
    if (!level) {
      setState(null);
      return;
    }
    let stale = false;
    setState({ status: "loading" });
    listGogetfitPlans({ coachLevel: level, status: "active", page: 1, pageSize: 100, sortKey: "createdAt", sortDir: "asc" })
      .then((res) => !stale && setState({ status: "ready", plans: res.rows, total: res.total }))
      .catch(() => !stale && setState({ status: "error" }));
    return () => {
      stale = true;
    };
  }, [level]);
  return state;
}

export const planCountLabel = (n: number, level: string) =>
  `${n} active ${level} plan${n === 1 ? "" : "s"}`;

/** Read-only: the plans a coach offers, because of the coach's level. */
export function CoachLevelPlans({ level }: { level: string }) {
  const state = useLevelPlans(level);

  return (
    <GlassCard>
      <p className="text-title" style={{ marginBottom: 4 }}>Available GoGetFit Plans</p>
      <p className="text-caption" style={{ marginBottom: 16 }}>
        Every active {level} plan is offered by this coach automatically. Change the coach level to change them.
      </p>
      {state?.status === "loading" && <p className="text-caption" role="status">Loading plans...</p>}
      {state?.status === "error" && <p className="text-caption" role="alert">Could not load the plans for {level}.</p>}
      {state?.status === "ready" && (
        <>
          <p style={{ fontWeight: 600, marginBottom: 12 }} data-testid="coach-plan-count">
            {planCountLabel(state.total, level)}
          </p>
          {state.plans.length === 0 ? (
            <p className="text-caption">
              There are no active {level} plans, so members see no plans for this coach.{" "}
              <Link to="/content/gogetfit-plans/new">Add a plan</Link>
            </p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {state.plans.map((p) => (
                <Link
                  key={p.id}
                  to={`/content/gogetfit-plans/${p.id}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto auto auto",
                    gap: 16,
                    alignItems: "center",
                    padding: "10px 12px",
                    border: "1px solid var(--glass-border)",
                    borderRadius: 12,
                    color: "inherit",
                    textDecoration: "none",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <StatusBadge label={p.planType} tone={p.planType === "Challenge" ? "orange" : "info"} dot={false} />
                  <span className="text-caption">{p.durationWeeks} weeks · {p.personsAllowed} person{p.personsAllowed === 1 ? "" : "s"}</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrencyINR(p.pricing.basePrice)}</span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
}
