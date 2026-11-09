import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { GlassModal } from "../../components/ui/GlassModal";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { useToast } from "../../components/feedback/ToastProvider";
import { Percent, Receipt, IndianRupee, Landmark, Wallet } from "lucide-react";
import { MetricCard } from "../../components/charts/MetricCard";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { getPayouts, recordPayout } from "../../api/ambassadors";
import { formatCurrencyINR, formatDate } from "../../utils/format";
import type { AmbassadorDetail, AmbassadorPayout, PayoutInput } from "../../types/ambassador";
import { PAYOUT_TONE } from "./tones";
import styles from "./Ambassadors.module.css";

/** Commission by payout period, with the TDS withheld and what reached the bank. */
const today = () => new Date().toISOString().slice(0, 10);

export function CommissionPayoutsTab({ ambassador, onChanged }: { ambassador: AmbassadorDetail; onChanged?: () => void }) {
  const { show } = useToast();
  const [rows, setRows] = useState<AmbassadorPayout[] | null>(null);
  const [recording, setRecording] = useState<AmbassadorPayout | null>(null);
  const [form, setForm] = useState<PayoutInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openRecord = (p: AmbassadorPayout) => {
    setRecording(p);
    setFormError(null);
    setForm({ period: p.periodKey, amount: p.netPayable, paidAt: today(), reference: p.transactionReference ?? "", status: "Paid" });
  };

  const save = async () => {
    if (!form) return;
    if (!form.reference.trim()) {
      setFormError("A payment reference is required");
      return;
    }
    setSaving(true);
    try {
      setRows(await recordPayout(ambassador.id, { ...form, reference: form.reference.trim() }));
      show(`${recording?.period} payout recorded as ${form.status.toLowerCase()}`, "success");
      setRecording(null);
      onChanged?.();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not record the payout");
    } finally {
      setSaving(false);
    }
  };
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setRows(null);
    setFailed(false);
    getPayouts(ambassador.id)
      .then((r) => live && setRows(r))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [ambassador.id, attempt]);

  const all = rows ?? [];
  // The rate is on each ledger line; the label shows it once known.
  const tdsLabel = all[0] ? `TDS (${all[0].tdsPercent}%)` : "TDS";
  const sum = (pick: (p: AmbassadorPayout) => number) => all.reduce((s, p) => s + pick(p), 0);

  const columns: Column<AmbassadorPayout>[] = [
    { key: "period", header: "Payout Period" },
    { key: "eligibleOrderValue", header: "Eligible Order Value", align: "right", render: (p) => formatCurrencyINR(p.eligibleOrderValue) },
    { key: "commissionPercent", header: "Rate", align: "right", render: (p) => `${p.commissionPercent}%` },
    { key: "grossCommission", header: "Gross Commission", align: "right", render: (p) => formatCurrencyINR(p.grossCommission) },
    { key: "tds", header: tdsLabel, align: "right", render: (p) => `− ${formatCurrencyINR(p.tds)}` },
    { key: "netPayable", header: "Net Payable", align: "right", render: (p) => formatCurrencyINR(p.netPayable) },
    { key: "status", header: "Status", render: (p) => <StatusBadge label={p.status} tone={PAYOUT_TONE[p.status]} /> },
    { key: "transactionReference", header: "Transaction Ref.", render: (p) => p.transactionReference ?? "—" },
    { key: "paidAt", header: "Paid On", render: (p) => (p.paidAt ? formatDate(p.paidAt) : "—") },
    {
      key: "actions",
      header: "",
      render: (p) =>
        p.canRecord ? (
          <Button size="sm" variant="ghost" onClick={() => openRecord(p)}>
            Record payout
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <div className={`${styles.metrics} ${styles.metrics5}`}>
        <MetricCard label="Commission Rate" value={`${ambassador.commissionPercent}%`} icon={<Percent size={16} />} />
        <MetricCard label="Eligible Order Value" value={rows ? formatCurrencyINR(sum((p) => p.eligibleOrderValue)) : "—"} icon={<IndianRupee size={16} />} />
        <MetricCard label="Gross Commission" value={rows ? formatCurrencyINR(sum((p) => p.grossCommission)) : "—"} icon={<Wallet size={16} />} />
        <MetricCard label={tdsLabel} value={rows ? formatCurrencyINR(sum((p) => p.tds)) : "—"} icon={<Receipt size={16} />} />
        <MetricCard label="Net Payable" value={rows ? formatCurrencyINR(sum((p) => p.netPayable)) : "—"} icon={<Landmark size={16} />} />
      </div>
      <DataTable
        columns={columns}
        rows={all}
        getRowId={(p) => p.id}
        loading={rows === null && !failed}
        error={failed}
        onRetry={() => setAttempt((a) => a + 1)}
        emptyTitle="No commission yet"
        emptyDescription="Payouts appear once a referral is confirmed."
      />

      <GlassModal
        open={recording !== null && form !== null}
        onClose={() => setRecording(null)}
        title={`Record payout · ${recording?.period ?? ""}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRecording(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} loading={saving}>
              Record payout
            </Button>
          </>
        }
      >
        {form && (
          <>
            <p className="text-secondary">
              Records a transfer made outside GOGETFIT. Net payable for this month: {formatCurrencyINR(recording?.netPayable ?? 0)}.
            </p>
            <Field label="Payout date" required>
              <Input type="date" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} />
            </Field>
            <Field label="Amount (₹)" required>
              <Input type="number" inputMode="numeric" value={String(form.amount)} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </Field>
            <Field label="Payment reference" required helperText="UTR or bank reference">
              <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} maxLength={120} />
            </Field>
            <Field label="Status" required error={formError ?? undefined}>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as PayoutInput["status"] })}
                options={[
                  { label: "Paid", value: "Paid" },
                  { label: "Processing", value: "Processing" },
                ]}
              />
            </Field>
          </>
        )}
      </GlassModal>
    </>
  );
}
