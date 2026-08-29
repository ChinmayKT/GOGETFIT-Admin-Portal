import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Pagination } from "../../components/data-display/Pagination";
import { Tabs } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ErrorState } from "../../components/feedback/ErrorState";
import { SkeletonCard } from "../../components/feedback/Skeleton";
import { useToast } from "../../components/feedback/ToastProvider";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { listTransformations, updateTransformationStatus } from "../../mock/progress/transformationRepository";
import {
  TransformationCard,
  ACTION_CONFIG,
  TARGET_STATUS,
  actionDescription,
  type TransformationActionKey,
} from "./TransformationCard";
import { TransformationDetailDrawer } from "./TransformationDetailDrawer";
import { AddTransformationModal } from "./AddTransformationModal";
import type { Transformation } from "../../types/progress";
import styles from "./TransformationsPage.module.css";

const TABS = [
  { key: "all", label: "All" },
  { key: "Pending Review", label: "Pending Review" },
  { key: "Published", label: "Published" },
  { key: "Rejected", label: "Rejected" },
];

export function TransformationsPage() {
  const { show } = useToast();
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [refreshKey, setRefreshKey] = useState(0);

  const [viewTarget, setViewTarget] = useState<Transformation | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<{ item: Transformation; action: TransformationActionKey } | null>(null);
  const [working, setWorking] = useState(false);

  const params = useMemo(
    () => ({ query, status: tab === "all" ? undefined : tab, page, pageSize, refreshKey }),
    [query, tab, page, pageSize, refreshKey],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listTransformations, params);

  function handleTabChange(key: string) {
    setTab(key);
    setPage(1);
  }

  async function handleConfirmAction() {
    if (!actionTarget) return;
    setWorking(true);
    try {
      await updateTransformationStatus(actionTarget.item.id, TARGET_STATUS[actionTarget.action]);
      show(`"${actionTarget.item.title}" ${ACTION_CONFIG[actionTarget.action].label.toLowerCase()}d`);
      setActionTarget(null);
      retry();
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Transformations"
        breadcrumb={[{ label: "Progress" }, { label: "Transformations" }]}
        description="Review and publish before/after transformation submissions from users."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setAddOpen(true)}>
            Add Transformation
          </Button>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by title, user, or GGF ID..." />
      </FilterBar>

      <div style={{ marginBottom: 20 }}>
        <Tabs tabs={TABS} active={tab} onChange={handleTabChange} />
      </div>

      {loading && (
        <div className={styles.cardGrid}>
          {Array.from({ length: 8 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <GlassCard>
          <ErrorState onRetry={retry} />
        </GlassCard>
      )}

      {!loading && !error && rows.length === 0 && (
        <GlassCard>
          <EmptyState
            title="No transformations found"
            description="Transformation submissions matching this view will show up here."
          />
        </GlassCard>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className={styles.cardGrid}>
          {rows.map((t) => (
            <TransformationCard
              key={t.id}
              transformation={t}
              onView={setViewTarget}
              onAction={(item, action) => setActionTarget({ item, action })}
            />
          ))}
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <TransformationDetailDrawer target={viewTarget} onClose={() => setViewTarget(null)} />

      <AddTransformationModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={() => {
          setAddOpen(false);
          setRefreshKey((k) => k + 1);
        }}
      />

      <ConfirmDialog
        open={!!actionTarget}
        title={actionTarget ? `${ACTION_CONFIG[actionTarget.action].label}?` : ""}
        description={actionTarget ? actionDescription(actionTarget.item, actionTarget.action) : ""}
        confirmLabel={actionTarget ? ACTION_CONFIG[actionTarget.action].label : "Confirm"}
        tone={actionTarget ? ACTION_CONFIG[actionTarget.action].tone : "primary"}
        onConfirm={handleConfirmAction}
        onCancel={() => setActionTarget(null)}
        loading={working}
      />
    </>
  );
}
