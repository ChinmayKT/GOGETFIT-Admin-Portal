import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { EmptyState } from "../../components/feedback/EmptyState";
import { getGogetfitPlan } from "../../mock/gogetfitPlans/repository";
import { formatCurrencyINR } from "../../utils/format";
import type { GogetfitPlan, PlanTier } from "../../types/gogetfitPlans";
import styles from "../users/UserFormPage.module.css";

const TIER_TONE: Record<PlanTier, StatusTone> = { Solo: "info", Couples: "orange", Family: "success" };

export function GogetfitPlanViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<GogetfitPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getGogetfitPlan(id).then((p) => {
      if (cancelled) return;
      setPlan(p);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <GlassCard>
        <SkeletonProfile />
      </GlassCard>
    );
  }
  if (!plan) return <EmptyState title="Plan not found" />;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <button className={styles.backLink} style={{ marginBottom: 0 }} onClick={() => navigate("/content/gogetfit-plans")}>
          <ArrowLeft size={14} /> Back to GOGETFIT Plans
        </button>
        <Button variant="primary" icon={<Pencil size={15} />} onClick={() => navigate(`/content/gogetfit-plans/${plan.id}/edit`)}>
          Edit Plan
        </Button>
      </div>

      <PageHeader
        title={plan.name}
        breadcrumb={[{ label: "Content", path: "/content/gogetfit-plans" }, { label: "GOGETFIT Plans", path: "/content/gogetfit-plans" }, { label: plan.name }]}
        actions={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <StatusBadge label={plan.tier} tone={TIER_TONE[plan.tier]} />
            <span className="text-numeric" style={{ fontSize: 22 }}>{formatCurrencyINR(plan.price)}</span>
          </div>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <GlassCard>
          <p className="text-secondary" style={{ lineHeight: 1.7 }}>{plan.description}</p>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 16 }}>{plan.duration} plan includes</p>
          <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {plan.includes.map((item, i) => (
              <li key={i} style={{ display: "flex", gap: 10, lineHeight: 1.6 }}>
                <span style={{ color: "var(--ggf-orange)" }}>•</span>
                <span className="text-secondary">{item}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 16 }}>What next, once you've enrolled?</p>
          <ol style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {plan.nextSteps.map((item, i) => (
              <li key={i} style={{ display: "flex", gap: 10, lineHeight: 1.6 }}>
                <span style={{ color: "var(--ggf-orange)", fontWeight: 700 }}>{i + 1}.</span>
                <span className="text-secondary">{item}</span>
              </li>
            ))}
          </ol>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 16 }}>Terms and conditions</p>
          <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {plan.terms.map((item, i) => (
              <li key={i} style={{ display: "flex", gap: 10, lineHeight: 1.6 }}>
                <span style={{ color: "var(--ggf-orange)" }}>•</span>
                <span className="text-secondary">{item}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 10 }}>Eligibility</p>
          <p className="text-secondary" style={{ lineHeight: 1.6 }}>{plan.eligibility}</p>
        </GlassCard>
      </div>
    </>
  );
}
