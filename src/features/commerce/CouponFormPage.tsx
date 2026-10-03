import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { Textarea } from "../../components/forms/Textarea";
import { SkeletonForm } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { useToast } from "../../components/feedback/ToastProvider";
import { ApiError } from "../../api/client";
import { createCoupon, getCoupon, updateCoupon } from "../../api/coupons";
import { formatDateTime } from "../../utils/format";
import { adminName, couponDateInput, type Coupon, type CouponInput, type CouponVisibility } from "../../types/coupons";
import { couponErrorMessage } from "./couponErrors";
import styles from "../users/UserFormPage.module.css";

/* Mirrors the backend validator, which stays authoritative. */
const MAX_CODE = 20;
const MAX_DESCRIPTION = 1000;
const CODE_PATTERN = /^[A-Z0-9_-]+$/;

interface FormState {
  code: string;
  description: string;
  discount: string;
  validFrom: string;
  validTo: string;
  visibility: CouponVisibility;
}
type Errors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = { code: "", description: "", discount: "", validFrom: "", validTo: "", visibility: "public" };

const fromCoupon = (c: Coupon): FormState => ({
  code: c.code,
  description: c.description ?? "",
  discount: String(c.discount.value),
  validFrom: couponDateInput(c.validFrom),
  validTo: couponDateInput(c.validTo),
  visibility: c.visibility,
});

const normalizeCode = (code: string) => code.trim().toUpperCase();

function validate(form: FormState): Errors {
  const errors: Errors = {};
  const code = normalizeCode(form.code);
  if (!code) errors.code = "Coupon code is required";
  else if (code.length > MAX_CODE) errors.code = `At most ${MAX_CODE} characters`;
  else if (!CODE_PATTERN.test(code)) errors.code = 'Use only letters, numbers, "-" and "_"';

  if (form.description.trim().length > MAX_DESCRIPTION) errors.description = `At most ${MAX_DESCRIPTION} characters`;

  const discount = Number(form.discount);
  if (form.discount.trim() === "") errors.discount = "Discount is required";
  else if (!Number.isInteger(discount) || discount < 1 || discount > 100) errors.discount = "Enter a whole number from 1 to 100";

  if (!form.validFrom) errors.validFrom = "Valid from is required";
  if (!form.validTo) errors.validTo = "Valid to is required";
  if (form.validFrom && form.validTo && form.validFrom > form.validTo) errors.validTo = "Valid to must be on or after valid from";
  return errors;
}

const toInput = (form: FormState): CouponInput => ({
  code: normalizeCode(form.code),
  description: form.description.trim() || null,
  discount: { type: "percent", value: Number(form.discount) },
  validFrom: form.validFrom,
  validTo: form.validTo,
  visibility: form.visibility,
});

/** Edit sends only what changed. */
function changed(initial: CouponInput, next: CouponInput): Partial<CouponInput> {
  const out: Partial<CouponInput> = {};
  if (initial.code !== next.code) out.code = next.code;
  if (initial.description !== next.description) out.description = next.description;
  if (initial.discount.value !== next.discount.value) out.discount = next.discount;
  if (initial.validFrom !== next.validFrom) out.validFrom = next.validFrom;
  if (initial.validTo !== next.validTo) out.validTo = next.validTo;
  if (initial.visibility !== next.visibility) out.visibility = next.visibility;
  return out;
}

export function CouponFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [initial, setInitial] = useState<FormState>(EMPTY);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<"notFound" | "failed" | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let stale = false;
    setLoading(true);
    setLoadError(null);
    getCoupon(id)
      .then((c) => {
        if (stale) return;
        setCoupon(c);
        setForm(fromCoupon(c));
        setInitial(fromCoupon(c));
        setLoading(false);
      })
      .catch((cause) => {
        if (stale) return;
        setLoadError(cause instanceof ApiError && cause.status === 404 ? "notFound" : "failed");
        setLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [id, attempt]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit() {
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    setFormError(null);
    try {
      if (isEdit && id) {
        const patch = changed(toInput(initial), toInput(form));
        if (Object.keys(patch).length === 0) {
          show("No changes to save", "info");
          navigate(`/commerce/coupons/${id}`);
          return;
        }
        await updateCoupon(id, patch);
        show("Coupon updated");
        navigate(`/commerce/coupons/${id}`);
      } else {
        const created = await createCoupon(toInput(form));
        show(`Coupon ${created.code} created`);
        navigate(`/commerce/coupons/${created.id}`);
      }
    } catch (cause) {
      const message = couponErrorMessage(cause, `Could not ${isEdit ? "update" : "create"} the coupon. Please try again.`);
      if (cause instanceof ApiError && cause.status === 409) setErrors((e) => ({ ...e, code: message }));
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  const back = isEdit && id ? `/commerce/coupons/${id}` : "/commerce/coupons";
  const header = (
    <>
      <button className={styles.backLink} onClick={() => navigate(back)}>
        <ArrowLeft size={14} /> Back
      </button>
      <PageHeader
        title={isEdit ? "Edit Coupon" : "Add Coupon"}
        breadcrumb={[{ label: "Commerce", path: "/commerce/coupons" }, { label: "Coupons", path: "/commerce/coupons" }, { label: isEdit ? "Edit" : "Add" }]}
      />
    </>
  );

  if (loading) return <GlassCard><SkeletonForm fields={6} /></GlassCard>;
  if (loadError) {
    return (
      <>
        {header}
        {loadError === "notFound"
          ? <ErrorState title="Coupon not found" description="This coupon does not exist." />
          : <ErrorState description="We couldn't load this coupon." onRetry={() => setAttempt((n) => n + 1)} />}
      </>
    );
  }

  return (
    <>
      {header}
      <div className={styles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Coupon</p>
          <div className={styles.grid}>
            <Field label="Coupon Code" required error={errors.code} helperText="Saved in capitals, e.g. WELCOME20">
              <Input value={form.code} error={!!errors.code} placeholder="WELCOME20" maxLength={MAX_CODE + 5}
                onChange={(e) => set("code", e.target.value)} />
            </Field>
            <Field label="Discount %" required error={errors.discount}>
              <Input type="number" min="1" max="100" step="1" value={form.discount} error={!!errors.discount} placeholder="20"
                onChange={(e) => set("discount", e.target.value)} />
            </Field>
            <Field
              label="Visible to All"
              required
              helperText="Yes lists the coupon at checkout. No hides it there, but the coupon still works for anyone who enters the exact code while it is valid."
            >
              <Select
                value={form.visibility}
                aria-label="Visible to All"
                onChange={(e) => set("visibility", e.target.value as CouponVisibility)}
                options={[
                  { label: "Yes", value: "public" },
                  { label: "No", value: "private" },
                ]}
              />
            </Field>
            <Field label="Valid From" required error={errors.validFrom}>
              <Input type="date" value={form.validFrom} error={!!errors.validFrom} onChange={(e) => set("validFrom", e.target.value)} />
            </Field>
            <Field label="Valid To" required error={errors.validTo} helperText="Inclusive. The coupon is active from Valid From to this day.">
              <Input type="date" value={form.validTo} error={!!errors.validTo} onChange={(e) => set("validTo", e.target.value)} />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <Field label="Description" error={errors.description}>
              <Textarea rows={3} value={form.description} placeholder="Welcome offer" onChange={(e) => set("description", e.target.value)} />
            </Field>
          </div>
        </GlassCard>

        {isEdit && coupon && (
          <GlassCard>
            <p className="text-title" style={{ marginBottom: 16 }}>Status & History</p>
            <div className={styles.grid}>
              <ReadOnly label="Status">
                <StatusBadge label={coupon.status === "active" ? "Active" : "Inactive"} tone={coupon.status === "active" ? "success" : "neutral"} />
              </ReadOnly>
              <ReadOnly label="Created By">{adminName(coupon.createdBy)}</ReadOnly>
              <ReadOnly label="Created At">{coupon.createdAt ? formatDateTime(coupon.createdAt) : "—"}</ReadOnly>
              <ReadOnly label="Updated By">{adminName(coupon.updatedBy)}</ReadOnly>
              <ReadOnly label="Updated At">{coupon.updatedAt ? formatDateTime(coupon.updatedAt) : "—"}</ReadOnly>
            </div>
            <p className="text-caption" style={{ marginTop: 12 }}>
              Status is automatically determined by the validity dates.
            </p>
          </GlassCard>
        )}

        {formError && <p role="alert" style={{ color: "var(--status-error, #e5484d)" }}>{formError}</p>}

        <div className={styles.footer}>
          <Button variant="ghost" disabled={saving} onClick={() => navigate(back)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {saving ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save Changes" : "Create Coupon"}
          </Button>
        </div>
      </div>
    </>
  );
}

function ReadOnly({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-caption" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{children}</div>
    </div>
  );
}
