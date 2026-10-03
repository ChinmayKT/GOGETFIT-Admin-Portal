import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, RotateCcw } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { useToast } from "../../components/feedback/ToastProvider";
import { ApiError } from "../../api/client";
import { getGogetfitPlan, restoreGogetfitPlan } from "../../api/gogetfitPlans";
import { formatCurrencyINR, formatDate } from "../../utils/format";
import type { GogetfitPlan } from "../../types/gogetfitPlans";
import styles from "../users/UserDetailPage.module.css";
import { PlanCover } from "./PlanCover";

/** Read-only view of one plan: the legacy form's fields, laid out for reading. */
export function GogetfitPlanViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const [plan, setPlan] = useState<GogetfitPlan | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "notFound" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState("loading");
    getGogetfitPlan(id)
      .then((p) => {
        if (cancelled) return;
        setPlan(p);
        setState("ready");
      })
      .catch((cause) => {
        if (cancelled) return;
        setState(cause instanceof ApiError && cause.status === 404 ? "notFound" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  async function restore() {
    if (!plan) return;
    setRestoring(true);
    try {
      setPlan(await restoreGogetfitPlan(plan.id));
      show(`"${plan.name}" restored`);
    } catch {
      show("Could not restore the plan. Please try again.", "error");
    } finally {
      setRestoring(false);
    }
  }

  const back = (
    <button className={styles.backLink} onClick={() => navigate("/content/gogetfit-plans")}>
      <ArrowLeft size={14} /> Back to GOGETFIT Plans
    </button>
  );

  if (state === "loading") return <GlassCard><SkeletonProfile /></GlassCard>;
  if (state === "notFound") return <>{back}<ErrorState title="Plan not found" description="This plan does not exist." /></>;
  if (state === "error" || !plan) return <>{back}<ErrorState description="We couldn't load this plan." onRetry={() => setAttempt((n) => n + 1)} /></>;

  const archived = plan.status === "archived";
  const sections: [string, string | null][] = [
    ["Description", plan.content.description],
    ["Package Inclusions", plan.content.inclusions],
    ["What Next", plan.content.whatNext],
    ["Terms and Conditions", plan.content.termsAndConditions],
    ["Eligibility", plan.content.eligibility],
  ];

  return (
    <>
      <div className={styles.topRow}>
        {back}
        {archived ? (
          <Button variant="primary" icon={<RotateCcw size={15} />} loading={restoring} onClick={restore}>Restore Plan</Button>
        ) : (
          <Button variant="primary" icon={<Pencil size={15} />} onClick={() => navigate(`/content/gogetfit-plans/${plan.id}/edit`)}>
            Edit Plan
          </Button>
        )}
      </div>

      <PageHeader
        title={plan.name}
        breadcrumb={[{ label: "Content", path: "/content/gogetfit-plans" }, { label: "GOGETFIT Plans", path: "/content/gogetfit-plans" }, { label: plan.name }]}
      />

      <div style={{ display: "grid", gap: 24 }}>
        <PlanCover image={plan.image} name={plan.name} width="100%" />
        <GlassCard>
          <div className={styles.metaRow} style={{ marginBottom: 20 }}>
            <StatusBadge label={plan.planType} tone={plan.planType === "Challenge" ? "orange" : "info"} dot={false} />
            <StatusBadge label={archived ? "Deleted" : "Active"} tone={archived ? "neutral" : "success"} />
            {archived && plan.deletedAt && <span className="text-caption">Deleted {formatDate(plan.deletedAt)}</span>}
          </div>
          <div className={styles.statGrid}>
            <Stat label="Plan Level" value={plan.coachLevel ?? "—"} />
            <Stat label="Duration" value={`${plan.durationWeeks} weeks`} />
            <Stat label="Persons Allowed" value={String(plan.personsAllowed)} />
            <Stat label="Base Price (incl. of taxes)" value={formatCurrencyINR(plan.pricing.basePrice)} />
            {plan.planType === "Challenge" && (
              <Stat label="Reward (Refund Money)" value={plan.pricing.reward !== null ? formatCurrencyINR(plan.pricing.reward) : "—"} />
            )}
            {plan.legacyPackageId !== null && <Stat label="Legacy Package ID" value={String(plan.legacyPackageId)} />}
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 16 }}>Description Info</p>
          <div style={{ display: "grid", gap: 20 }}>
            {sections.map(([label, value]) => (
              <div key={label}>
                <p className="text-label" style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
                <p className="text-secondary" style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{value ?? "—"}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}
