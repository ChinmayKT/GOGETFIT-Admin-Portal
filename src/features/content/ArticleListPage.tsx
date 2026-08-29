import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { Tooltip } from "../../components/ui/Tooltip";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/feedback/ToastProvider";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { listArticles, deleteArticle } from "../../mock/content/articleRepository";
import { formatDate } from "../../utils/format";
import type { Article } from "../../types/content";

const STATUS_TONE: Record<string, StatusTone> = { Published: "success", Draft: "neutral", Scheduled: "warning" };

export function ArticleListPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 10;

  const params = useMemo(() => ({ query, status: status || undefined, page, pageSize }), [query, status, page]);
  const { rows, total, loading, error, retry } = usePagedQuery(listArticles, params);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteArticle(deleteTarget.id);
      show("Article deleted", "info");
      setDeleteTarget(null);
      retry();
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Article>[] = [
    { key: "title", header: "Title", render: (a) => <span style={{ fontWeight: 600 }}>{a.title}</span> },
    {
      key: "description",
      header: "Description",
      render: (a) => (
        <Tooltip label={a.description}>
          <span style={{ display: "inline-block", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "bottom" }}>
            {a.description}
          </span>
        </Tooltip>
      ),
    },
    { key: "author", header: "Author" },
    { key: "status", header: "Status", render: (a) => <StatusBadge label={a.status} tone={STATUS_TONE[a.status]} /> },
    { key: "updatedAt", header: "Updated Date", render: (a) => formatDate(a.updatedAt) },
  ];

  return (
    <>
      <PageHeader
        title="Articles"
        breadcrumb={[{ label: "Content" }, { label: "Articles" }]}
        description="Blog posts and guides published to the GoGetFit app."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/content/articles/new")}>
            Add Article
          </Button>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by title, description, author..." />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          placeholder="Status"
          options={[
            { label: "All statuses", value: "" },
            { label: "Draft", value: "Draft" },
            { label: "Published", value: "Published" },
            { label: "Scheduled", value: "Scheduled" },
          ]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(a) => a.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(a) => navigate(`/content/articles/${a.id}/edit`)}
        emptyTitle="No articles yet"
        emptyDescription="Publish your first article to share tips and updates with members."
        emptyAction={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/content/articles/new")}>
            Add Article
          </Button>
        }
        rowActions={(a) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/content/articles/${a.id}/edit`)} />
            <IconButton icon={<Trash2 size={15} />} label="Delete" size="sm" variant="danger" onClick={() => setDeleteTarget(a)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete article?"
        description={`"${deleteTarget?.title ?? ""}" will be permanently removed.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}
