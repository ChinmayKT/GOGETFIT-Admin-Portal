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
import { Toggle } from "../../components/forms/Toggle";
import { FileUploader, toUploadedFile, type UploadedFile } from "../../components/media/FileUploader";
import { SkeletonForm } from "../../components/feedback/Skeleton";
import { useToast } from "../../components/feedback/ToastProvider";
import { getProduct, createProduct, updateProduct } from "../../mock/commerce/productRepository";
import type { Product, ProductSize } from "../../types/commerce";
import styles from "../users/UserFormPage.module.css";

const SIZES: ProductSize[] = ["S/M/L", "S/M", "M/L", "S/L", "One Size", "Free Size"];

interface FormState {
  name: string;
  description: string;
  points: string;
  size: ProductSize;
  active: boolean;
}

const EMPTY: FormState = { name: "", description: "", points: "", size: "One Size", active: true };

export function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [image, setImage] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "image", string>>>({});

  useEffect(() => {
    if (!id) return;
    getProduct(id).then((p) => {
      if (!p) return;
      setForm({
        name: p.name,
        description: p.description,
        points: String(p.points),
        size: p.size,
        active: p.status === "Active",
      });
      if (p.imageUrl) {
        setImage([{ id: "existing", name: p.imageFileName ?? "Current item image", sizeLabel: "", previewUrl: p.imageUrl, progress: 100, status: "done" }]);
      }
      setLoading(false);
    });
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState | "image", string>> = {};
    if (!form.name.trim()) next.name = "Item name is required";
    if (!form.description.trim()) next.description = "Description is required";
    const pointsNum = Number(form.points);
    if (!form.points.trim() || Number.isNaN(pointsNum) || pointsNum <= 0) next.points = "Enter a valid points value";
    if (!form.size) next.size = "Size is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
        name: form.name.trim(),
        description: form.description.trim(),
        points: Number(form.points),
        size: form.size,
        imageUrl: image[0]?.previewUrl ?? null,
        imageFileName: image[0]?.name ?? null,
        status: form.active ? "Active" : "Inactive",
      };
      if (isEdit && id) {
        await updateProduct(id, payload);
        show("Item updated");
        navigate(`/commerce/products/${id}`);
      } else {
        const created = await createProduct(payload);
        show("Item created successfully");
        navigate(`/commerce/products/${created.id}`);
      }
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
        title={isEdit ? "Edit Item" : "Add Item"}
        breadcrumb={[{ label: "Commerce", path: "/commerce/products" }, { label: "Products", path: "/commerce/products" }, { label: isEdit ? "Edit" : "Add" }]}
      />

      <div className={styles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Item Details</p>
          <div className={styles.grid}>
            <Field label="Item Name" required error={errors.name}>
              <Input value={form.name} error={!!errors.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. GoGetFit Steel Shaker Bottle" />
            </Field>
            <Field label="Points" required error={errors.points}>
              <Input
                type="number"
                min={0}
                value={form.points}
                error={!!errors.points}
                onChange={(e) => set("points", e.target.value)}
                placeholder="e.g. 500"
              />
            </Field>
            <Field label="Size" required error={errors.size}>
              <Select
                value={form.size}
                onChange={(e) => set("size", e.target.value as ProductSize)}
                options={SIZES.map((s) => ({ label: s, value: s }))}
              />
            </Field>
            <Field label="Status" required>
              <Toggle checked={form.active} onChange={(v) => set("active", v)} label={form.active ? "Active" : "Inactive"} />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <Field label="Description" required error={errors.description}>
              <Textarea rows={3} value={form.description} error={!!errors.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe this item..." />
            </Field>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 4 }}>Item Image</p>
          <p className="text-caption" style={{ marginBottom: 16 }}>JPG, JPEG or PNG only.</p>
          <Field error={errors.image}>
            <FileUploader
              accept="image/jpeg,image/jpg,image/png"
              acceptLabel="JPG, JPEG, PNG"
              files={image}
              onAdd={(list) => setImage([toUploadedFile(list[0], "item-image")])}
              onRemove={() => setImage([])}
            />
          </Field>
        </GlassCard>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {isEdit ? "Update Item" : "Create Item"}
          </Button>
        </div>
      </div>
    </>
  );
}
