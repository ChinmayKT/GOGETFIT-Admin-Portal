import { useState } from "react";
import { GlassModal } from "../../components/ui/GlassModal";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Textarea } from "../../components/forms/Textarea";
import { FileUploader, toUploadedFile, type UploadedFile } from "../../components/media/FileUploader";
import { useToast } from "../../components/feedback/ToastProvider";
import { createTransformation } from "../../mock/progress/transformationRepository";
import { MOCK_USERS } from "../../mock/users/data";
import { nextId } from "../../mock/shared/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export function AddTransformationModal({ open, onClose, onAdded }: Props) {
  const { show } = useToast();
  const [ggfId, setGgfId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [beforePhoto, setBeforePhoto] = useState<UploadedFile[]>([]);
  const [afterPhoto, setAfterPhoto] = useState<UploadedFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function reset() {
    setGgfId("");
    setTitle("");
    setDescription("");
    setBeforePhoto([]);
    setAfterPhoto([]);
    setErrors({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required";
    if (!ggfId.trim()) next.ggfId = "GGF ID is required";
    else if (!MOCK_USERS.some((u) => u.ggfId.toLowerCase() === ggfId.trim().toLowerCase())) {
      next.ggfId = "No user found with this GGF ID";
    }
    if (beforePhoto.length === 0) next.before = "Before photo is required";
    if (afterPhoto.length === 0) next.after = "After photo is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      await createTransformation({
        ggfId: ggfId.trim(),
        title: title.trim(),
        description: description.trim(),
        beforeImageUrl: beforePhoto[0].previewUrl ?? "",
        afterImageUrl: afterPhoto[0].previewUrl ?? "",
      });
      show("Transformation submitted for review");
      reset();
      onAdded();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to add transformation", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassModal
      open={open}
      onClose={handleClose}
      title="Add Transformation"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>Submit</Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="GGF ID" required error={errors.ggfId} helperText="Must match an existing user's GGF ID">
          <Input value={ggfId} error={!!errors.ggfId} onChange={(e) => setGgfId(e.target.value)} placeholder="e.g. GGF10042" />
        </Field>
        <Field label="Title" required error={errors.title}>
          <Input value={title} error={!!errors.title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 12-Week Fat Loss Journey" />
        </Field>
        <Field label="Description">
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Before Photo" required error={errors.before}>
            <FileUploader
              accept="image/jpeg,image/jpg,image/png"
              acceptLabel="JPG, JPEG, PNG"
              maxFiles={1}
              files={beforePhoto}
              onAdd={(list) => setBeforePhoto([toUploadedFile(list[0], nextId("xform-before"))])}
              onRemove={() => setBeforePhoto([])}
            />
          </Field>
          <Field label="After Photo" required error={errors.after}>
            <FileUploader
              accept="image/jpeg,image/jpg,image/png"
              acceptLabel="JPG, JPEG, PNG"
              maxFiles={1}
              files={afterPhoto}
              onAdd={(list) => setAfterPhoto([toUploadedFile(list[0], nextId("xform-after"))])}
              onRemove={() => setAfterPhoto([])}
            />
          </Field>
        </div>
      </div>
    </GlassModal>
  );
}
