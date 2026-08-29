import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { listFoodLog } from "../../mock/nutrition/logRepository";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { MOCK_USERS } from "../../mock/users/data";
import { formatDate } from "../../utils/format";
import type { FoodLogEntry } from "../../types/nutrition";

const USER_OPTIONS = MOCK_USERS.slice(0, 60).map((u) => ({ label: `${u.firstName} ${u.lastName} (${u.ggfId})`, value: u.id }));

export function FoodLogPage() {
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const params = useMemo(
    () => ({ userId: userId || undefined, from: from || undefined, to: to || undefined, page, pageSize }),
    [userId, from, to, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listFoodLog, params);

  const columns: Column<FoodLogEntry>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "userName", header: "User" },
    { key: "meal", header: "Meal" },
    { key: "foodItem", header: "Food Item" },
    { key: "qty", header: "Qty" },
    { key: "calories", header: "Calories", render: (r) => r.calories.toFixed(0) },
  ];

  return (
    <>
      <PageHeader
        title="Food Log"
        breadcrumb={[{ label: "Nutrition" }, { label: "Food Log" }]}
        description="What users are logging against their diet plans, by date and user."
      />

      <div
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", marginBottom: 16,
          borderRadius: "var(--radius-md)", background: "var(--glass-fill)", border: "1px solid var(--glass-border)",
        }}
      >
        <Info size={14} color="var(--text-muted)" />
        <span className="text-caption">
          Preview data — this table is wired to mock entries while the real food logging pipeline is being built. It does not reflect authentic user history yet.
        </span>
      </div>

      <FilterBar>
        <div style={{ width: 160 }}>
          <Field label="From">
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          </Field>
        </div>
        <div style={{ width: 160 }}>
          <Field label="To">
            <Input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          </Field>
        </div>
        <div style={{ width: 260 }}>
          <Field label="User">
            <Select
              value={userId}
              onChange={(e) => { setUserId(e.target.value); setPage(1); }}
              placeholder="All users"
              options={[{ label: "All users", value: "" }, ...USER_OPTIONS]}
            />
          </Field>
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        loading={loading}
        error={error}
        onRetry={retry}
        emptyTitle="No log entries in this range"
        emptyDescription="Try widening the date range or clearing the user filter."
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
