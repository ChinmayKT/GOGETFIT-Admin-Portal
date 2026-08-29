import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { Textarea } from "../../components/forms/Textarea";
import { SkeletonForm } from "../../components/feedback/Skeleton";
import { useToast } from "../../components/feedback/ToastProvider";
import { getPackage, createPackage, updatePackage } from "../../mock/commerce/packageRepository";
import type { PlanType } from "../../types/package";
import styles from "../users/UserFormPage.module.css";

interface FormState {
  planLevel: string;
  planType: PlanType;
  planName: string;
  durationWeeks: string;
  personsAllowed: string;
  basePrice: string;
  rewardRefundMoney: string;
  description: string;
  inclusions: string;
  whatNext: string;
  termsAndConditions: string;
  eligibility: string;
}

const EMPTY: FormState = {
  planLevel: "1",
  planType: "Enrollment",
  planName: "",
  durationWeeks: "4",
  personsAllowed: "1",
  basePrice: "",
  rewardRefundMoney: "",
  description: "",
  inclusions: "",
  whatNext: "",
  termsAndConditions: "",
  eligibility: "",
};

export function PackageFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!id) return;
    getPackage(id).then((p) => {
      if (!p) return;
      setForm({
        planLevel: String(p.planLevel),
        planType: p.planType,
        planName: p.planName,
        durationWeeks: String(p.durationWeeks),
        personsAllowed: String(p.personsAllowed),
        basePrice: String(p.basePrice),
        rewardRefundMoney: p.rewardRefundMoney != null ? String(p.rewardRefundMoney) : "",
        description: p.description,
        inclusions: p.inclusions,
        whatNext: p.whatNext,
        termsAndConditions: p.termsAndConditions,
        eligibility: p.eligibility,
      });
      setLoading(false);
    });
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isChallenge = form.planType === "Challenge";

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.planName.trim()) next.planName = "Plan name is required";
    if (!form.durationWeeks || Number(form.durationWeeks) <= 0) next.durationWeeks = "Enter a valid duration";
    if (!form.personsAllowed || Number(form.personsAllowed) <= 0) next.personsAllowed = "Enter a valid number of persons";
    if (!form.basePrice || Number(form.basePrice) <= 0) next.basePrice = "Enter a valid base price";
    if (isChallenge && (!form.rewardRefundMoney || Number(form.rewardRefundMoney) < 0)) {
      next.rewardRefundMoney = "Enter a valid reward/refund amount";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        planLevel: Number(form.planLevel) as 1 | 2 | 3 | 4 | 5,
        planType: form.planType,
        planName: form.planName,
        durationWeeks: Number(form.durationWeeks),
        personsAllowed: Number(form.personsAllowed),
        basePrice: Number(form.basePrice),
        rewardRefundMoney: isChallenge ? Number(form.rewardRefundMoney) : null,
        description: form.description,
        inclusions: form.inclusions,
        whatNext: form.whatNext,
        termsAndConditions: form.termsAndConditions,
        eligibility: form.eligibility,
      };
      if (isEdit && id) {
        await updatePackage(id, payload);
        show("Package updated");
      } else {
        await createPackage(payload);
        show("Package created successfully");
      }
      navigate("/commerce/packages");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <GlassCard><SkeletonForm fields={8} /></GlassCard>;

  return (
    <>
      <button className={styles.backLink} onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>
      <PageHeader
        title={isEdit ? "Edit Package" : "Create Package"}
        breadcrumb={[{ label: "Commerce", path: "/commerce/packages" }, { label: "Packages", path: "/commerce/packages" }, { label: isEdit ? "Edit" : "Create" }]}
      />

      <div
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", marginBottom: 20,
          borderRadius: "var(--radius-md)", background: "var(--glass-fill)", border: "1px solid var(--glass-border)",
        }}
      >
        <Info size={14} color="var(--text-muted)" />
        <span className="text-caption">
          Choose Coach Level and Package Type carefully — pricing and conditional fields depend on them.
        </span>
      </div>

      <div className={styles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Main Info</p>
          <div className={styles.grid}>
            <Field label="Plan Level" required>
              <Select
                value={form.planLevel}
                onChange={(e) => set("planLevel", e.target.value)}
                options={[1, 2, 3, 4, 5].map((l) => ({ label: `Level ${l}`, value: String(l) }))}
              />
            </Field>
            <Field label="Plan Type" required>
              <Select
                value={form.planType}
                onChange={(e) => set("planType", e.target.value as PlanType)}
                options={[
                  { label: "Enrollment", value: "Enrollment" },
                  { label: "Challenge", value: "Challenge" },
                ]}
              />
            </Field>
            <Field label="Plan Name" required error={errors.planName}>
              <Input value={form.planName} error={!!errors.planName} onChange={(e) => set("planName", e.target.value)} />
            </Field>
            <Field label="Duration (weeks)" required error={errors.durationWeeks}>
              <Input type="number" min={1} value={form.durationWeeks} error={!!errors.durationWeeks} onChange={(e) => set("durationWeeks", e.target.value)} />
            </Field>
            <Field label="Persons Allowed" required error={errors.personsAllowed}>
              <Input type="number" min={1} value={form.personsAllowed} error={!!errors.personsAllowed} onChange={(e) => set("personsAllowed", e.target.value)} />
            </Field>
            <Field label="Base Price (Incl. of taxes)" required error={errors.basePrice}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
                  ₹
                </span>
                <Input
                  type="number"
                  min={0}
                  value={form.basePrice}
                  error={!!errors.basePrice}
                  onChange={(e) => set("basePrice", e.target.value)}
                  style={{ paddingLeft: 28 }}
                />
              </div>
            </Field>
            {isChallenge && (
              <Field label="Reward/Refund Money (INR)" required error={errors.rewardRefundMoney} helperText="Only applicable to Challenge plans">
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
                    ₹
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={form.rewardRefundMoney}
                    error={!!errors.rewardRefundMoney}
                    onChange={(e) => set("rewardRefundMoney", e.target.value)}
                    style={{ paddingLeft: 28 }}
                  />
                </div>
              </Field>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Description Info</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Description">
              <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Field label="Package Inclusions">
              <Textarea rows={3} value={form.inclusions} onChange={(e) => set("inclusions", e.target.value)} />
            </Field>
            <Field label="What Next">
              <Textarea rows={3} value={form.whatNext} onChange={(e) => set("whatNext", e.target.value)} />
            </Field>
            <Field label="Terms & Conditions">
              <Textarea rows={3} value={form.termsAndConditions} onChange={(e) => set("termsAndConditions", e.target.value)} />
            </Field>
            <Field label="Eligibility">
              <Textarea rows={3} value={form.eligibility} onChange={(e) => set("eligibility", e.target.value)} />
            </Field>
          </div>
        </GlassCard>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {isEdit ? "Update Package" : "Create Package"}
          </Button>
        </div>
      </div>
    </>
  );
}
