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
import { useToast } from "../../components/feedback/ToastProvider";
import { getFood, createFood, updateFood } from "../../mock/nutrition/foodRepository";
import { FOOD_UNITS } from "../../mock/nutrition/reference";
import { nextId } from "../../mock/shared/utils";
import type { FoodType, FoodUnit } from "../../types/nutrition";
import styles from "../users/UserFormPage.module.css";

interface FormState {
  foodName: string;
  foodType: FoodType;
  brandName: string;
  unit: FoodUnit;
  qty: string;
  comments: string;
  calories: string;
  fat: string;
  carbs: string;
  protein: string;
}

const EMPTY: FormState = {
  foodName: "", foodType: "Vegetarian", brandName: "", unit: "Serving", qty: "1", comments: "",
  calories: "0", fat: "0", carbs: "0", protein: "0",
};

export function FoodFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [image, setImage] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!id) return;
    getFood(id).then((f) => {
      if (!f) return;
      setForm({
        foodName: f.foodName, foodType: f.foodType, brandName: f.brandName, unit: f.unit, qty: String(f.qty),
        comments: f.comments, calories: String(f.calories), fat: String(f.fat), carbs: String(f.carbs), protein: String(f.protein),
      });
      if (f.image) setImage([{ id: "existing", name: "Current image", sizeLabel: "", previewUrl: f.image, progress: 100, status: "done" }]);
      setLoading(false);
    });
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.foodName.trim()) next.foodName = "Food name is required";
    if (!form.qty || Number(form.qty) <= 0) next.qty = "Enter a valid quantity";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        foodName: form.foodName, foodType: form.foodType, brandName: form.brandName, unit: form.unit,
        qty: Number(form.qty) || 0, comments: form.comments,
        calories: Number(form.calories) || 0, fat: Number(form.fat) || 0, carbs: Number(form.carbs) || 0, protein: Number(form.protein) || 0,
        image: image[0]?.previewUrl ?? null,
      };
      if (isEdit && id) {
        await updateFood(id, payload);
        show("Food item updated");
      } else {
        await createFood(payload);
        show("Food item created successfully");
      }
      navigate("/nutrition/foods");
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
        title={isEdit ? "Edit Food" : "Add Food"}
        breadcrumb={[{ label: "Nutrition", path: "/nutrition/foods" }, { label: "Food Database", path: "/nutrition/foods" }, { label: isEdit ? "Edit" : "Add" }]}
      />

      <div className={styles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Food Details</p>
          <div className={styles.grid}>
            <Field label="Food Name" required error={errors.foodName}>
              <Input value={form.foodName} error={!!errors.foodName} onChange={(e) => set("foodName", e.target.value)} />
            </Field>
            <Field label="Food Type" required>
              <Select
                value={form.foodType}
                onChange={(e) => set("foodType", e.target.value as FoodType)}
                options={[{ label: "Vegetarian", value: "Vegetarian" }, { label: "Non-Vegetarian", value: "Non-Vegetarian" }]}
              />
            </Field>
            <Field label="Brand Name">
              <Input value={form.brandName} onChange={(e) => set("brandName", e.target.value)} placeholder="e.g. Home Made, Amul..." />
            </Field>
            <Field label="Unit" required>
              <Select value={form.unit} onChange={(e) => set("unit", e.target.value as FoodUnit)} options={FOOD_UNITS.map((u) => ({ label: u, value: u }))} />
            </Field>
            <Field label="Qty" required error={errors.qty}>
              <Input type="number" min="0" step="0.1" value={form.qty} error={!!errors.qty} onChange={(e) => set("qty", e.target.value)} />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <Field label="Comments">
              <Textarea rows={2} value={form.comments} onChange={(e) => set("comments", e.target.value)} />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <Field label="Food Image" helperText="JPG, JPEG or PNG only">
              <FileUploader
                accept="image/jpeg,image/jpg,image/png"
                acceptLabel="JPG, JPEG, PNG"
                files={image}
                onAdd={(list) => setImage([toUploadedFile(list[0], nextId("foodimg"))])}
                onRemove={() => setImage([])}
              />
            </Field>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Nutrition (per serving)</p>
          <div className={styles.grid}>
            <Field label="Calories">
              <Input type="number" min="0" step="1" value={form.calories} onChange={(e) => set("calories", e.target.value)} />
            </Field>
            <Field label="Fat (g)">
              <Input type="number" min="0" step="0.1" value={form.fat} onChange={(e) => set("fat", e.target.value)} />
            </Field>
            <Field label="Carbs (g)">
              <Input type="number" min="0" step="0.1" value={form.carbs} onChange={(e) => set("carbs", e.target.value)} />
            </Field>
            <Field label="Protein (g)">
              <Input type="number" min="0" step="0.1" value={form.protein} onChange={(e) => set("protein", e.target.value)} />
            </Field>
          </div>
        </GlassCard>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {isEdit ? "Update Food" : "Create Food"}
          </Button>
        </div>
      </div>
    </>
  );
}
