import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Film, ImageOff } from "lucide-react";
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
import { getWorkout, createWorkout, updateWorkout } from "../../mock/workouts/repository";
import { WORKOUT_TYPES, WORKOUT_EQUIPMENT, WORKOUT_LEVELS, MUSCLE_GROUPS } from "../../mock/workouts/reference";
import { nextId } from "../../mock/shared/utils";
import type { WorkoutEquipment, WorkoutLevel, WorkoutType } from "../../types/workout";
import styles from "../users/UserFormPage.module.css";

interface FormState {
  name: string;
  type: WorkoutType;
  equipment: WorkoutEquipment;
  primaryMuscle: string;
  secondaryMuscle: string;
  level: WorkoutLevel;
  description: string;
  youtubeLink: string;
}

const EMPTY: FormState = {
  name: "", type: "Gym", equipment: "Gym Equipment", primaryMuscle: "", secondaryMuscle: "",
  level: 1, description: "", youtubeLink: "",
};

export function WorkoutFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [videoFiles, setVideoFiles] = useState<UploadedFile[]>([]);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [thumbFiles, setThumbFiles] = useState<UploadedFile[]>([]);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!id) return;
    getWorkout(id).then((w) => {
      if (!w) return;
      setForm({
        name: w.name, type: w.type, equipment: w.equipment, primaryMuscle: w.primaryMuscle,
        secondaryMuscle: w.secondaryMuscle ?? "", level: w.level, description: w.description,
        youtubeLink: w.youtubeLink ?? "",
      });
      if (w.videoUrl) {
        setVideoFiles([{ id: "existing", name: w.videoFileName ?? "Current workout video", sizeLabel: "", progress: 100, status: "done" }]);
        setVideoPreviewUrl(w.videoUrl);
      }
      if (w.thumbnailUrl) {
        setThumbFiles([{ id: "existing", name: w.thumbnailFileName ?? "Current thumbnail", previewUrl: w.thumbnailUrl, sizeLabel: "", progress: 100, status: "done" }]);
        setThumbPreviewUrl(w.thumbnailUrl);
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
    setVideoFiles([{ ...toUploadedFile(file, nextId("workoutvideo")), previewUrl: undefined }]);
    setVideoPreviewUrl(url);
  }

  function handleRemoveVideo() {
    setVideoFiles([]);
    setVideoPreviewUrl(null);
  }

  function handleAddThumbnail(list: File[]) {
    const file = list[0];
    if (!file) return;
    const uploaded = toUploadedFile(file, nextId("workoutthumb"));
    setThumbFiles([uploaded]);
    setThumbPreviewUrl(uploaded.previewUrl ?? null);
  }

  function handleRemoveThumbnail() {
    setThumbFiles([]);
    setThumbPreviewUrl(null);
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "WorkOut name is required";
    if (!form.primaryMuscle.trim()) next.primaryMuscle = "Primary muscle is required";
    if (!form.description.trim()) next.description = "Description is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        equipment: form.equipment,
        primaryMuscle: form.primaryMuscle,
        secondaryMuscle: form.secondaryMuscle || null,
        level: form.level,
        description: form.description.trim(),
        youtubeLink: form.youtubeLink.trim() || null,
        videoUrl: videoPreviewUrl,
        videoFileName: videoFiles[0]?.name ?? null,
        thumbnailUrl: thumbPreviewUrl,
        thumbnailFileName: thumbFiles[0]?.name ?? null,
      };
      if (isEdit && id) {
        await updateWorkout(id, payload);
        show("Workout updated");
      } else {
        await createWorkout(payload);
        show("Workout created successfully");
      }
      navigate("/fitness/workouts");
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
        title={isEdit ? "Edit Workout" : "Add Workout"}
        breadcrumb={[{ label: "Fitness" }, { label: "Workouts", path: "/fitness/workouts" }, { label: isEdit ? "Edit" : "Add" }]}
      />

      <div className={styles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>WorkOut Details</p>
          <div className={styles.grid}>
            <Field label="WorkOut Name" required error={errors.name}>
              <Input value={form.name} error={!!errors.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Barbell Bench Press" />
            </Field>
            <Field label="WorkOut Type">
              <Select value={form.type} onChange={(e) => set("type", e.target.value as WorkoutType)} options={WORKOUT_TYPES.map((t) => ({ label: t, value: t }))} />
            </Field>
            <Field label="Equipment">
              <Select value={form.equipment} onChange={(e) => set("equipment", e.target.value as WorkoutEquipment)} options={WORKOUT_EQUIPMENT.map((eq) => ({ label: eq, value: eq }))} />
            </Field>
            <Field label="Primary Muscle" required error={errors.primaryMuscle}>
              <Select
                value={form.primaryMuscle}
                error={!!errors.primaryMuscle}
                onChange={(e) => set("primaryMuscle", e.target.value)}
                placeholder="Select muscle"
                options={MUSCLE_GROUPS.map((m) => ({ label: m, value: m }))}
              />
            </Field>
            <Field label="Secondary Muscle" helperText="Optional">
              <Select
                value={form.secondaryMuscle}
                onChange={(e) => set("secondaryMuscle", e.target.value)}
                placeholder="None"
                options={MUSCLE_GROUPS.map((m) => ({ label: m, value: m }))}
              />
            </Field>
            <Field label="Workout Level">
              <Select value={String(form.level)} onChange={(e) => set("level", Number(e.target.value) as WorkoutLevel)} options={WORKOUT_LEVELS.map((l) => ({ label: `Level ${l}`, value: String(l) }))} />
            </Field>
            <Field label="Youtube Link" helperText="Optional reference link">
              <Input value={form.youtubeLink} onChange={(e) => set("youtubeLink", e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <Field label="Description" required error={errors.description}>
              <Textarea rows={4} value={form.description} error={!!errors.description} onChange={(e) => set("description", e.target.value)} placeholder="Explain how to perform this workout, cues, and tips..." />
            </Field>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Media</p>
          <div className={styles.grid}>
            <div>
              <Field label="Workout Video" helperText=".mp4 only">
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
                  <video controls src={videoPreviewUrl} style={{ width: "100%", borderRadius: 10, background: "#000" }} />
                ) : (
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                    height: 140, borderRadius: 10, border: "1px dashed var(--glass-border)", color: "var(--text-muted)",
                  }}>
                    <Film size={20} />
                    <span className="text-caption">No video uploaded yet</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Field label="Video Thumbnail" helperText=".jpg, .jpeg or .png only">
                <FileUploader
                  accept="image/jpeg,image/jpg,image/png"
                  acceptLabel="JPG, JPEG, PNG"
                  files={thumbFiles}
                  onAdd={handleAddThumbnail}
                  onRemove={handleRemoveThumbnail}
                />
              </Field>
              <div style={{ marginTop: 12 }}>
                {thumbPreviewUrl ? (
                  <img src={thumbPreviewUrl} alt="Video thumbnail preview" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10 }} />
                ) : (
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                    height: 140, borderRadius: 10, border: "1px dashed var(--glass-border)", color: "var(--text-muted)",
                  }}>
                    <ImageOff size={20} />
                    <span className="text-caption">No thumbnail uploaded yet</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {isEdit ? "Update WorkOut" : "Create WorkOut"}
          </Button>
        </div>
      </div>
    </>
  );
}
