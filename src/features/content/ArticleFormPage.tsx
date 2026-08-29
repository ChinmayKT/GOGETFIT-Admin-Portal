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
import { useCurrentAdmin } from "../../app/providers/AuthProvider";
import { ArticleRichTextEditor } from "./ArticleRichTextEditor";
import { getArticle, createArticle, updateArticle } from "../../mock/content/articleRepository";
import { ARTICLE_AUTHORS } from "../../mock/content/articleData";
import { nextId } from "../../mock/shared/utils";
import { formatDateTime } from "../../utils/format";
import type { ArticleStatus } from "../../types/content";
import styles from "../users/UserFormPage.module.css";

interface FormState {
  title: string;
  description: string;
  content: string;
  author: string;
  status: ArticleStatus;
  scheduledAt: string;
}

export function ArticleFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { show } = useToast();
  const currentAdmin = useCurrentAdmin();

  const [form, setForm] = useState<FormState>({
    title: "", description: "", content: "", author: currentAdmin.name, status: "Draft", scheduledAt: "",
  });
  const [media, setMedia] = useState<UploadedFile[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const authorOptions = Array.from(new Set([currentAdmin.name, ...ARTICLE_AUTHORS]));

  useEffect(() => {
    if (!id) return;
    getArticle(id).then((a) => {
      if (!a) return;
      setForm({
        title: a.title, description: a.description, content: a.content, author: a.author,
        status: a.status, scheduledAt: a.scheduledAt ? a.scheduledAt.slice(0, 16) : "",
      });
      setMedia(a.media.map((m) => ({ id: m.id, name: m.fileName, sizeLabel: "", previewUrl: m.url, progress: 100, status: "done" as const })));
      setUpdatedAt(a.updatedAt);
      setLoading(false);
    });
  }, [id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleAddMedia(files: File[]) {
    setMedia((prev) => [...prev, ...files.map((f) => toUploadedFile(f, nextId("articlemedia")))]);
  }

  function handleRemoveMedia(fileId: string) {
    setMedia((prev) => prev.filter((f) => f.id !== fileId));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) next.title = "Title is required";
    if (form.status === "Scheduled" && !form.scheduledAt) next.scheduledAt = "Pick a date and time to schedule this article";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save(statusOverride?: ArticleStatus) {
    if (!validate()) return;
    setSaving(true);
    try {
      const status = statusOverride ?? form.status;
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || form.content.slice(0, 140),
        content: form.content,
        author: form.author,
        status,
        scheduledAt: status === "Scheduled" ? new Date(form.scheduledAt).toISOString() : null,
        media: media.map((m) => ({ id: m.id, url: m.previewUrl ?? "", fileName: m.name })),
      };
      if (isEdit && id) {
        await updateArticle(id, payload);
        show("Article updated");
      } else {
        await createArticle(payload);
        show(status === "Draft" ? "Article saved as draft" : "Article created successfully");
      }
      navigate("/content/articles");
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
        title={isEdit ? "Edit Article" : "Add Article"}
        breadcrumb={[{ label: "Content", path: "/content/articles" }, { label: "Articles", path: "/content/articles" }, { label: isEdit ? "Edit" : "Add" }]}
      />

      <div className={styles.sections}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Article Details</p>
          <div className={styles.grid}>
            <Field label="Title" required error={errors.title}>
              <Input value={form.title} error={!!errors.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. 5 Warm-Up Routines to Prevent Injury" />
            </Field>
            <Field label="Author">
              <Select value={form.author} onChange={(e) => set("author", e.target.value)} options={authorOptions.map((a) => ({ label: a, value: a }))} />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => set("status", e.target.value as ArticleStatus)}
                options={[
                  { label: "Draft", value: "Draft" },
                  { label: "Published", value: "Published" },
                  { label: "Scheduled", value: "Scheduled" },
                ]}
              />
            </Field>
            {form.status === "Scheduled" && (
              <Field label="Publish At" required error={errors.scheduledAt}>
                <Input type="datetime-local" value={form.scheduledAt} error={!!errors.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} />
              </Field>
            )}
            <Field label="Updated Date" helperText="Set automatically on save">
              <Input value={updatedAt ? formatDateTime(updatedAt) : "Not saved yet"} disabled readOnly />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <Field label="Short Description" helperText="Shown in the article list; defaults to the start of the content if left blank">
              <Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="One or two sentence summary..." />
            </Field>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 20 }}>Content</p>
          <ArticleRichTextEditor value={form.content} onChange={(v) => set("content", v)} />
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 4 }}>Article Media</p>
          <p className="text-caption" style={{ marginBottom: 16 }}>Add supporting images for this article — multiple images allowed.</p>
          <FileUploader
            accept="image/jpeg,image/jpg,image/png"
            acceptLabel="JPG, JPEG, PNG"
            multiple
            maxFiles={8}
            files={media}
            onAdd={handleAddMedia}
            onRemove={handleRemoveMedia}
          />
        </GlassCard>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="secondary" loading={saving} onClick={() => save("Draft")}>Save as Draft</Button>
          <Button variant="primary" loading={saving} onClick={() => save()}>
            {isEdit ? "Update Article" : "Create Article"}
          </Button>
        </div>
      </div>
    </>
  );
}
