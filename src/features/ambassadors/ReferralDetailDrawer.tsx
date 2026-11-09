import { GlassDrawer } from "../../components/ui/GlassDrawer";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { formatCurrencyINR, formatDateTime } from "../../utils/format";
import type { Ambassador, ReferralOrder } from "../../types/ambassador";
import { REFERRAL_TONE, paymentTone } from "./tones";
import styles from "./Ambassadors.module.css";

interface Props {
  referral: ReferralOrder | null;
  ambassador: Ambassador;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value ?? "—"}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.fields}>{children}</div>
    </section>
  );
}

const COMMISSION_LABEL = { pending: "Payable", paid: "Paid out" } as const;

/** One referral in full: who bought, with which code, what they paid and how it stands. */
export function ReferralDetailDrawer({ referral: r, ambassador, onClose }: Props) {
  return (
    <GlassDrawer open={r !== null} onClose={onClose} title="Referral Details" description={r ? `${r.orderId} · ${r.planName}` : undefined} width={520}>
      {r && (
        <>
          <Section title="Customer">
            <Field label="Name" value={r.customerName} />
            <Field label="User ID" value={r.customerUserId} />
            <Field label="Email" value={r.email} />
            <Field label="Mobile" value={r.mobile} />
          </Section>
          <Section title="Coupon">
            <Field label="Coupon code" value={<span className={styles.code}>{r.couponCode}</span>} />
            <Field label="Discount" value={`${r.discountPercent}%`} />
            <Field label="Ambassador" value={ambassador.name} />
            <Field label="Ambassador user ID" value={ambassador.userId} />
          </Section>
          <Section title="Purchase">
            <Field label="Plan" value={r.planName} />
            <Field label="Plan ID" value={r.planId} />
            <Field label="Order ID" value={r.orderId} />
            <Field label="Purchase date" value={formatDateTime(r.purchasedAt)} />
            <Field label="Original amount" value={formatCurrencyINR(r.originalAmount)} />
            <Field label="Discount amount" value={`− ${formatCurrencyINR(r.discountAmount)}`} />
            <Field label="Final paid amount" value={formatCurrencyINR(r.paidAmount)} />
            <Field label="Currency" value={r.currency} />
          </Section>
          <Section title="Payment">
            <Field label="Payment ID" value={r.paymentId} />
            <Field label="Status" value={<StatusBadge label={r.paymentStatus ?? "—"} tone={paymentTone(r.paymentStatus)} />} />
            <Field label="Gateway reference" value={r.gatewayReference} />
            <Field
              label="Verification"
              value={r.paymentVerification === "gateway" ? "Gateway verified" : <StatusBadge label="Simulated (no gateway)" tone="warning" />}
            />
          </Section>
          <Section title="Commission">
            <Field label="Rate" value={`${r.commissionPercent}%`} />
            <Field label="Gross" value={formatCurrencyINR(r.grossCommission)} />
            <Field label="TDS" value={`− ${formatCurrencyINR(r.tdsAmount)}`} />
            <Field label="Net" value={formatCurrencyINR(r.netCommission)} />
            <Field label="Commission status" value={COMMISSION_LABEL[r.commissionStatus]} />
          </Section>
          <Section title="Referral">
            <Field label="Status" value={<StatusBadge label={r.referralStatus} tone={REFERRAL_TONE[r.referralStatus]} />} />
            <Field label="Created" value={formatDateTime(r.createdAt)} />
            <Field label="Last updated" value={formatDateTime(r.updatedAt)} />
          </Section>
        </>
      )}
    </GlassDrawer>
  );
}
