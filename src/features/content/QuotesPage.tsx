import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Field } from "../../components/forms/Field";
import { Textarea } from "../../components/forms/Textarea";
import { useToast } from "../../components/feedback/ToastProvider";
import { useCurrentAdmin } from "../../app/providers/AuthProvider";
import { listQuotes, createQuote, updateQuote, deleteQuote } from "../../mock/quotes/repository";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { formatDateTime } from "../../utils/format";
import type { Quote } from "../../types/quote";

export function QuotesPage() {
  const { show } = useToast();
  const admin = useCurrentAdmin();

  const params = useMemo(() => ({}), []);
  const { rows, loading, error, retry } = usePagedQuery(listQuotes, params);

  const [newDraft, setNewDraft] = useState<Quote | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [validationError, setValidationError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Quote | null>(null);
  const [deleting, setDeleting] = useState(false);

  const displayRows = newDraft ? [newDraft, ...rows] : rows;

  function handleAddClick() {
    if (editingId) return;
    const draft: Quote = {
      id: `new_${Date.now()}`,
      text: "",
      updatedBy: admin.name,
      updatedAt: new Date().toISOString(),
    };
    setNewDraft(draft);
    setEditingId(draft.id);
    setDraftText("");
    setValidationError(false);
  }

  function startEdit(q: Quote) {
    if (editingId) return;
    setEditingId(q.id);
    setDraftText(q.text);
    setValidationError(false);
  }

  function cancelEdit() {
    if (newDraft && editingId === newDraft.id) setNewDraft(null);
    setEditingId(null);
    setDraftText("");
    setValidationError(false);
  }

  async function saveEdit(q: Quote) {
    if (!draftText.trim()) {
      setValidationError(true);
      return;
    }
    setSaving(true);
    try {
      if (newDraft && q.id === newDraft.id) {
        await createQuote({ text: draftText.trim(), updatedBy: admin.name });
        show("Quote added");
        setNewDraft(null);
      } else {
        await updateQuote(q.id, { text: draftText.trim(), updatedBy: admin.name });
        show("Quote updated");
      }
      setEditingId(null);
      setValidationError(false);
      retry();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteQuote(deleteTarget.id);
      show("Quote deleted", "info");
      setDeleteTarget(null);
      retry();
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Quote>[] = [
    {
      key: "text",
      header: "Quote",
      width: "50%",
      render: (q) =>
        editingId === q.id ? (
          <Field error={validationError ? "Quote text is required" : undefined}>
            <Textarea
              rows={2}
              autoFocus
              value={draftText}
              error={validationError}
              onChange={(e) => {
                setDraftText(e.target.value);
                setValidationError(false);
              }}
              style={{ width: "100%" }}
            />
          </Field>
        ) : (
          <span>{q.text}</span>
        ),
    },
    { key: "updatedBy", header: "Updated By", width: "180px" },
    { key: "updatedAt", header: "Updated On", width: "200px", render: (q) => formatDateTime(q.updatedAt) },
  ];

  return (
    <>
      <PageHeader
        title="Quotes"
        breadcrumb={[{ label: "Content" }, { label: "Quotes" }]}
        description="Motivational quotes shown to users across the app. Edit any row inline."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={handleAddClick} disabled={!!editingId}>
            Add Quote
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={displayRows}
        getRowId={(q) => q.id}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyTitle="No quotes yet"
        emptyDescription="Add your first quote to display it in the app."
        emptyAction={
          <Button variant="primary" icon={<Plus size={15} />} onClick={handleAddClick}>
            Add Quote
          </Button>
        }
        rowActions={(q) =>
          editingId === q.id ? (
            <div style={{ display: "flex", gap: 4 }}>
              <IconButton icon={<Check size={15} />} label="Save" size="sm" disabled={saving} onClick={() => saveEdit(q)} />
              <IconButton icon={<X size={15} />} label="Cancel" size="sm" disabled={saving} onClick={cancelEdit} />
            </div>
          ) : (
            <div style={{ display: "flex", gap: 4 }}>
              <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" disabled={!!editingId} onClick={() => startEdit(q)} />
              <IconButton
                icon={<Trash2 size={15} />}
                label="Delete"
                size="sm"
                variant="danger"
                disabled={!!editingId}
                onClick={() => setDeleteTarget(q)}
              />
            </div>
          )
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete quote?"
        description="This quote will be permanently removed and will no longer be shown in the app."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}
