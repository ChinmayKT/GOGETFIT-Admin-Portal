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
import { getBanner, createBanner, updateBanner } from "../../mock/content/bannerRepository";
import type { Banner, BannerRedirectTarget } from "../../types/content";
import styles from "../users/UserFormPage.module.css";

const REDIRECT_TARGETS: BannerRedirectTarget[] = ["Home", "Diet Plans", "Challenges", "Store", "Coach Profile", "External URL"];

interface FormState {
  name: string;
  description: string;
  redirectTarget: BannerRedirectTarget;
  redirectUrl: string;
  fromDate: string;
  toDate: string;
  active: boolean;
}

const EMPTY: FormState = {
  name: "", description: "", redirectTarget: "Home", redirectUrl: "", fromDate: "", toDate: "", active: true,
};

export function BannerFormPage() {
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
    getBanner(id).then((b) => {
      if (!b) return;
      setForm({
        name: b.name, description: b.description, redirectTarget: b.redirectTarget,
        redirectUrl: b.redirectUrl ?? "", fromDate: b.fromDate.slice(0, 10), toDate: b.toDate.slice(0, 10),
        active: b.status === "Active",
      });
      if (b.imageUrl) setImage([{ id: "existing", name: b.imageFileName ?? "Current banner image", sizeLabel: "", previewUrl: b.imageUrl, progress: 100, status: "done" }]);
      setLoading(false);
    });
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState | "image", string>> = {};
    if (!form.name.trim()) next.name = "Banner name is required";
    if (!form.description.trim()) next.description = "Description is required";
    if (form.redirectTarget === "External URL" && !form.redirectUrl.trim()) next.redirectUrl = "Enter the destination URL";
    if (!form.fromDate) next.fromDate = "From date is required";
    if (!form.toDate) next.toDate = "To date is required";
    if (form.fromDate && form.toDate && form.fromDate > form.toDate) next.toDate = "To date must be on or after the from date";
    if (image.length === 0) next.image = "A banner image is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: Omit<Banner, "id" | "createdAt" | "updatedAt"> = {
        name: form.name.trim(),
        description: form.description.trim(),
        redirectTarget: form.redirectTarget,
        redirectUrl: form.redirectTarget === "External URL" ? form.redirectUrl.trim() : null,
        fromDate: form.fromDate,
        toDate: form.toDate,
        status: form.active ? "Active" : "Inactive",
        imageUrl: image[0]?.previewUrl ?? null,
        imageFileName: image[0]?.name ?? null,
      };
      if (isEdit && id) {
        await updateBanner(id, payload);
        show("Banner updated");
        navigate(`/content/banners/${id}`);
      } else {
        const created = await createBanner(payload);
        show("Banner created successfully");
        navigate(`/content/banners/${created.id}`);
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
        title={isEdit ? "Edit Banner" : "Add Banner"}
        breadcrumb={[{ label: "Content", path: "/content/banners" }, { label: "Banners", path: "/content/banners" }, { label: isEdit ? "Edit" : "Add" }]}
      />

      <div className={styles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Banner Details</p>
          <div className={styles.grid}>
            <Field label="Banner Name" required error={errors.name}>
              <Input value={form.name} error={!!errors.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Summer Fat-Loss Sale" />
            </Field>
            <Field label="Redirect To" required error={errors.redirectUrl}>
              <Select
                value={form.redirectTarget}
                onChange={(e) => set("redirectTarget", e.target.value as BannerRedirectTarget)}
                options={REDIRECT_TARGETS.map((t) => ({ label: t, value: t }))}
              />
            </Field>
            {form.redirectTarget === "External URL" && (
              <Field label="External URL" required error={errors.redirectUrl}>
                <Input value={form.redirectUrl} error={!!errors.redirectUrl} onChange={(e) => set("redirectUrl", e.target.value)} placeholder="https://..." />
              </Field>
            )}
            <Field label="From Date" required error={errors.fromDate}>
              <Input type="date" value={form.fromDate} error={!!errors.fromDate} onChange={(e) => set("fromDate", e.target.value)} />
            </Field>
            <Field label="To Date" required error={errors.toDate}>
              <Input type="date" value={form.toDate} error={!!errors.toDate} onChange={(e) => set("toDate", e.target.value)} />
            </Field>
            <Field label="Status" required>
              <Toggle checked={form.active} onChange={(v) => set("active", v)} label={form.active ? "Active" : "Inactive"} />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <Field label="Description" required error={errors.description}>
              <Textarea rows={3} value={form.description} error={!!errors.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe what this banner promotes..." />
            </Field>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 4 }}>Banner Image</p>
          <p className="text-caption" style={{ marginBottom: 16 }}>JPG, JPEG or PNG only. Required.</p>
          <Field error={errors.image}>
            <FileUploader
              accept="image/jpeg,image/jpg,image/png"
              acceptLabel="JPG, JPEG, PNG"
              files={image}
              onAdd={(list) => { setImage([toUploadedFile(list[0], "banner-image")]); setErrors((e) => ({ ...e, image: undefined })); }}
              onRemove={() => setImage([])}
            />
          </Field>
        </GlassCard>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {isEdit ? "Update Banner" : "Create Banner"}
          </Button>
        </div>
      </div>
    </>
  );
}
