import { useEffect, useMemo, useState } from "react";
import { GlassModal } from "../../components/ui/GlassModal";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { Textarea } from "../../components/forms/Textarea";
import { Toggle } from "../../components/forms/Toggle";
import { FileUploader, toUploadedFile, type UploadedFile } from "../../components/media/FileUploader";
import { useToast } from "../../components/feedback/ToastProvider";
import {
  audienceLabelFor,
  challengeAudienceOptions,
  coachAudienceOptions,
  createCampaign,
  estimateAudienceSize,
  type AudienceSelection,
} from "../../mock/notifications/repository";
import type { NotificationAudienceType, NotificationCampaign } from "../../types/notifications";

const MESSAGE_WARN_LENGTH = 178;

const AUDIENCE_OPTIONS: { label: string; value: NotificationAudienceType }[] = [
  { label: "All Users", value: "All Users" },
  { label: "Active Users", value: "Active Users" },
  { label: "Inactive Users", value: "Inactive Users" },
  { label: "Clients of Coach", value: "Clients of Coach" },
  { label: "Challenge Participants", value: "Challenge Participants" },
  { label: "Specific Users", value: "Specific Users" },
];

interface FormState {
  title: string;
  message: string;
  deepLink: string;
  audienceType: NotificationAudienceType | "";
  coachId: string;
  challengeId: string;
  specificIds: string;
  sendNow: boolean;
  scheduledAt: string;
}

function emptyForm(): FormState {
  return {
    title: "",
    message: "",
    deepLink: "",
    audienceType: "",
    coachId: "",
    challengeId: "",
    specificIds: "",
    sendNow: true,
    scheduledAt: "",
  };
}

function minScheduleValue(): string {
  const d = new Date(Date.now() + 5 * 60 * 1000);
  d.setSeconds(0, 0);
  const tzOffsetMs = d.getTimezoneOffset() * 60 * 1000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (campaign: NotificationCampaign) => void;
}

export function NotificationComposerModal({ open, onClose, onCreated }: Props) {
  const { show } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [image, setImage] = useState<UploadedFile | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [saving, setSaving] = useState(false);

  const coachOptions = useMemo(() => coachAudienceOptions(), []);
  const challengeOptions = useMemo(() => challengeAudienceOptions(), []);

  useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setImage(null);
      setErrors({});
    }
  }, [open]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const selection: AudienceSelection = {
    coachId: form.coachId || undefined,
    challengeId: form.challengeId || undefined,
    specificIds: form.specificIds || undefined,
  };

  const audienceSize = useMemo(
    () => estimateAudienceSize(form.audienceType, selection),
    [form.audienceType, form.coachId, form.challengeId, form.specificIds],
  );

  function handleAddImage(files: File[]) {
    const file = files[0];
    if (!file) return;
    setImage(toUploadedFile(file, "campaignimg"));
  }

  function validate(): boolean {
    const next: Partial<Record<string, string>> = {};
    if (!form.title.trim()) next.title = "Title is required";
    if (!form.message.trim()) next.message = "Message is required";
    if (!form.audienceType) next.audienceType = "Select an audience";
    if (form.audienceType === "Clients of Coach" && !form.coachId) next.coachId = "Select a coach";
    if (form.audienceType === "Challenge Participants" && !form.challengeId) next.challengeId = "Select a challenge";
    if (form.audienceType === "Specific Users" && !form.specificIds.trim()) next.specificIds = "Enter at least one GGF ID";
    if (!form.sendNow && !form.scheduledAt) next.scheduledAt = "Choose a date and time";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const audienceLabel = audienceLabelFor(form.audienceType, selection);
      const campaign = await createCampaign({
        title: form.title.trim(),
        message: form.message.trim(),
        imageUrl: image?.previewUrl ?? null,
        deepLink: form.deepLink.trim() || null,
        audienceType: form.audienceType as NotificationAudienceType,
        audienceLabel,
        audienceSize,
        sendNow: form.sendNow,
        scheduledAt: form.sendNow ? null : new Date(form.scheduledAt).toISOString(),
      });
      show(
        form.sendNow ? `"${campaign.title}" sent to ${audienceSize.toLocaleString("en-IN")} users` : `"${campaign.title}" scheduled successfully`,
        "success",
      );
      onCreated(campaign);
    } finally {
      setSaving(false);
    }
  }

  const messageLength = form.message.length;
  const overWarnLength = messageLength > MESSAGE_WARN_LENGTH;

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title="New Campaign"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {form.sendNow ? "Send Now" : "Schedule Campaign"}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Title" required error={errors.title}>
          <Input
            value={form.title}
            error={!!errors.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Don't break your streak!"
            maxLength={65}
          />
        </Field>

        <Field
          label="Message"
          required
          error={errors.message}
          helperText={
            overWarnLength
              ? `${messageLength} characters — messages over ${MESSAGE_WARN_LENGTH} characters may be truncated on some devices.`
              : `${messageLength} / ${MESSAGE_WARN_LENGTH} characters`
          }
        >
          <Textarea
            rows={3}
            value={form.message}
            error={!!errors.message || overWarnLength}
            onChange={(e) => set("message", e.target.value)}
            placeholder="The push notification body text..."
          />
        </Field>

        <Field label="Image (optional)" helperText="Shown as a rich media preview in supported notification centers">
          <FileUploader
            accept="image/*"
            acceptLabel="PNG or JPG"
            maxFiles={1}
            files={image ? [image] : []}
            onAdd={handleAddImage}
            onRemove={() => setImage(null)}
          />
        </Field>

        <Field label="Deep Link (optional)" helperText="In-app destination opened when the notification is tapped">
          <Input
            value={form.deepLink}
            onChange={(e) => set("deepLink", e.target.value)}
            placeholder="e.g. gogetfit://challenges/12"
          />
        </Field>

        <Field label="Audience" required error={errors.audienceType}>
          <Select
            value={form.audienceType}
            error={!!errors.audienceType}
            onChange={(e) => {
              const value = e.target.value as NotificationAudienceType;
              setForm((f) => ({ ...f, audienceType: value, coachId: "", challengeId: "", specificIds: "" }));
            }}
            placeholder="Select an audience"
            options={AUDIENCE_OPTIONS}
          />
        </Field>

        {form.audienceType === "Clients of Coach" && (
          <Field label="Coach" required error={errors.coachId}>
            <Select
              value={form.coachId}
              error={!!errors.coachId}
              onChange={(e) => set("coachId", e.target.value)}
              placeholder="Select a coach"
              options={coachOptions.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Field>
        )}

        {form.audienceType === "Challenge Participants" && (
          <Field label="Challenge" required error={errors.challengeId}>
            <Select
              value={form.challengeId}
              error={!!errors.challengeId}
              onChange={(e) => set("challengeId", e.target.value)}
              placeholder="Select a challenge"
              options={challengeOptions.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Field>
        )}

        {form.audienceType === "Specific Users" && (
          <Field label="GGF IDs" required error={errors.specificIds} helperText="Comma-separated list, e.g. GGF1001, GGF1002">
            <Input
              value={form.specificIds}
              error={!!errors.specificIds}
              onChange={(e) => set("specificIds", e.target.value)}
              placeholder="GGF1001, GGF1002, GGF1003"
            />
          </Field>
        )}

        {form.audienceType && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--color-surface-alt, rgba(127,127,127,0.08))",
              fontSize: 13,
            }}
          >
            Estimated audience: <strong>{audienceSize.toLocaleString("en-IN")}</strong> user{audienceSize === 1 ? "" : "s"}
          </div>
        )}

        <Field label="Delivery">
          <Toggle
            checked={!form.sendNow}
            onChange={(checked) => set("sendNow", !checked)}
            label={form.sendNow ? "Send immediately" : "Schedule for later"}
          />
        </Field>

        {!form.sendNow && (
          <Field label="Scheduled Date & Time" required error={errors.scheduledAt}>
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              error={!!errors.scheduledAt}
              min={minScheduleValue()}
              onChange={(e) => set("scheduledAt", e.target.value)}
            />
          </Field>
        )}
      </div>
    </GlassModal>
  );
}
