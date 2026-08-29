import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { SkeletonForm } from "../../components/feedback/Skeleton";
import { useToast } from "../../components/feedback/ToastProvider";
import { getCoupon, createCoupon, updateCoupon } from "../../mock/commerce/couponRepository";
import type { Coupon, CouponAudience } from "../../types/commerce";
import styles from "../users/UserFormPage.module.css";

interface FormState {
  name: string;
  code: string;
  discountPercent: string;
  validFrom: string;
  validTo: string;
  audience: CouponAudience;
  userIdsText: string;
}

const EMPTY: FormState = {
  name: "", code: "", discountPercent: "", validFrom: "", validTo: "", audience: "Everyone", userIdsText: "",
};

export function CouponFormPage() {
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
    getCoupon(id).then((c) => {
      if (!c) return;
      setForm({
        name: c.name,
        code: c.code,
        discountPercent: String(c.discountPercent),
        validFrom: c.validFrom.slice(0, 10),
        validTo: c.validTo.slice(0, 10),
        audience: c.audience,
        userIdsText: c.userIds.join(", "),
      });
      setLoading(false);
    });
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Coupon name is required";
    if (!form.code.trim()) next.code = "Coupon code is required";
    const discount = Number(form.discountPercent);
    if (!form.discountPercent.trim() || Number.isNaN(discount) || discount <= 0 || discount > 100) {
      next.discountPercent = "Enter a discount percentage between 1 and 100";
    }
    if (!form.validFrom) next.validFrom = "Valid From date is required";
    if (!form.validTo) next.validTo = "Valid To date is required";
    if (form.validFrom && form.validTo && form.validFrom > form.validTo) next.validTo = "Valid To must be on or after Valid From";
    if (form.audience === "Specific Users" && !form.userIdsText.trim()) {
      next.userIdsText = "Enter at least one GGF user ID";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const userIds =
        form.audience === "Specific Users"
          ? form.userIdsText.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
      const payload: Omit<Coupon, "id" | "createdAt" | "updatedAt"> = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        discountPercent: Number(form.discountPercent),
        validFrom: form.validFrom,
        validTo: form.validTo,
        audience: form.audience,
        everyone: form.audience === "Everyone",
        userIds,
      };
      if (isEdit && id) {
        await updateCoupon(id, payload);
        show("Coupon updated");
      } else {
        await createCoupon(payload);
        show("Coupon created successfully");
      }
      navigate("/commerce/coupons");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <GlassCard><SkeletonForm fields={6} /></GlassCard>;

  return (
    <>
      <button className={styles.backLink} onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>
      <PageHeader
        title={isEdit ? "Edit Coupon" : "Add Coupon"}
        breadcrumb={[{ label: "Commerce", path: "/commerce/coupons" }, { label: "Coupons", path: "/commerce/coupons" }, { label: isEdit ? "Edit" : "Add" }]}
      />

      <div className={styles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Coupon Details</p>
          <div className={styles.grid}>
            <Field label="Coupon Name" required error={errors.name}>
              <Input value={form.name} error={!!errors.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Summer Shred Sale" />
            </Field>
            <Field label="Coupon Code" required error={errors.code} helperText="Automatically converted to uppercase">
              <Input
                value={form.code}
                error={!!errors.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER20"
              />
            </Field>
            <Field label="Discount (%)" required error={errors.discountPercent} helperText="Percentage discount applied at checkout">
              <Input
                type="number"
                min={1}
                max={100}
                value={form.discountPercent}
                error={!!errors.discountPercent}
                onChange={(e) => set("discountPercent", e.target.value)}
                placeholder="e.g. 20"
              />
            </Field>
            <Field label="Valid From" required error={errors.validFrom}>
              <Input type="date" value={form.validFrom} error={!!errors.validFrom} onChange={(e) => set("validFrom", e.target.value)} />
            </Field>
            <Field label="Valid To" required error={errors.validTo}>
              <Input type="date" value={form.validTo} error={!!errors.validTo} onChange={(e) => set("validTo", e.target.value)} />
            </Field>
            <Field label="Audience" required>
              <Select
                value={form.audience}
                onChange={(e) => set("audience", e.target.value as CouponAudience)}
                options={[
                  { label: "Everyone", value: "Everyone" },
                  { label: "Specific Users", value: "Specific Users" },
                ]}
              />
            </Field>
          </div>

          {form.audience === "Specific Users" && (
            <div style={{ marginTop: 16 }}>
              <Field
                label="Applicable User IDs"
                required
                error={errors.userIdsText}
                helperText="Comma-separated GGF user IDs this coupon applies to, e.g. GGF-10234, GGF-10891"
              >
                <Input
                  value={form.userIdsText}
                  error={!!errors.userIdsText}
                  onChange={(e) => set("userIdsText", e.target.value)}
                  placeholder="GGF-10234, GGF-10891"
                />
              </Field>
            </div>
          )}
        </GlassCard>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {isEdit ? "Update Coupon" : "Create Coupon"}
          </Button>
        </div>
      </div>
    </>
  );
}
