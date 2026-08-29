import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download, Eye, Pencil } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/IconButton";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { Avatar } from "../../components/ui/Avatar";
import { listUsers } from "../../mock/users/repository";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { useToast } from "../../components/feedback/ToastProvider";
import type { AppUser } from "../../types/user";
import { GOALS } from "../../mock/shared/reference";

const STATUS_TONE: Record<string, StatusTone> = { Active: "success", Inactive: "neutral", Pending: "warning" };

export function UserListPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [goal, setGoal] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const params = useMemo(
    () => ({ query, status: status || undefined, goal: goal || undefined, page, pageSize }),
    [query, status, goal, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listUsers, params);

  const columns: Column<AppUser>[] = [
    {
      key: "name",
      header: "User",
      render: (u) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" />
          <div>
            <div style={{ fontWeight: 600 }}>
              {u.firstName} {u.lastName}
            </div>
            <div className="text-caption">{u.ggfId}</div>
          </div>
        </div>
      ),
    },
    { key: "gender", header: "Gender" },
    { key: "age", header: "Age", render: (u) => String(new Date().getFullYear() - new Date(u.dob).getFullYear()) },
    { key: "phone", header: "Phone" },
    { key: "email", header: "Email" },
    { key: "city", header: "City / State", render: (u) => `${u.city}, ${u.state}` },
    { key: "goal", header: "Goal" },
    { key: "coachName", header: "Coach", render: (u) => u.coachName ?? "— Unassigned" },
    {
      key: "status",
      header: "Status",
      render: (u) => <StatusBadge label={u.status} tone={STATUS_TONE[u.status]} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        breadcrumb={[{ label: "People" }, { label: "Users" }]}
        description="All registered app users and their fitness profiles."
        actions={
          <>
            <Button variant="secondary" icon={<Download size={15} />} onClick={() => show("Export started — you'll be notified when it's ready", "info")}>
              Export
            </Button>
            <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/users/new")}>
              Add User
            </Button>
          </>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by name, email, phone, GGF ID..." />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          placeholder="Status"
          options={[
            { label: "All statuses", value: "" },
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
            { label: "Pending", value: "Pending" },
          ]}
        />
        <Select
          value={goal}
          onChange={(e) => { setGoal(e.target.value); setPage(1); }}
          placeholder="Goal"
          options={[{ label: "All goals", value: "" }, ...GOALS.map((g) => ({ label: g, value: g }))]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(u) => u.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(u) => navigate(`/users/${u.id}`)}
        emptyTitle="No users found"
        emptyDescription="Try adjusting your search or filters."
        rowActions={(u) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Eye size={15} />} label="View" size="sm" onClick={() => navigate(`/users/${u.id}`)} />
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/users/${u.id}/edit`)} />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
