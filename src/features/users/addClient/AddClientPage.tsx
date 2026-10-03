import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { PageHeader } from "../../../components/layout/PageHeader";
import { GlassCard } from "../../../components/ui/GlassCard";
import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/feedback/ErrorState";
import { SkeletonForm } from "../../../components/feedback/Skeleton";
import { ApiError } from "../../../api/client";
import { createEnrolledClient, type ManualEnrollmentPricing } from "../../../api/enrolledClients";
import { cn } from "../../../utils/cn";
import {
  STEPS,
  emptyDraft,
  formatPhone,
  inr,
  isStepValid,
  methodLabel,
  pricing,
  toPayload,
  update,
  validateStep,
  type Draft,
  type StepIndex,
} from "./draft";
import { EnrollmentStep, PaymentStep, PaymentSummary, ReviewStep, UserStep, coachName, formatDay, userName } from "./AddClientSteps";
import { useReferenceData } from "./useReferenceData";
import styles from "./AddClientPage.module.css";

/**
 * Add Client - an admin enrolls an EXISTING user (cash / UPI / bank transfer /
 * other), creating one document in enrolledclients via
 * POST /api/admin/enrolled-clients.
 *
 * User → Enrollment → Client: there is no separate "client" record. The price,
 * the coupon discount and the payment status are previewed here but decided by
 * the server; only ids and the admin's own entries are sent.
 */
export function AddClientPage() {
  const navigate = useNavigate();
  const data = useReferenceData();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());
  const [step, setStep] = useState<StepIndex>(0);
  const [creating, setCreating] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ draft: Draft; pricing: ManualEnrollmentPricing } | null>(null);

  const onChange = (patch: Partial<Draft>) => {
    setSubmitError(null);
    setDraft((d) => update(d, patch));
  };
  const { errors } = validateStep(step, draft);
  const valid = isStepValid(step, draft);
  // A later step can be opened from the stepper only when every step before it is complete.
  const reachable = (s: number) => s <= step || ([0, 1, 2] as StepIndex[]).slice(0, s).every((p) => isStepValid(p, draft));

  const createClient = async () => {
    if (!isStepValid(3, draft) || creating) return;
    setCreating(true);
    setSubmitError(null);
    try {
      const result = await createEnrolledClient(toPayload(draft));
      setCreated({ draft, pricing: result.pricing });
    } catch (cause) {
      setSubmitError(cause instanceof ApiError ? cause.message : "Could not create the client. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const startOver = () => {
    setDraft(emptyDraft());
    setStep(0);
    setCreated(null);
    setSubmitError(null);
  };

  const header = (
    <>
      <button className={styles.backLink} onClick={() => navigate("/users/clients")}>
        <ArrowLeft size={14} /> Back to Clients
      </button>
      <PageHeader
        title="Add Client"
        description="Manually onboard an existing user as a client."
        breadcrumb={[{ label: "People", path: "/users" }, { label: "Clients", path: "/users/clients" }, { label: "Add" }]}
      />
    </>
  );

  if (created) {
    const { draft: done, pricing: price } = created;
    return (
      <>
        {header}
        <GlassCard className={styles.success}>
          <CheckCircle2 size={40} className={styles.successIcon} aria-hidden="true" />
          <h2 className={styles.successTitle}>Client Added Successfully</h2>
          <p className="text-caption">{done.user ? userName(done.user) : "The user"} is now enrolled as a client.</p>
          <div className={styles.successFacts}>
            <div>
              <span className={styles.pairLabel}>Plan</span>
              <span className={styles.pairValue}>{done.plan?.name ?? "—"}</span>
            </div>
            <div>
              <span className={styles.pairLabel}>Coach</span>
              <span className={styles.pairValue}>{done.coach ? coachName(done.coach) : "—"}</span>
            </div>
            <div>
              <span className={styles.pairLabel}>Payment</span>
              <span className={styles.pairValue}>
                {inr(price.amountReceived)} · {methodLabel(done.method)}
              </span>
              {done.coupon && (
                <span className="text-caption">
                  {done.coupon.code} · {price.discountPercent}% off
                </span>
              )}
            </div>
          </div>
          <div className={styles.successActions}>
            <Button variant="primary" onClick={() => done.user && navigate(`/users/clients/${done.user.id}`)}>
              View Client
            </Button>
            <Button variant="secondary" onClick={startOver}>
              Add Another Client
            </Button>
            <Button variant="ghost" onClick={() => navigate("/users/clients")}>
              Back to Clients
            </Button>
          </div>
        </GlassCard>
      </>
    );
  }

  if (data.loading) {
    return (
      <>
        {header}
        <GlassCard>
          <SkeletonForm fields={4} />
        </GlassCard>
      </>
    );
  }
  if (data.error) {
    return (
      <>
        {header}
        <ErrorState description="We couldn't load plans, coaches and coupons." onRetry={data.retry} />
      </>
    );
  }

  return (
    <>
      {header}

      <ol className={styles.stepper} aria-label="Progress">
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={label} className={styles.stepItem}>
              <button
                type="button"
                className={cn(styles.stepButton, current && styles.stepCurrent, done && styles.stepDone)}
                aria-current={current ? "step" : undefined}
                disabled={!reachable(i)}
                onClick={() => setStep(i as StepIndex)}
              >
                <span className={styles.stepDot}>{done ? <Check size={12} strokeWidth={3} /> : i + 1}</span>
                <span>{label}</span>
              </button>
              {i < STEPS.length - 1 && <span className={cn(styles.stepLine, done && styles.stepLineDone)} aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      <div className={cn(styles.layout, step === 3 && styles.layoutFull)}>
        <GlassCard className={styles.main}>
          {step === 0 && <UserStep draft={draft} errors={errors} onChange={onChange} />}
          {step === 1 && <EnrollmentStep draft={draft} errors={errors} onChange={onChange} plans={data.plans} coaches={data.coaches} />}
          {step === 2 && <PaymentStep draft={draft} errors={errors} onChange={onChange} coupons={data.coupons} />}
          {step === 3 && <ReviewStep draft={draft} onEdit={setStep} />}

          {submitError && step === 3 && (
            <div className={styles.submitError} role="alert">
              {submitError}
            </div>
          )}

          <div className={styles.footer}>
            <span className="text-caption">{!valid && step < 3 ? "Complete the required fields to continue." : ""}</span>
            <div className={styles.footerActions}>
              {step > 0 && (
                <Button variant="ghost" icon={<ArrowLeft size={15} />} onClick={() => setStep((step - 1) as StepIndex)}>
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button variant="primary" disabled={!valid} onClick={() => setStep((step + 1) as StepIndex)}>
                  Continue <ArrowRight size={15} />
                </Button>
              ) : (
                <Button variant="primary" size="lg" loading={creating} disabled={!valid || creating} onClick={createClient}>
                  Create Client
                </Button>
              )}
            </div>
          </div>
        </GlassCard>

        {step < 3 && <EnrollmentSummary draft={draft} step={step} />}
      </div>
    </>
  );
}

/** The right-hand summary: what is being created, as it is filled in. */
function EnrollmentSummary({ draft, step }: { draft: Draft; step: StepIndex }) {
  const { user, plan, coach } = draft;
  const p = pricing(draft);
  return (
    <GlassCard className={styles.aside}>
      <p className={styles.asideTitle}>Enrollment Summary</p>
      <div className={styles.asideBlock}>
        <span className={styles.pairLabel}>Client</span>
        <span className={styles.pairValue}>{user ? userName(user) : "—"}</span>
        {user && <span className="text-caption">{formatPhone(user.phone.normalized)}</span>}
      </div>
      <div className={styles.asideBlock}>
        <span className={styles.pairLabel}>Plan</span>
        <span className={styles.pairValue}>{plan?.name ?? "—"}</span>
      </div>
      <div className={styles.asideBlock}>
        <span className={styles.pairLabel}>Coach</span>
        <span className={styles.pairValue}>{coach ? coachName(coach) : "—"}</span>
      </div>
      {draft.startDate && (
        <div className={styles.asideBlock}>
          <span className={styles.pairLabel}>Runs</span>
          <span className={styles.pairValue}>
            {formatDay(draft.startDate)} – {formatDay(draft.endDate)}
          </span>
        </div>
      )}
      {step >= 2 ? <PaymentSummary draft={draft} /> : p && <div className={styles.asidePrice}>{inr(p.price)}</div>}
    </GlassCard>
  );
}
