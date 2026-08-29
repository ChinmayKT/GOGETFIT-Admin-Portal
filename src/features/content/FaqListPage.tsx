import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Tooltip } from "../../components/ui/Tooltip";
import { useToast } from "../../components/feedback/ToastProvider";
import { listFaqs, deleteFaq, updateFaq, moveFaq } from "../../mock/faqs/repository";
import { FAQ_CATEGORIES } from "../../mock/faqs/data";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import type { Faq } from "../../types/faq";

const STATUS_TONE: Record<string, StatusTone> = { Published: "success", Archived: "neutral" };

function truncate(text: string, max = 70) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export function FaqListPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const pageSize = 10;

  const params = useMemo(
    () => ({ query, category: category || undefined, status: status || undefined, page, pageSize }),
    [query, category, status, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listFaqs, params);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFaq(deleteTarget.id);
      show("FAQ deleted", "info");
      setDeleteTarget(null);
      retry();
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleStatus(faq: Faq) {
    setWorkingId(faq.id);
    try {
      const nextStatus = faq.status === "Published" ? "Archived" : "Published";
      await updateFaq(faq.id, { status: nextStatus });
      show(nextStatus === "Published" ? "FAQ published" : "FAQ archived", "info");
      retry();
    } finally {
      setWorkingId(null);
    }
  }

  async function handleMove(faq: Faq, direction: "up" | "down") {
    setWorkingId(faq.id);
    try {
      const moved = await moveFaq(faq.id, direction);
      if (moved) retry();
    } finally {
      setWorkingId(null);
    }
  }

  const columns: Column<Faq>[] = [
    {
      key: "question",
      header: "Question",
      render: (f) => (
        <Tooltip label={f.question}>
          <span style={{ display: "inline-block", maxWidth: 260 }}>{truncate(f.question, 70)}</span>
        </Tooltip>
      ),
    },
    {
      key: "answer",
      header: "Answer",
      render: (f) => (
        <Tooltip label={f.answer}>
          <span style={{ display: "inline-block", maxWidth: 320 }}>{truncate(f.answer, 90)}</span>
        </Tooltip>
      ),
    },
    { key: "category", header: "Category" },
    { key: "status", header: "Status", render: (f) => <StatusBadge label={f.status} tone={STATUS_TONE[f.status]} /> },
    { key: "order", header: "Order", align: "right" },
  ];

  return (
    <>
      <PageHeader
        title="FAQs"
        breadcrumb={[{ label: "Content" }, { label: "FAQs" }]}
        description="Frequently asked questions shown to users in the app help center."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/content/faqs/new")}>
            Add FAQ
          </Button>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by question or answer..." />
        <Select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          placeholder="Category"
          options={[{ label: "All categories", value: "" }, ...FAQ_CATEGORIES.map((c) => ({ label: c, value: c }))]}
        />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          placeholder="Status"
          options={[
            { label: "All statuses", value: "" },
            { label: "Published", value: "Published" },
            { label: "Archived", value: "Archived" },
          ]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(f) => f.id}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyTitle="No FAQs yet"
        emptyDescription="Add your first FAQ to populate the in-app help center."
        emptyAction={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/content/faqs/new")}>
            Add FAQ
          </Button>
        }
        rowActions={(f) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton
              icon={<ArrowUp size={15} />}
              label="Move up"
              size="sm"
              disabled={workingId === f.id}
              onClick={() => handleMove(f, "up")}
            />
            <IconButton
              icon={<ArrowDown size={15} />}
              label="Move down"
              size="sm"
              disabled={workingId === f.id}
              onClick={() => handleMove(f, "down")}
            />
            <IconButton
              icon={f.status === "Published" ? <EyeOff size={15} /> : <Eye size={15} />}
              label={f.status === "Published" ? "Archive" : "Publish"}
              size="sm"
              disabled={workingId === f.id}
              onClick={() => handleToggleStatus(f)}
            />
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/content/faqs/${f.id}/edit`)} />
            <IconButton icon={<Trash2 size={15} />} label="Delete" size="sm" variant="danger" onClick={() => setDeleteTarget(f)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete FAQ?"
        description={`"${deleteTarget ? truncate(deleteTarget.question, 80) : ""}" will be permanently removed from the help center.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}
