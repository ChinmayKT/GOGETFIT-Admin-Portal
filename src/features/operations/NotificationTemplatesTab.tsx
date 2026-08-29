import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Tooltip } from "../../components/ui/Tooltip";
import { useToast } from "../../components/feedback/ToastProvider";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { listTemplates, deleteTemplate } from "../../mock/notifications/repository";
import { NotificationTemplateFormModal } from "./NotificationTemplateFormModal";
import { formatDate } from "../../utils/format";
import type { NotificationTemplate, NotificationTemplateCategory } from "../../types/notifications";

const CATEGORIES: NotificationTemplateCategory[] = ["Engagement", "Promotional", "Transactional", "Reminder"];

function truncate(text: string, max = 70) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export function NotificationTemplatesTab() {
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<NotificationTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NotificationTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const params = useMemo(() => ({ query, category: category || undefined, page, pageSize }), [query, category, page]);
  const { rows, total, loading, error, retry } = usePagedQuery(listTemplates, params);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTemplate(deleteTarget.id);
      show("Template deleted", "info");
      setDeleteTarget(null);
      retry();
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<NotificationTemplate>[] = [
    { key: "name", header: "Name" },
    { key: "title", header: "Title" },
    {
      key: "message",
      header: "Message",
      render: (t) => (
        <Tooltip label={t.message}>
          <span style={{ display: "inline-block", maxWidth: 320 }}>{truncate(t.message)}</span>
        </Tooltip>
      ),
    },
    { key: "category", header: "Category" },
    { key: "lastUsedAt", header: "Last Used", render: (t) => (t.lastUsedAt ? formatDate(t.lastUsedAt) : "Never") },
  ];

  return (
    <>
      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by name, title or message..." />
        <Select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          placeholder="Category"
          options={[{ label: "All categories", value: "" }, ...CATEGORIES.map((c) => ({ label: c, value: c }))]}
        />
        <div style={{ marginLeft: "auto" }}>
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => { setEditTarget(null); setFormOpen(true); }}>
            New Template
          </Button>
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(t) => t.id}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyTitle="No templates yet"
        emptyDescription="Reusable message templates speed up building new campaigns."
        emptyAction={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => { setEditTarget(null); setFormOpen(true); }}>
            New Template
          </Button>
        }
        rowActions={(t) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => { setEditTarget(t); setFormOpen(true); }} />
            <IconButton icon={<Trash2 size={15} />} label="Delete" size="sm" variant="danger" onClick={() => setDeleteTarget(t)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <NotificationTemplateFormModal
        open={formOpen}
        template={editTarget}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); retry(); }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete template?"
        description={`"${deleteTarget?.name ?? ""}" will be permanently removed and can no longer be used when composing new campaigns.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}
