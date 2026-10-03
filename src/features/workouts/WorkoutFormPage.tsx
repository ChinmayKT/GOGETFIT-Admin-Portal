import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Film, ImageOff, PlayCircle } from "lucide-react";
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
import {
  createWorkout,
  getWorkout,
  updateWorkout,
  uploadWorkoutThumbnail,
  uploadWorkoutVideo,
} from "../../api/workouts";
import { resolveMediaUrl } from "../../api/media";
import { ApiError } from "../../api/client";
import {
  EQUIPMENT_LABELS,
  MUSCLE_SUGGESTIONS,
  WORKOUT_EQUIPMENT,
  WORKOUT_LEVELS,
  WORKOUT_TYPES,
  type Workout,
  type WorkoutEquipment,
  type WorkoutLevel,
  type WorkoutType,
} from "../../types/workout";
import styles from "../users/UserFormPage.module.css";

/**
 * Add / Edit Workout, backed by /api/admin/workouts.
 *
 * Video and thumbnail have their own endpoints, so a new workout is created
 * first and the files uploaded against its id. On edit, a file is only sent
 * when a new one was chosen - editing text alone leaves both files untouched,
 * which is the rule the legacy update had.
 */

interface FormState {
  name: string;
  type: WorkoutType;
  equipment: WorkoutEquipment;
  primaryMuscle: string;
  secondaryMuscle: string;
  level: WorkoutLevel;
  description: string;
  youtubeUrl: string;
}

const EMPTY: FormState = {
  name: "", type: "Gym", equipment: "Gym Equipment", primaryMuscle: "", secondaryMuscle: "",
  level: 1, description: "", youtubeUrl: "",
};

const asFormState = (w: Workout): FormState => ({
  name: w.name,
  type: (WORKOUT_TYPES as readonly string[]).includes(w.type) ? (w.type as WorkoutType) : "Gym",
  equipment: (WORKOUT_EQUIPMENT as readonly string[]).includes(w.equipment)
    ? (w.equipment as WorkoutEquipment)
    : "Gym Equipment",
  primaryMuscle: w.primaryMuscle,
  secondaryMuscle: w.secondaryMuscle ?? "",
  level: ((WORKOUT_LEVELS as readonly number[]).includes(w.level) ? w.level : 1) as WorkoutLevel,
  description: w.description,
  youtubeUrl: w.youtubeUrl ?? "",
});

export function WorkoutFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [thumbFiles, setThumbFiles] = useState<UploadedFile[]>([]);
  const [videoFiles, setVideoFiles] = useState<UploadedFile[]>([]);
  /** Files chosen in this session; uploaded only when the form is saved. */
  const [pendingThumb, setPendingThumb] = useState<File | null>(null);
  const [pendingVideo, setPendingVideo] = useState<File | null>(null);

  const [loading, setLoading] = useState(isEdit);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!id) return;
    let stale = false;
    setLoading(true);
    setLoadFailed(false);
    getWorkout(id)
      .then((w) => {
        if (stale) return;
        setWorkout(w);
        setForm(asFormState(w));
        const thumb = resolveMediaUrl(w.thumbnail?.url);
        setThumbFiles(
          thumb ? [{ id: "existing", name: "Current thumbnail", sizeLabel: "", previewUrl: thumb, progress: 100, status: "done" }] : [],
        );
        setVideoFiles(
          w.video?.url ? [{ id: "existing", name: "Current video (.mp4)", sizeLabel: "", progress: 100, status: "done" }] : [],
        );
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
    if (!form.name.trim()) next.name = "Workout name is required";
    if (!form.primaryMuscle.trim()) next.primaryMuscle = "Primary muscle is required";
    if (!form.description.trim()) next.description = "Description is required";

    const link = form.youtubeUrl.trim();
    if (link) {
      try {
        const url = new URL(link);
        const host = url.hostname.replace(/^www\./i, "").toLowerCase();
        if (!["youtube.com", "m.youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host)) {
          next.youtubeUrl = "Enter a YouTube link";
        }
      } catch {
        next.youtubeUrl = "Enter a valid URL";
      }
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
        type: form.type,
        equipment: form.equipment,
        primaryMuscle: form.primaryMuscle.trim(),
        secondaryMuscle: form.secondaryMuscle.trim() === "" ? null : form.secondaryMuscle.trim(),
        level: form.level,
        description: form.description.trim(),
        youtubeUrl: form.youtubeUrl.trim() === "" ? null : form.youtubeUrl.trim(),
      };

      const saved = isEdit && id ? await updateWorkout(id, payload) : await createWorkout(payload);

      // Only a newly chosen file is sent, so an unrelated text edit never
      // replaces the stored video or thumbnail.
      if (pendingThumb) await uploadWorkoutThumbnail(saved.id, pendingThumb);
      if (pendingVideo) await uploadWorkoutVideo(saved.id, pendingVideo);

      show(isEdit ? "Workout updated" : "Workout created successfully");
      navigate("/fitness/workouts");
    } catch (error) {
      show(error instanceof ApiError ? error.message : "Could not save this workout. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  // What the large preview shows: the file just chosen, else the stored one.
  const thumbPreview = thumbFiles[0]?.previewUrl ?? null;

  /** The link as typed, if it is a usable http(s) URL. Null disables Watch. */
  const openableLink = (() => {
    const value = form.youtubeUrl.trim();
    if (!value) return null;
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? value : null;
    } catch {
      return null;
    }
  })();

  if (loading) return <GlassCard><SkeletonForm fields={8} /></GlassCard>;

  if (loadFailed) {
    return (
      <GlassCard>
        <ErrorState
          title="Could not load this workout"
          description="The workout library could not be reached, or this workout no longer exists."
          onRetry={() => navigate("/fitness/workouts")}
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
        title={isEdit ? "Edit Workout" : "Add Workout"}
        breadcrumb={[
          { label: "Fitness", path: "/fitness/workouts" },
          { label: "Workouts", path: "/fitness/workouts" },
          { label: isEdit ? "Edit" : "Add" },
        ]}
        description={workout?.legacy ? `Legacy Workout ID: ${workout.legacy.workoutId}` : undefined}
      />

      <div className={styles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Main Info</p>
          <div className={styles.grid}>
            <Field label="WorkOut Name" required error={errors.name}>
              <Input value={form.name} error={!!errors.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="WorkOut Type" required>
              <Select
                value={form.type}
                onChange={(e) => set("type", e.target.value as WorkoutType)}
                options={WORKOUT_TYPES.map((t) => ({ label: t, value: t }))}
              />
            </Field>
            <Field label="WorkOut Equipment" required>
              <Select
                value={form.equipment}
                onChange={(e) => set("equipment", e.target.value as WorkoutEquipment)}
                options={WORKOUT_EQUIPMENT.map((eq) => ({ label: EQUIPMENT_LABELS[eq], value: eq }))}
              />
            </Field>
            <Field label="Primary Muscle" required error={errors.primaryMuscle}>
              <Input
                list="muscle-suggestions"
                value={form.primaryMuscle}
                error={!!errors.primaryMuscle}
                onChange={(e) => set("primaryMuscle", e.target.value)}
                placeholder="e.g. Chest, Back (Cool Down)..."
              />
            </Field>
            <Field label="Secondary Muscle">
              <Input
                list="muscle-suggestions"
                value={form.secondaryMuscle}
                onChange={(e) => set("secondaryMuscle", e.target.value)}
                placeholder="Optional"
              />
            </Field>
            <Field label="WorkOut Level" required>
              <Select
                value={String(form.level)}
                onChange={(e) => set("level", Number(e.target.value) as WorkoutLevel)}
                options={WORKOUT_LEVELS.map((l) => ({ label: `LEVEL ${l}`, value: String(l) }))}
              />
            </Field>
          </div>

          {/* Free text, as legacy stored it - the list only suggests. */}
          <datalist id="muscle-suggestions">
            {MUSCLE_SUGGESTIONS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>

          <div style={{ marginTop: 16 }}>
            <Field label="Description" required error={errors.description}>
              <Textarea
                rows={4}
                value={form.description}
                error={!!errors.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Media</p>

          {/* The stored poster at a size it can actually be read at. The
              uploader below shows a 36px chip, which is fine for picking a file
              but useless for checking that the right frame was captured. */}
          {(thumbPreview || workout?.video) && (
            <div
              style={{
                display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20,
                padding: 16, borderRadius: 10, border: "1px solid var(--glass-border)",
                background: "var(--glass-fill)",
              }}
            >
              <div
                style={{
                  width: 240, height: 135, borderRadius: 8, overflow: "hidden", flexShrink: 0,
                  background: "var(--glass-fill-bright)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                {thumbPreview ? (
                  <img
                    src={thumbPreview}
                    alt="Workout thumbnail"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <ImageOff size={22} color="var(--text-muted)" aria-label="No thumbnail" />
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                <span style={{ fontWeight: 600 }}>
                  {pendingThumb ? "New thumbnail (not saved yet)" : thumbPreview ? "Current thumbnail" : "No thumbnail"}
                </span>
                <span className="text-caption">
                  {workout?.video
                    ? "An MP4 is stored for this workout."
                    : pendingVideo
                      ? "A new MP4 will be uploaded when you save."
                      : "No video stored."}
                </span>
                {workout?.legacy && (
                  <span className="text-caption">Migrated from legacy workout #{workout.legacy.workoutId}</span>
                )}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gap: 16 }}>
            <Field
              label="Youtube Link"
              error={errors.youtubeUrl}
              helperText="Optional. A YouTube link and an uploaded video can both be set."
            >
              <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Input
                    value={form.youtubeUrl}
                    error={!!errors.youtubeUrl}
                    onChange={(e) => set("youtubeUrl", e.target.value)}
                    placeholder="https://youtu.be/..."
                  />
                </div>
                {/* Opens whatever is currently in the box, so a pasted link can
                    be checked before saving. Disabled until it parses. */}
                <Button
                  variant="secondary"
                  icon={<PlayCircle size={15} />}
                  disabled={!openableLink}
                  onClick={() => {
                    if (openableLink) window.open(openableLink, "_blank", "noopener,noreferrer");
                  }}
                >
                  Watch
                </Button>
              </div>
            </Field>

            <Field label="Video Thumbnail" helperText="JPG, JPEG or PNG only">
              <FileUploader
                accept="image/jpeg,image/jpg,image/png"
                acceptLabel="JPG, JPEG, PNG"
                files={thumbFiles}
                onAdd={(list) => {
                  const file = list[0];
                  if (!file) return;
                  setPendingThumb(file);
                  setThumbFiles([toUploadedFile(file, "pending-thumb")]);
                }}
                onRemove={() => {
                  setPendingThumb(null);
                  setThumbFiles([]);
                }}
              />
            </Field>

            <Field
              label="WorkOut Video"
              helperText={
                workout?.video
                  ? "An MP4 is already stored. Choosing a new file replaces it; leaving this alone keeps it."
                  : "MP4 only."
              }
            >
              <FileUploader
                accept="video/mp4"
                acceptLabel="MP4"
                files={videoFiles}
                onAdd={(list) => {
                  const file = list[0];
                  if (!file) return;
                  setPendingVideo(file);
                  setVideoFiles([toUploadedFile(file, "pending-video")]);
                }}
                onRemove={() => {
                  setPendingVideo(null);
                  setVideoFiles([]);
                }}
              />
            </Field>

            {workout?.video?.url && !pendingVideo && (
              <p className="text-caption" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Film size={13} /> Stored video kept unless you choose a new one.
              </p>
            )}
          </div>
        </GlassCard>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          {/* `loading` disables the button, so one click cannot create two workouts. */}
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {isEdit ? "Update WorkOut" : "Create WorkOut"}
          </Button>
        </div>
      </div>
    </>
  );
}
