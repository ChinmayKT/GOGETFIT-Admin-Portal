import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Film } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Textarea } from "../../components/forms/Textarea";
import { Toggle } from "../../components/forms/Toggle";
import { FileUploader, toUploadedFile, type UploadedFile } from "../../components/media/FileUploader";
import { SkeletonForm } from "../../components/feedback/Skeleton";
import { useToast } from "../../components/feedback/ToastProvider";
import { getChallenge, createChallenge, updateChallenge } from "../../mock/challenges/repository";
import { nextId } from "../../mock/shared/utils";
import styles from "../users/UserFormPage.module.css";

interface FormState {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  enrollmentLastDate: string;
  priority: boolean;
}

const EMPTY: FormState = { name: "", description: "", startDate: "", endDate: "", enrollmentLastDate: "", priority: false };

export function ChallengeFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [videoFiles, setVideoFiles] = useState<UploadedFile[]>([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!id) return;
    getChallenge(id).then((c) => {
      if (!c) return;
      setForm({
        name: c.name, description: c.description, startDate: c.startDate, endDate: c.endDate,
        enrollmentLastDate: c.enrollmentLastDate, priority: c.priority,
      });
      if (c.sampleVideoUrl) {
        setVideoFiles([{ id: "existing", name: c.sampleVideoFileName ?? "Current sample video", sizeLabel: "", progress: 100, status: "done" }]);
        setVideoPreviewUrl(c.sampleVideoUrl);
      }
      setLoading(false);
    });
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleAddVideo(list: File[]) {
    const file = list[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoFiles([{ ...toUploadedFile(file, nextId("challengevideo")), previewUrl: undefined }]);
    setVideoPreviewUrl(url);
  }

  function handleRemoveVideo() {
    setVideoFiles([]);
    setVideoPreviewUrl(null);
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Challenge name is required";
    if (!form.description.trim()) next.description = "Description is required";
    if (!form.startDate) next.startDate = "Start date is required";
    if (!form.endDate) next.endDate = "End date is required";
    if (!form.enrollmentLastDate) next.enrollmentLastDate = "Enrollment last date is required";

    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      next.endDate = "End date must be on or after the start date";
    }
    if (form.enrollmentLastDate && form.startDate && form.enrollmentLastDate > form.startDate) {
      next.enrollmentLastDate = "Enrollment must close on or before the start date";
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
        description: form.description.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        enrollmentLastDate: form.enrollmentLastDate,
        priority: form.priority,
        sampleVideoUrl: videoPreviewUrl,
        sampleVideoFileName: videoFiles[0]?.name ?? null,
      };
      if (isEdit && id) {
        await updateChallenge(id, payload);
        show("Challenge updated");
      } else {
        await createChallenge(payload);
        show("Challenge created successfully");
      }
      navigate("/challenges");
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
        title={isEdit ? "Edit Challenge" : "Add Challenge"}
        breadcrumb={[{ label: "Challenges", path: "/challenges" }, { label: isEdit ? "Edit" : "Add" }]}
      />

      <div className={styles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Challenge Details</p>
          <div className={styles.grid}>
            <Field label="Challenge Name" required error={errors.name}>
              <Input value={form.name} error={!!errors.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. 30-Day Fat Loss Challenge" />
            </Field>
            <Field label="Start Date" required error={errors.startDate}>
              <Input type="date" value={form.startDate} error={!!errors.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </Field>
            <Field label="End Date" required error={errors.endDate}>
              <Input type="date" value={form.endDate} error={!!errors.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </Field>
            <Field label="Enrollment Last Date" required error={errors.enrollmentLastDate}>
              <Input type="date" value={form.enrollmentLastDate} error={!!errors.enrollmentLastDate} onChange={(e) => set("enrollmentLastDate", e.target.value)} />
            </Field>
            <Field label="Priority">
              <Toggle checked={form.priority} onChange={(v) => set("priority", v)} label={form.priority ? "Priority challenge" : "Normal priority"} />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <Field label="Description" required error={errors.description}>
              <Textarea rows={4} value={form.description} error={!!errors.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the challenge, its goals, and rules..." />
            </Field>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Sample Video</p>
          <Field helperText=".mp4 only">
            <FileUploader
              accept="video/mp4"
              acceptLabel=".mp4 only"
              files={videoFiles}
              onAdd={handleAddVideo}
              onRemove={handleRemoveVideo}
            />
          </Field>
          <div style={{ marginTop: 12 }}>
            {videoPreviewUrl ? (
              <video controls src={videoPreviewUrl} style={{ width: "100%", maxWidth: 480, borderRadius: 10, background: "#000" }} />
            ) : (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                height: 140, maxWidth: 480, borderRadius: 10, border: "1px dashed var(--glass-border)", color: "var(--text-muted)",
              }}>
                <Film size={20} />
                <span className="text-caption">No sample video uploaded yet</span>
              </div>
            )}
          </div>
        </GlassCard>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {isEdit ? "Update Challenge" : "Create Challenge"}
          </Button>
        </div>
      </div>
    </>
  );
}
