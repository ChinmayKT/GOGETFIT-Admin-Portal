import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, BadgePercent, IndianRupee, Landmark, UserPlus, Wallet } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { GlassModal } from "../../components/ui/GlassModal";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Tabs } from "../../components/ui/Tabs";
import { MetricCard } from "../../components/charts/MetricCard";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ErrorState } from "../../components/feedback/ErrorState";
import { useToast } from "../../components/feedback/ToastProvider";
import { getAmbassador, setAmbassadorCommission, setAmbassadorStatus } from "../../api/ambassadors";
import { formatCurrencyINR, formatDate } from "../../utils/format";
import type { AmbassadorDetail } from "../../types/ambassador";
import { ReferralOrdersTab } from "./ReferralOrdersTab";
import { CommissionPayoutsTab } from "./CommissionPayoutsTab";
import { ActivityLogTab } from "./ActivityLogTab";
import styles from "./Ambassadors.module.css";

const TABS = [
  { key: "referrals", label: "Referral Orders" },
  { key: "payouts", label: "Commission & Payouts" },
  { key: "activity", label: "Activity Log" },
];

/** One ambassador: who they are, how their code performs, and every order behind it. */
export function AmbassadorDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const [search, setSearch] = useSearchParams();
  const tab = TABS.some((t) => t.key === search.get("tab")) ? search.get("tab")! : "referrals";
  const [ambassador, setAmbassador] = useState<AmbassadorDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "notFound" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => setAttempt((a) => a + 1), []);

  // After an action inside a tab: new figures without remounting the tabs.
  const refreshQuietly = useCallback(() => {
    getAmbassador(id)
      .then((a) => a && setAmbassador(a))
      .catch(() => {});
  }, [id]);

  const [editingRate, setEditingRate] = useState(false);
  const [rate, setRate] = useState("");
  const [rateReason, setRateReason] = useState("");
  const [rateError, setRateError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setState("loading");
    getAmbassador(id)
      .then((a) => {
        if (!live) return;
        setAmbassador(a);
        setState(a ? "ready" : "notFound");
      })
      .catch(() => live && setState("error"));
    return () => {
      live = false;
    };
  }, [id, attempt]);

  if (state === "loading") return <GlassCard><SkeletonProfile /></GlassCard>;
  if (state === "error") return <ErrorState onRetry={load} />;
  if (state === "notFound" || !ambassador) {
    return <EmptyState title="Ambassador not found" description="They may have been removed." action={<Button onClick={() => navigate("/ambassadors")}>Back to ambassadors</Button>} />;
  }

  const a = ambassador;
  const active = a.status === "Active";

  const toggle = async () => {
    setSaving(true);
    try {
      await setAmbassadorStatus(a.id, active ? "Inactive" : "Active");
      show(`${a.name ?? a.couponCode} is now ${active ? "inactive" : "active"}`, "success");
    } catch (error) {
      show(error instanceof Error ? error.message : "Could not change the status", "error");
    } finally {
      setSaving(false);
      setConfirming(false);
      load();
    }
  };

  const openRate = () => {
    setRate(String(a.commissionPercent));
    setRateReason("");
    setRateError(null);
    setEditingRate(true);
  };

  const saveRate = async () => {
    const value = Number(rate);
    if (!rate.trim() || !Number.isFinite(value)) {
      setRateError("Enter a percentage");
      return;
    }
    setSaving(true);
    try {
      // The server owns the allowed range and says so if this is outside it.
      setAmbassador(await setAmbassadorCommission(a.id, value, rateReason.trim() || undefined));
      show(`Commission set to ${value}% for future referrals`, "success");
      setEditingRate(false);
    } catch (e) {
      setRateError(e instanceof Error ? e.message : "Could not change the rate");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={styles.section}>
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={15} />} onClick={() => navigate("/ambassadors")}>
          Ambassador Details
        </Button>
      </div>

      <GlassCard className={styles.profile}>
        <Avatar name={a.name ?? a.couponCode} size="xl" />
        <div className={styles.profileInfo}>
          <span className={styles.profileName}>
            {a.name ?? "—"} <span className={styles.sub}>({a.userId})</span>
          </span>
          <div className={styles.metaRow}>
            <span>{a.email}</span>
            <span>{a.mobile}</span>
            <span>
              Coupon <span className={styles.code}>{a.couponCode}</span>
            </span>
            <span>Joined {formatDate(a.registeredAt)}</span>
          </div>
        </div>
        <div className={styles.profileSide}>
          <StatusBadge label={a.status} tone={active ? "success" : "neutral"} />
          <Button variant={active ? "danger" : "primary"} size="sm" onClick={() => setConfirming(true)}>
            {active ? "Deactivate" : "Activate"}
          </Button>
          <Button variant="ghost" size="sm" onClick={openRate}>
            Commission {a.commissionPercent}%
          </Button>
        </div>
      </GlassCard>

      <div className={`${styles.metrics} ${styles.metrics5}`}>
        <MetricCard label="Successful Referrals" value={String(a.successfulReferrals)} icon={<UserPlus size={16} />} />
        <MetricCard label="Attributed Sales" value={formatCurrencyINR(a.salesAmount)} icon={<IndianRupee size={16} />} />
        <MetricCard label="Discounts Given" value={formatCurrencyINR(a.discountsGiven)} icon={<BadgePercent size={16} />} />
        <MetricCard label="Commission Earned" value={formatCurrencyINR(a.commissionEarned)} icon={<Wallet size={16} />} />
        <MetricCard label="Commission Payable" value={formatCurrencyINR(a.commissionPayable)} icon={<Landmark size={16} />} />
      </div>

      <div className={styles.section}>
        <Tabs tabs={TABS} active={tab} onChange={(key) => setSearch({ tab: key }, { replace: true })} />
      </div>

      {tab === "referrals" && <ReferralOrdersTab ambassador={a} />}
      {tab === "payouts" && <CommissionPayoutsTab ambassador={a} onChanged={refreshQuietly} />}
      {tab === "activity" && <ActivityLogTab ambassadorId={a.id} />}

      <ConfirmDialog
        open={confirming}
        title={active ? `Deactivate ${a.name}?` : `Activate ${a.name}?`}
        description={active ? `Their code ${a.couponCode} will stop giving a discount. Existing referrals are kept.` : `Their code ${a.couponCode} will give a discount again.`}
        confirmLabel={active ? "Deactivate" : "Activate"}
        tone={active ? "danger" : "primary"}
        loading={saving}
        onConfirm={toggle}
        onCancel={() => setConfirming(false)}
      />

      <GlassModal
        open={editingRate}
        onClose={() => setEditingRate(false)}
        title="Commission rate"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingRate(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveRate} loading={saving}>
              Save rate
            </Button>
          </>
        }
      >
        <p className="text-secondary">
          Applies to {a.name ?? a.couponCode}'s future referrals only. Commission already calculated stays as it is.
        </p>
        <Field label="Commission (%)" required error={rateError ?? undefined} helperText="Must be within the programme's published range; the server checks it.">
          <Input
            type="number"
            inputMode="numeric"
            value={rate}
            onChange={(e) => {
              setRate(e.target.value);
              setRateError(null);
            }}
          />
        </Field>
        <Field label="Reason">
          <Input value={rateReason} onChange={(e) => setRateReason(e.target.value)} maxLength={500} placeholder="Optional" />
        </Field>
      </GlassModal>
    </>
  );
}
