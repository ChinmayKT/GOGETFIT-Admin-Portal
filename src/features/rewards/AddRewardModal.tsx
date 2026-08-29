import { useState } from "react";
import { GlassModal } from "../../components/ui/GlassModal";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { Textarea } from "../../components/forms/Textarea";
import { useToast } from "../../components/feedback/ToastProvider";
import { addReward, adminStaffOptions } from "../../mock/rewards/repository";
import { MOCK_USERS } from "../../mock/users/data";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

interface FormState {
  name: string;
  ggfId: string;
  points: string;
  issuedBy: string;
  description: string;
}

function emptyForm(): FormState {
  return { name: "", ggfId: "", points: "", issuedBy: adminStaffOptions()[0] ?? "", description: "" };
}

export function AddRewardModal({ open, onClose, onAdded }: Props) {
  const { show } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleGgfIdBlur() {
    const match = MOCK_USERS.find((u) => u.ggfId.toLowerCase() === form.ggfId.trim().toLowerCase());
    if (match && !form.name.trim()) {
      set("name", `${match.firstName} ${match.lastName}`);
    }
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Rewards name is required";
    if (!form.ggfId.trim()) next.ggfId = "GGF ID is required";
    else if (!MOCK_USERS.some((u) => u.ggfId.toLowerCase() === form.ggfId.trim().toLowerCase())) {
      next.ggfId = "No user found with this GGF ID";
    }
    if (!form.points.trim() || Number.isNaN(Number(form.points)) || Number(form.points) <= 0) {
      next.points = "Enter a positive number of points";
    }
    if (!form.issuedBy) next.issuedBy = "Select who issued these points";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      await addReward({
        name: form.name.trim(),
        ggfId: form.ggfId.trim(),
        points: Number(form.points),
        issuedBy: form.issuedBy,
        description: form.description.trim(),
      });
      show(`${form.points} points issued to ${form.name.trim()}`);
      setForm(emptyForm());
      setErrors({});
      onAdded();
    } catch (e) {
      show(e instanceof Error ? e.message : "Failed to add reward", "error");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setForm(emptyForm());
    setErrors({});
    onClose();
  }

  return (
    <GlassModal
      open={open}
      onClose={handleClose}
      title="Add Rewards"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>Add Rewards</Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Rewards Name" required error={errors.name}>
          <Input value={form.name} error={!!errors.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Priya Sharma" />
        </Field>
        <Field label="GGF ID" required error={errors.ggfId} helperText="Must match an existing user's GGF ID">
          <Input value={form.ggfId} error={!!errors.ggfId} onChange={(e) => set("ggfId", e.target.value)} onBlur={handleGgfIdBlur} placeholder="e.g. GGF10042" />
        </Field>
        <Field label="Reward Points" required error={errors.points}>
          <Input type="number" min={1} value={form.points} error={!!errors.points} onChange={(e) => set("points", e.target.value)} />
        </Field>
        <Field label="Issued By" required error={errors.issuedBy}>
          <Select
            value={form.issuedBy}
            onChange={(e) => set("issuedBy", e.target.value)}
            options={adminStaffOptions().map((a) => ({ label: a, value: a }))}
          />
        </Field>
        <Field label="Description" helperText="Optional">
          <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Reason for these points..." />
        </Field>
      </div>
    </GlassModal>
  );
}
