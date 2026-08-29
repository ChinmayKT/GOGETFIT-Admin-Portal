import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { Textarea } from "../../components/forms/Textarea";
import { EditableStringList } from "../../components/forms/EditableStringList";
import { SkeletonForm } from "../../components/feedback/Skeleton";
import { EmptyState } from "../../components/feedback/EmptyState";
import { useToast } from "../../components/feedback/ToastProvider";
import { getGogetfitPlan, createGogetfitPlan, updateGogetfitPlan } from "../../mock/gogetfitPlans/repository";
import { DEFAULT_INCLUDES, DEFAULT_NEXT_STEPS, DEFAULT_TERMS, DEFAULT_ELIGIBILITY } from "../../mock/gogetfitPlans/data";
import { TIER_PEOPLE, type PlanTier } from "../../types/gogetfitPlans";
import styles from "../users/UserFormPage.module.css";

interface FormState {
  name: string;
  tier: PlanTier;
  durationWeeks: string;
  price: string;
  description: string;
  includes: string[];
  nextSteps: string[];
  terms: string[];
  eligibility: string;
}

const EMPTY: FormState = {
  name: "",
  tier: "Solo",
  durationWeeks: "12",
  price: "",
  description: "",
  includes: [...DEFAULT_INCLUDES],
  nextSteps: [...DEFAULT_NEXT_STEPS],
  terms: [...DEFAULT_TERMS],
  eligibility: DEFAULT_ELIGIBILITY,
};

export function GogetfitPlanFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getGogetfitPlan(id).then((p) => {
      if (cancelled) return;
      if (p) {
        setForm({
          name: p.name,
          tier: p.tier,
          durationWeeks: String(p.durationWeeks),
          price: String(p.price),
          description: p.description,
          includes: [...p.includes],
          nextSteps: [...p.nextSteps],
          terms: [...p.terms],
          eligibility: p.eligibility,
        });
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Plan name is required";
    if (!form.durationWeeks || Number(form.durationWeeks) <= 0) next.durationWeeks = "Enter a valid duration";
    if (!form.price || Number(form.price) <= 0) next.price = "Enter a valid price";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const durationWeeks = Number(form.durationWeeks);
      const payload = {
        name: form.name,
        tier: form.tier,
        people: TIER_PEOPLE[form.tier],
        durationWeeks,
        duration: `${durationWeeks} Week${durationWeeks === 1 ? "" : "s"}`,
        price: Number(form.price),
        description: form.description,
        includes: form.includes.filter((s) => s.trim() !== ""),
        nextSteps: form.nextSteps.filter((s) => s.trim() !== ""),
        terms: form.terms.filter((s) => s.trim() !== ""),
        eligibility: form.eligibility,
      };
      if (isEdit && id) {
        await updateGogetfitPlan(id, payload);
        show("Plan updated");
      } else {
        await createGogetfitPlan(payload);
        show("Plan created");
      }
      navigate("/content/gogetfit-plans");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <GlassCard>
        <SkeletonForm fields={5} />
      </GlassCard>
    );
  }

  if (notFound) {
    return (
      <GlassCard>
        <EmptyState
          title="Plan not found"
          description="This plan may have been deleted."
          action={
            <Button variant="primary" onClick={() => navigate("/content/gogetfit-plans")}>
              Back to GOGETFIT Plans
            </Button>
          }
        />
      </GlassCard>
    );
  }

  return (
    <>
      <button className={styles.backLink} onClick={() => navigate("/content/gogetfit-plans")}>
        <ArrowLeft size={14} /> Back
      </button>
      <PageHeader
        title={isEdit ? "Edit Plan" : "Add Plan"}
        breadcrumb={[{ label: "Content", path: "/content/gogetfit-plans" }, { label: "GOGETFIT Plans", path: "/content/gogetfit-plans" }, { label: isEdit ? "Edit" : "Add" }]}
      />

      <div className={styles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>
            Plan Details
          </p>
          <div style={{ marginBottom: 16 }}>
            <Field label="Plan Name" required error={errors.name}>
              <Input value={form.name} error={!!errors.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. 12 Weeks GOGETFIT Plan" />
            </Field>
          </div>
          <div className={styles.grid}>
            <Field label="Tier" required helperText="People count follows the tier automatically">
              <Select
                value={form.tier}
                onChange={(e) => set("tier", e.target.value as PlanTier)}
                options={[
                  { label: "Solo (1 person)", value: "Solo" },
                  { label: "Couples (2 people)", value: "Couples" },
                  { label: "Family (4 people)", value: "Family" },
                ]}
              />
            </Field>
            <Field label="Duration (weeks)" required error={errors.durationWeeks}>
              <Input type="number" value={form.durationWeeks} error={!!errors.durationWeeks} onChange={(e) => set("durationWeeks", e.target.value)} />
            </Field>
            <Field label="Price (INR)" required error={errors.price}>
              <Input type="number" value={form.price} error={!!errors.price} onChange={(e) => set("price", e.target.value)} />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <Field label="Description" helperText="Shown on the plan card on the public website">
              <Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 4 }}>
            What's Included
          </p>
          <p className="text-caption" style={{ marginBottom: 16 }}>
            Shown on this plan's page only.
          </p>
          <EditableStringList label="Includes" helperText="One bullet per line" value={form.includes} onChange={(v) => set("includes", v)} addLabel="Add item" />
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 16 }}>
            What's Next (onboarding steps)
          </p>
          <EditableStringList label="Steps" helperText="Shown in order" value={form.nextSteps} onChange={(v) => set("nextSteps", v)} addLabel="Add step" />
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 16 }}>
            Terms & Conditions
          </p>
          <EditableStringList label="Terms" helperText="One clause per line" value={form.terms} onChange={(v) => set("terms", v)} addLabel="Add term" />
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 16 }}>
            Eligibility
          </p>
          <Field label="Eligibility statement">
            <Textarea rows={2} value={form.eligibility} onChange={(e) => set("eligibility", e.target.value)} />
          </Field>
        </GlassCard>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {isEdit ? "Update Plan" : "Create Plan"}
          </Button>
        </div>
      </div>
    </>
  );
}
