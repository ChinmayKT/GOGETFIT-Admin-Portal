import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { EmptyState } from "../../components/feedback/EmptyState";
import { getPayment } from "../../mock/finance/repository";
import { formatCurrencyINR, formatDateTime } from "../../utils/format";
import type { Payment } from "../../types/finance";
import styles from "../users/UserDetailPage.module.css";

const STATUS_TONE: Record<string, StatusTone> = {
  Success: "success",
  Pending: "warning",
  Failed: "error",
  Refunded: "neutral",
  "Partially Refunded": "neutral",
};

const TIMELINE_STEPS = [
  "Payment Initiated",
  "Payment Processing",
  "Payment Captured",
  "Enrollment Created",
  "Coach Assigned",
];

type StepState = "done" | "current" | "error" | "pending";

function stepStatesFor(status: Payment["status"]): StepState[] {
  // Illustrative only — not driven by real event data.
  if (status === "Failed") {
    return ["done", "error", "pending", "pending", "pending"];
  }
  if (status === "Pending") {
    return ["done", "current", "pending", "pending", "pending"];
  }
  // Success, Refunded, Partially Refunded all imply the payment fully completed at the time.
  return ["done", "done", "done", "done", "done"];
}

export function PaymentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    getPayment(id)
      .then((p) => setPayment(p))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <GlassCard><SkeletonProfile /></GlassCard>;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;
  if (!payment) return <EmptyState title="Payment not found" />;

  const stepStates = stepStatesFor(payment.status);

  return (
    <>
      <button className={styles.backLink} onClick={() => navigate("/finance/payments")} style={{ marginBottom: "var(--space-4)" }}>
        <ArrowLeft size={14} /> Back to Payments
      </button>

      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.name}>{payment.paymentNumber}</h1>
          <div className={styles.metaRow}>
            <span className="text-caption">{payment.packageName}</span>
            <StatusBadge label={payment.status} tone={STATUS_TONE[payment.status]} />
          </div>
        </div>
      </div>

      <GlassCard>
        <p className="text-title" style={{ marginBottom: 16 }}>Payment Info</p>
        <div className={styles.statGrid}>
          <Stat label="Payment ID" value={payment.paymentNumber} />
          <Stat label="Transaction Ref" value={payment.transactionRef} />
          <Stat label="Client" value={payment.clientName} />
          <Stat label="Coach" value={payment.coachName} />
          <Stat label="Package" value={payment.packageName} />
          <Stat label="Original Amount" value={formatCurrencyINR(payment.originalAmount)} />
          <Stat label="Discount" value={formatCurrencyINR(payment.discount)} />
          <Stat label="Final Amount" value={formatCurrencyINR(payment.finalAmount)} />
          <Stat label="Method" value={payment.method} />
          <Stat label="Gateway" value={payment.gateway} />
          <Stat label="Status" value={payment.status} />
          <Stat label="Created At" value={formatDateTime(payment.createdAt)} />
        </div>
      </GlassCard>

      <GlassCard style={{ marginTop: "var(--space-5)" }}>
        <p className="text-title" style={{ marginBottom: 16 }}>Payment Timeline</p>
        <div style={{ position: "relative" }}>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 11,
              top: 6,
              bottom: 6,
              width: 2,
              background: "var(--glass-border)",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {TIMELINE_STEPS.map((label, i) => (
              <TimelineStep key={label} label={label} state={stepStates[i]} />
            ))}
          </div>
        </div>
      </GlassCard>
    </>
  );
}

function TimelineStep({ label, state }: { label: string; state: StepState }) {
  const color =
    state === "done" ? "var(--color-success, #34c759)"
    : state === "current" ? "var(--ggf-orange)"
    : state === "error" ? "var(--color-error, #ff453a)"
    : "var(--glass-border)";

  return (
    <div style={{ display: "flex", gap: 16, position: "relative", paddingLeft: 24, alignItems: "center" }}>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: state === "pending" ? "var(--glass-fill)" : color,
          border: state === "pending" ? "2px solid var(--glass-border)" : "none",
          boxShadow: "0 0 0 3px var(--glass-fill-bright)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {state === "done" && <Check size={13} color="#fff" strokeWidth={3} />}
        {state === "error" && <X size={13} color="#fff" strokeWidth={3} />}
      </span>
      <span
        style={{
          color: state === "pending" ? "var(--text-muted)" : "var(--text-primary)",
          fontWeight: state === "current" ? 600 : 500,
        }}
      >
        {label}
        {state === "current" && <span className="text-caption" style={{ marginLeft: 8 }}>In progress</span>}
        {state === "error" && <span className="text-caption" style={{ marginLeft: 8, color: "var(--color-error, #ff453a)" }}>Failed</span>}
      </span>
    </div>
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
