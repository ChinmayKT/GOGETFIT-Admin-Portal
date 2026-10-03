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
import { FileUploader, toUploadedFile, type UploadedFile } from "../../components/media/FileUploader";
import { SkeletonForm } from "../../components/feedback/Skeleton";
import { ErrorState } from "../../components/feedback/ErrorState";
import { useToast } from "../../components/feedback/ToastProvider";
import { createFood, getFood, removeFoodImage, updateFood, uploadFoodImage } from "../../api/foods";
import { resolveMediaUrl } from "../../api/media";
import { ApiError } from "../../api/client";
import { FOOD_TYPES, FOOD_UNITS, type Food, type FoodType, type FoodUnit } from "../../types/food";
import styles from "../users/UserFormPage.module.css";

/**
 * Add / Edit Food, backed by /api/admin/foods.
 *
 * The picture has its own endpoint, so a new food is created first and the
 * image uploaded against its id. The backend validates everything again - what
 * happens here is only to tell the operator sooner.
 */

interface FormState {
  name: string;
  foodType: FoodType;
  brand: string;
  unit: FoodUnit;
  quantity: string;
  notes: string;
  calories: string;
  fat: string;
  carbs: string;
  protein: string;
}

const EMPTY: FormState = {
  name: "", foodType: "Vegetarian", brand: "", unit: "Serving", quantity: "1", notes: "",
  calories: "0", fat: "0", carbs: "0", protein: "0",
};

const NUMERIC_FIELDS = ["calories", "fat", "carbs", "protein"] as const;

const asFormState = (food: Food): FormState => ({
  name: food.name,
  foodType: (FOOD_TYPES as readonly string[]).includes(food.foodType) ? (food.foodType as FoodType) : "Vegetarian",
  brand: food.brand ?? "",
  unit: (FOOD_UNITS as readonly string[]).includes(food.serving.unit) ? (food.serving.unit as FoodUnit) : "Serving",
  quantity: String(food.serving.quantity),
  notes: food.notes ?? "",
  calories: String(food.nutrition.calories),
  fat: String(food.nutrition.fat),
  carbs: String(food.nutrition.carbs),
  protein: String(food.nutrition.protein),
});

export function FoodFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [food, setFood] = useState<Food | null>(null);
  const [image, setImage] = useState<UploadedFile[]>([]);
  /** The picture chosen in this session, uploaded only when the form is saved. */
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imageCleared, setImageCleared] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!id) return;
    let stale = false;
    setLoading(true);
    setLoadFailed(false);
    getFood(id)
      .then((f) => {
        if (stale) return;
        setFood(f);
        setForm(asFormState(f));
        const url = resolveMediaUrl(f.image?.url);
        setImage(url ? [{ id: "existing", name: "Current image", sizeLabel: "", previewUrl: url, progress: 100, status: "done" }] : []);
      })
      .catch(() => {
        if (!stale) setLoadFailed(true);
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Food name is required";

    const quantity = Number(form.quantity);
    if (form.quantity.trim() === "" || !Number.isFinite(quantity) || quantity <= 0) {
      next.quantity = "Enter a quantity greater than 0";
    }
    for (const field of NUMERIC_FIELDS) {
      const value = Number(form[field]);
      if (form[field].trim() === "" || !Number.isFinite(value)) next[field] = "Enter a number";
      else if (value < 0) next[field] = "Cannot be negative";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        foodType: form.foodType,
        brand: form.brand.trim() === "" ? null : form.brand.trim(),
        serving: { unit: form.unit, quantity: Number(form.quantity) },
        nutrition: {
          calories: Number(form.calories),
          fat: Number(form.fat),
          carbs: Number(form.carbs),
          protein: Number(form.protein),
        },
        notes: form.notes.trim() === "" ? null : form.notes.trim(),
      };

      // The legacy block is never in the body: the server would refuse it, and
      // a migrated food keeps the one it already has.
      const saved = isEdit && id ? await updateFood(id, payload) : await createFood(payload);

      if (pendingImage) await uploadFoodImage(saved.id, pendingImage);
      else if (isEdit && imageCleared && food?.image) await removeFoodImage(saved.id);

      show(isEdit ? "Food item updated" : "Food item created successfully");
      navigate("/nutrition/foods");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Could not save this food. Please try again.";
      show(message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <GlassCard><SkeletonForm fields={8} /></GlassCard>;

  if (loadFailed) {
    return (
      <GlassCard>
        <ErrorState
          title="Could not load this food"
          description="The food database could not be reached, or this food no longer exists."
          onRetry={() => navigate("/nutrition/foods")}
        />
      </GlassCard>
    );
  }

  return (
    <>
      <button className={styles.backLink} onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>
      <PageHeader
        title={isEdit ? "Edit Food" : "Add Food"}
        breadcrumb={[
          { label: "Nutrition", path: "/nutrition/foods" },
          { label: "Food Database", path: "/nutrition/foods" },
          { label: isEdit ? "Edit" : "Add" },
        ]}
        description={
          // Traceability for a migrated food, as secondary metadata only.
          food?.legacy ? `Legacy Food ID: ${food.legacy.foodId}` : undefined
        }
      />

      <div className={styles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Food Details</p>
          <div className={styles.grid}>
            <Field label="Food Name" required error={errors.name}>
              <Input value={form.name} error={!!errors.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Food Type" required>
              <Select
                value={form.foodType}
                onChange={(e) => set("foodType", e.target.value as FoodType)}
                options={FOOD_TYPES.map((t) => ({ label: t, value: t }))}
              />
            </Field>
            <Field label="Brand Name">
              <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Home Made, Amul..." />
            </Field>
            <Field label="Unit" required>
              <Select
                value={form.unit}
                onChange={(e) => set("unit", e.target.value as FoodUnit)}
                options={FOOD_UNITS.map((u) => ({ label: u, value: u }))}
              />
            </Field>
            <Field label="Qty" required error={errors.quantity}>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={form.quantity}
                error={!!errors.quantity}
                onChange={(e) => set("quantity", e.target.value)}
              />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <Field label="Comments">
              <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <Field label="Food Image" helperText="JPG, JPEG or PNG only">
              <FileUploader
                accept="image/jpeg,image/jpg,image/png"
                acceptLabel="JPG, JPEG, PNG"
                files={image}
                onAdd={(list) => {
                  const file = list[0];
                  if (!file) return;
                  setPendingImage(file);
                  setImageCleared(false);
                  setImage([toUploadedFile(file, "pending")]);
                }}
                onRemove={() => {
                  setPendingImage(null);
                  setImageCleared(true);
                  setImage([]);
                }}
              />
            </Field>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>
            Nutrition (per {form.quantity || "1"} {form.unit})
          </p>
          <div className={styles.grid}>
            <Field label="Calories" required error={errors.calories}>
              <Input type="number" min="0" step="1" value={form.calories} error={!!errors.calories} onChange={(e) => set("calories", e.target.value)} />
            </Field>
            <Field label="Fat (g)" required error={errors.fat}>
              <Input type="number" min="0" step="0.1" value={form.fat} error={!!errors.fat} onChange={(e) => set("fat", e.target.value)} />
            </Field>
            <Field label="Carbs (g)" required error={errors.carbs}>
              <Input type="number" min="0" step="0.1" value={form.carbs} error={!!errors.carbs} onChange={(e) => set("carbs", e.target.value)} />
            </Field>
            <Field label="Protein (g)" required error={errors.protein}>
              <Input type="number" min="0" step="0.1" value={form.protein} error={!!errors.protein} onChange={(e) => set("protein", e.target.value)} />
            </Field>
          </div>
        </GlassCard>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          {/* `loading` disables the button, so one click cannot create two foods. */}
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {isEdit ? "Update Food" : "Create Food"}
          </Button>
        </div>
      </div>
    </>
  );
}
