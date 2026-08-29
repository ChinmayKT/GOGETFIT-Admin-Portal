import { useEffect, useState } from "react";
import { GlassModal } from "../../components/ui/GlassModal";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { Textarea } from "../../components/forms/Textarea";
import { useToast } from "../../components/feedback/ToastProvider";
import { createTemplate, updateTemplate } from "../../mock/notifications/repository";
import type { NotificationTemplate, NotificationTemplateCategory } from "../../types/notifications";

const CATEGORIES: NotificationTemplateCategory[] = ["Engagement", "Promotional", "Transactional", "Reminder"];

interface FormState {
  name: string;
  title: string;
  message: string;
  category: NotificationTemplateCategory;
}

function emptyForm(): FormState {
  return { name: "", title: "", message: "", category: "Engagement" };
}

interface Props {
  open: boolean;
  template: NotificationTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}

export function NotificationTemplateFormModal({ open, template, onClose, onSaved }: Props) {
  const { show } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(template);

  useEffect(() => {
    if (open) {
      setForm(template ? { name: template.name, title: template.title, message: template.message, category: template.category } : emptyForm());
      setErrors({});
    }
  }, [open, template]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Template name is required";
    if (!form.title.trim()) next.title = "Notification title is required";
    if (!form.message.trim()) next.message = "Message is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), title: form.title.trim(), message: form.message.trim(), category: form.category };
      if (isEdit && template) {
        await updateTemplate(template.id, payload);
        show("Template updated");
      } else {
        await createTemplate(payload);
        show("Template created");
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Template" : "New Template"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>{isEdit ? "Save Changes" : "Create Template"}</Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Template Name" required error={errors.name} helperText="Internal name used to identify this template in the list">
          <Input value={form.name} error={!!errors.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Streak Reminder" />
        </Field>
        <Field label="Notification Title" required error={errors.title}>
          <Input value={form.title} error={!!errors.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Don't break your streak!" />
        </Field>
        <Field label="Message" required error={errors.message}>
          <Textarea rows={3} value={form.message} error={!!errors.message} onChange={(e) => set("message", e.target.value)} placeholder="The push notification body text..." />
        </Field>
        <Field label="Category" required>
          <Select
            value={form.category}
            onChange={(e) => set("category", e.target.value as NotificationTemplateCategory)}
            options={CATEGORIES.map((c) => ({ label: c, value: c }))}
          />
        </Field>
      </div>
    </GlassModal>
  );
}
