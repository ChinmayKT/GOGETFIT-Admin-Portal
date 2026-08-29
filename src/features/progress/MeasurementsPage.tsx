import { useMemo, useState } from "react";
import { LineChart as LineChartIcon } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { IconButton } from "../../components/ui/IconButton";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { listMeasurementUsers } from "../../mock/progress/measurementRepository";
import { formatDate } from "../../utils/format";
import { MeasurementTrendDrawer } from "./MeasurementTrendDrawer";
import type { UserMeasurementHistory } from "../../types/progress";

export function MeasurementsPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [trendTarget, setTrendTarget] = useState<UserMeasurementHistory | null>(null);

  const params = useMemo(() => ({ query, page, pageSize }), [query, page, pageSize]);
  const { rows, total, loading, error, retry } = usePagedQuery(listMeasurementUsers, params);

  const columns: Column<UserMeasurementHistory>[] = [
    { key: "userName", header: "Name" },
    { key: "ggfId", header: "GGF ID" },
    { key: "weight", header: "Latest Weight", render: (u) => `${u.history[u.history.length - 1]?.weightKg ?? "—"} kg` },
    { key: "bodyFat", header: "Latest Body Fat", render: (u) => `${u.history[u.history.length - 1]?.bodyFatPct ?? "—"}%` },
    { key: "lastRecorded", header: "Last Recorded", render: (u) => formatDate(u.history[u.history.length - 1]?.date ?? "") },
  ];

  return (
    <>
      <PageHeader
        title="Measurements"
        breadcrumb={[{ label: "Progress" }, { label: "Measurements" }]}
        description="Body-measurement history tracked over time for a sample of users."
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by name or GGF ID..." />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(u) => u.userId}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyTitle="No measurement history"
        emptyDescription="Users with tracked body measurements will show up here."
        rowActions={(u) => (
          <IconButton icon={<LineChartIcon size={15} />} label="View trend" size="sm" onClick={() => setTrendTarget(u)} />
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <MeasurementTrendDrawer target={trendTarget} onClose={() => setTrendTarget(null)} />
    </>
  );
}
