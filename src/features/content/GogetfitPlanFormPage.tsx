import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { Textarea } from "../../components/forms/Textarea";
import { SkeletonForm } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { useToast } from "../../components/feedback/ToastProvider";
import { ApiError } from "../../api/client";
import {
  createGogetfitPlan,
  getGogetfitPlan,
  removeGogetfitPlanImage,
  updateGogetfitPlan,
  uploadGogetfitPlanImage,
} from "../../api/gogetfitPlans";
import { resolveMediaUrl } from "../../api/media";
import { CoachImageField, type CoachImageBusy } from "../coaches/CoachImageField";
import {
  PLAN_LEVELS,
  PLAN_TYPES,
  type GogetfitPlan,
  type GogetfitPlanInput,
  type PlanImage,
  type PlanLevel,
  type PlanType,
} from "../../types/gogetfitPlans";

const COVER_HINT = "Recommended size 1500 × 500 px · 3:1 ratio. JPEG, PNG or WEBP. You can position and zoom before saving.";
import styles from "../users/UserFormPage.module.css";

/* Limits mirror the backend validator, which stays authoritative. */
const MAX_NAME = 45; // legacy package_name varchar(45)
const MAX_TEXT = 20000;
const MAX_WEEKS = 520;
const MAX_PERSONS = 20;
const MAX_PRICE = 10_000_000;

/**
 * Every field of the legacy Create/Edit Package form, in its order and with its
 * labels. Numbers are held as strings so an empty box stays empty - a real 0
 * loaded from the server is kept as "0", never replaced by a default.
 */
interface FormState {
  coachLevel: PlanLevel | "";
  planType: PlanType | "";
  name: string;
  durationWeeks: string;
  personsAllowed: string;
  basePrice: string;
  reward: string;
  description: string;
  inclusions: string;
  whatNext: string;
  termsAndConditions: string;
  eligibility: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

/** Legacy defaults: the dropdowns started on LEVEL 1 / Enrollment. Numbers start empty. */
const EMPTY: FormState = {
  coachLevel: "LEVEL 1",
  planType: "Enrollment",
  name: "",
  durationWeeks: "",
  personsAllowed: "",
  basePrice: "",
  reward: "",
  description: "",
  inclusions: "",
  whatNext: "",
  termsAndConditions: "",
  eligibility: "",
};

const fromPlan = (p: GogetfitPlan): FormState => ({
  // Off-list legacy values stay visible rather than silently becoming a default.
  coachLevel: (p.coachLevel ?? "") as PlanLevel | "",
  planType: p.planType as PlanType,
  name: p.name,
  durationWeeks: String(p.durationWeeks ?? ""),
  personsAllowed: String(p.personsAllowed ?? ""),
  basePrice: String(p.pricing.basePrice ?? ""),
  reward: p.pricing.reward === null || p.pricing.reward === undefined ? "" : String(p.pricing.reward),
  description: p.content.description ?? "",
  inclusions: p.content.inclusions ?? "",
  whatNext: p.content.whatNext ?? "",
  termsAndConditions: p.content.termsAndConditions ?? "",
  eligibility: p.content.eligibility ?? "",
});

const wholeNumber = (value: string, { min, max }: { min: number; max: number }): string | null => {
  if (value.trim() === "") return "This field is required";
  const n = Number(value);
  if (!Number.isInteger(n)) return "Enter a whole number";
  if (n < min || n > max) return `Enter a value from ${min} to ${max.toLocaleString("en-IN")}`;
  return null;
};

function validatePlanForm(form: FormState): Errors {
  const errors: Errors = {};
  if (!form.coachLevel) errors.coachLevel = "Plan level is required";
  if (!form.planType) errors.planType = "Plan type is required";
  if (!form.name.trim()) errors.name = "Plan name is required";
  else if (form.name.trim().length > MAX_NAME) errors.name = `At most ${MAX_NAME} characters`;

  const duration = wholeNumber(form.durationWeeks, { min: 1, max: MAX_WEEKS });
  if (duration) errors.durationWeeks = duration;
  const persons = wholeNumber(form.personsAllowed, { min: 1, max: MAX_PERSONS });
  if (persons) errors.personsAllowed = persons;
  const price = wholeNumber(form.basePrice, { min: 0, max: MAX_PRICE });
  if (price) errors.basePrice = price;

  if (form.reward.trim() === "") {
    // The legacy rule, with its own words.
    if (form.planType === "Challenge") errors.reward = "Reward (Refund Amount) is mandatory when challenge is selected";
  } else {
    const reward = wholeNumber(form.reward, { min: 0, max: MAX_PRICE });
    if (reward) errors.reward = reward;
    else if (!price && Number(form.reward) > Number(form.basePrice)) errors.reward = "Reward cannot be more than the base price";
  }

  for (const key of ["description", "inclusions", "whatNext", "termsAndConditions", "eligibility"] as const) {
    if (form[key].length > MAX_TEXT) errors[key] = `At most ${MAX_TEXT.toLocaleString("en-IN")} characters`;
  }
  return errors;
}

const blankToNull = (value: string) => (value.trim() === "" ? null : value);

const toInput = (form: FormState): GogetfitPlanInput => ({
  name: form.name.trim(),
  planType: form.planType as PlanType,
  coachLevel: form.coachLevel as PlanLevel,
  durationWeeks: Number(form.durationWeeks),
  personsAllowed: Number(form.personsAllowed),
  pricing: { basePrice: Number(form.basePrice), reward: form.reward.trim() === "" ? null : Number(form.reward) },
  content: {
    description: blankToNull(form.description),
    inclusions: blankToNull(form.inclusions),
    whatNext: blankToNull(form.whatNext),
    termsAndConditions: blankToNull(form.termsAndConditions),
    eligibility: blankToNull(form.eligibility),
  },
});

/**
 * Edit sends only what the admin changed. A field that was not touched is never
 * written back - so migrated legacy text (CRLF line endings, stray quotes) stays
 * byte-identical, and a concurrent edit to another field is not overwritten.
 */
function changedFields(initial: GogetfitPlanInput, next: GogetfitPlanInput): Partial<GogetfitPlanInput> {
  const out: Record<string, unknown> = {};
  for (const key of ["name", "planType", "coachLevel", "durationWeeks", "personsAllowed"] as const) {
    if (initial[key] !== next[key]) out[key] = next[key];
  }
  const pricing: Record<string, unknown> = {};
  if (initial.pricing.basePrice !== next.pricing.basePrice) pricing.basePrice = next.pricing.basePrice;
  if (initial.pricing.reward !== next.pricing.reward) pricing.reward = next.pricing.reward;
  if (Object.keys(pricing).length > 0) out.pricing = pricing;
  const content: Record<string, unknown> = {};
  for (const key of Object.keys(next.content) as (keyof GogetfitPlanInput["content"])[]) {
    if (initial.content[key] !== next.content[key]) content[key] = next.content[key];
  }
  if (Object.keys(content).length > 0) out.content = content;
  return out as Partial<GogetfitPlanInput>;
}

/** Add Plan and Edit Plan: one form, the legacy AddPackage fields. */
export function GogetfitPlanFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY);
  /** The plan as loaded, for sending only the changed fields on edit. */
  const [initial, setInitial] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<"notFound" | "failed" | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cover image. On Add it waits here until the plan exists (it is stored under
  // the plan's id); on Edit it saves immediately through its own endpoint.
  const [image, setImage] = useState<PlanImage | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imageBusy, setImageBusy] = useState<CoachImageBusy>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const pendingPreview = useMemo(() => (pendingImage ? URL.createObjectURL(pendingImage) : null), [pendingImage]);
  useEffect(() => () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
  }, [pendingPreview]);

  async function changeImage(file: File | null) {
    if (!isEdit || !id) {
      setPendingImage(file);
      return;
    }
    setImageBusy(file ? "uploading" : "removing");
    setImageError(null);
    try {
      const updated = file ? await uploadGogetfitPlanImage(id, file) : await removeGogetfitPlanImage(id);
      setImage(updated.image);
      show(file ? "Plan cover image updated" : "Plan cover image removed");
    } catch (cause) {
      setImageError(
        cause instanceof ApiError && cause.status > 0 && cause.status < 500
          ? cause.message
          : `Could not ${file ? "upload" : "remove"} the image. Please try again.`,
      );
    } finally {
      setImageBusy(null);
    }
  }

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getGogetfitPlan(id)
      .then((plan) => {
        if (cancelled) return;
        setForm(fromPlan(plan));
        setInitial(fromPlan(plan));
        setImage(plan.image);
        setLoading(false);
      })
      .catch((cause) => {
        if (cancelled) return;
        setLoadError(cause instanceof ApiError && cause.status === 404 ? "notFound" : "failed");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit() {
    const next = validatePlanForm(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      if (isEdit && id) {
        const changes = changedFields(toInput(initial), toInput(form));
        if (Object.keys(changes).length === 0) {
          show("No changes to save", "info");
          navigate(`/content/gogetfit-plans/${id}`);
          return;
        }
        await updateGogetfitPlan(id, changes);
        show("Plan updated successfully");
        navigate(`/content/gogetfit-plans/${id}`);
      } else {
        const created = await createGogetfitPlan(toInput(form));
        if (pendingImage) {
          try {
            await uploadGogetfitPlanImage(created.id, pendingImage);
          } catch {
            // The plan is saved; only the image failed. Keep the plan and send
            // the admin to its edit page to retry - never pretend it uploaded.
            show("Plan added, but the cover image could not be uploaded. Try again here.", "error");
            navigate(`/content/gogetfit-plans/${created.id}/edit`);
            return;
          }
        }
        show("Plan added successfully");
        navigate(`/content/gogetfit-plans/${created.id}`);
      }
    } catch (cause) {
      setFormError(
        cause instanceof ApiError && cause.status > 0 && cause.status < 500
          ? cause.message
          : `Could not ${isEdit ? "update" : "add"} the plan. Please try again.`,
      );
    } finally {
      setSaving(false);
    }
  }

  const header = (
    <>
      <button className={styles.backLink} onClick={() => navigate(isEdit && id ? `/content/gogetfit-plans/${id}` : "/content/gogetfit-plans")}>
        <ArrowLeft size={14} /> Back
      </button>
      <PageHeader
        title={isEdit ? "Edit Plan" : "Add Plan"}
        breadcrumb={[
          { label: "Content", path: "/content/gogetfit-plans" },
          { label: "GOGETFIT Plans", path: "/content/gogetfit-plans" },
          { label: isEdit ? "Edit" : "Add" },
        ]}
        description="Choose the plan level and plan type carefully - they decide where members see this plan."
      />
    </>
  );

  if (loading) return <GlassCard><SkeletonForm fields={10} /></GlassCard>;
  if (loadError) {
    return (
      <>
        {header}
        {loadError === "notFound" ? (
          <ErrorState title="Plan not found" description="This plan does not exist." />
        ) : (
          <ErrorState description="We couldn't load this plan." onRetry={() => setAttempt((n) => n + 1)} />
        )}
      </>
    );
  }

  const isChallenge = form.planType === "Challenge";
  const offListLevel = form.coachLevel !== "" && !PLAN_LEVELS.includes(form.coachLevel as PlanLevel);

  return (
    <>
      {header}
      <div className={styles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Main Info</p>
          <div className={styles.grid}>
            <Field label="Plan Level" required error={errors.coachLevel}>
              <Select
                value={form.coachLevel}
                error={!!errors.coachLevel}
                placeholder="Select plan level"
                onChange={(e) => set("coachLevel", e.target.value as PlanLevel)}
                options={[
                  ...PLAN_LEVELS.map((l) => ({ label: l, value: l })),
                  ...(offListLevel ? [{ label: form.coachLevel, value: form.coachLevel }] : []),
                ]}
              />
            </Field>
            <Field label="Plan Type" required error={errors.planType}>
              <Select
                value={form.planType}
                error={!!errors.planType}
                onChange={(e) => set("planType", e.target.value as PlanType)}
                options={PLAN_TYPES.map((t) => ({ label: t, value: t }))}
              />
            </Field>
            <Field label="Plan Name" required error={errors.name} helperText={`${form.name.trim().length}/${MAX_NAME}`}>
              <Input
                value={form.name}
                error={!!errors.name}
                placeholder="e.g. 12 WEEKS GOGETFIT PLAN"
                maxLength={MAX_NAME + 10}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            <Field label="Duration (weeks)" required error={errors.durationWeeks}>
              <Input type="number" min="1" step="1" value={form.durationWeeks} error={!!errors.durationWeeks} placeholder="e.g. 12"
                onChange={(e) => set("durationWeeks", e.target.value)} />
            </Field>
            <Field label="Persons Allowed" required error={errors.personsAllowed}>
              <Input type="number" min="1" step="1" value={form.personsAllowed} error={!!errors.personsAllowed} placeholder="e.g. 1"
                onChange={(e) => set("personsAllowed", e.target.value)} />
            </Field>
            <Field label="Base Price (INR, incl. of taxes)" required error={errors.basePrice}>
              <Input type="number" min="0" step="1" value={form.basePrice} error={!!errors.basePrice} placeholder="e.g. 4999"
                onChange={(e) => set("basePrice", e.target.value)} />
            </Field>
            <Field
              label="Reward (Refund Money, INR)"
              required={isChallenge}
              error={errors.reward}
              helperText={isChallenge ? "Refunded when the member completes the challenge." : "Only needed for a Challenge."}
            >
              <Input type="number" min="0" step="1" value={form.reward} error={!!errors.reward} placeholder="e.g. 3999"
                onChange={(e) => set("reward", e.target.value)} />
            </Field>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Description Info</p>
          <div style={{ display: "grid", gap: 16 }}>
            <Field label="Description" error={errors.description}>
              <Textarea rows={4} value={form.description} placeholder="Description" onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Field label="Package Inclusions" error={errors.inclusions} helperText="One inclusion per line.">
              <Textarea rows={5} value={form.inclusions} placeholder="Inclusions" onChange={(e) => set("inclusions", e.target.value)} />
            </Field>
            <Field label="What Next" error={errors.whatNext}>
              <Textarea rows={4} value={form.whatNext} placeholder="What next..." onChange={(e) => set("whatNext", e.target.value)} />
            </Field>
            <Field label="Terms and Conditions" error={errors.termsAndConditions}>
              <Textarea rows={4} value={form.termsAndConditions} placeholder="Enter T&C..." onChange={(e) => set("termsAndConditions", e.target.value)} />
            </Field>
            <Field label="Eligibility" error={errors.eligibility}>
              <Textarea rows={3} value={form.eligibility} placeholder="Eligibility criteria..." onChange={(e) => set("eligibility", e.target.value)} />
            </Field>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-caption" style={{ marginBottom: 12 }}>
            Optional. Shown on the plan in the app.
          </p>
          <CoachImageField
            label="Plan Cover Image"
            shape="cover"
            imageUrl={isEdit ? resolveMediaUrl(image?.url) : pendingPreview}
            busy={imageBusy}
            error={imageError}
            hint={COVER_HINT}
            onSelect={(file) => void changeImage(file)}
            onRemove={() => void changeImage(null)}
          />
        </GlassCard>

        {formError && <p role="alert" style={{ color: "var(--status-error, #e5484d)" }}>{formError}</p>}

        <div className={styles.footer}>
          <Button variant="ghost" disabled={saving}
            onClick={() => navigate(isEdit && id ? `/content/gogetfit-plans/${id}` : "/content/gogetfit-plans")}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {saving ? (isEdit ? "Updating..." : "Adding...") : isEdit ? "Update Plan" : "Add Plan"}
          </Button>
        </div>
      </div>
    </>
  );
}
