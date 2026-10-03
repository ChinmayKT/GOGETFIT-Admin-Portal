import { useMemo, useState } from "react";
import { formatDate } from "../../utils/format";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { IconButton } from "../../components/ui/IconButton";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { Avatar } from "../../components/ui/Avatar";
import { RoleBadges } from "../../components/ui/RoleBadges";
import { listAdminUsers } from "../../api/adminUsers";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import type { AdminUser, AccountStatus } from "../../types/admin";

const PAGE_SIZE = 25;

const STATUS_TONES: Record<AccountStatus, StatusTone> = {
  active: "success",
  inactive: "neutral",
  blocked: "error",
};


export function AdminUserListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  // Role is pinned to "admin" server-side, so only accounts holding the admin
  // role ever reach this table.
  const params = useMemo(
    () => ({
      search: query || undefined,
      role: "admin" as const,
      status: status || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [query, status, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listAdminUsers, params);

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: "Admin",
      render: (a) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={a.profile.name ?? a.profile.email ?? "?"} size="sm" />
          <div>
            <div style={{ fontWeight: 600 }}>{a.profile.name ?? "—"}</div>
            <div className="text-caption">{a.phone.normalized ?? "—"}</div>
          </div>
        </div>
      ),
    },
    { key: "email", header: "Email", render: (a) => a.profile.email ?? "—" },
    { key: "roles", header: "Roles", render: (a) => <RoleBadges roles={a.roles} /> },
    {
      key: "status",
      header: "Status",
      render: (a) =>
        a.status ? (
          <StatusBadge label={a.status[0].toUpperCase() + a.status.slice(1)} tone={STATUS_TONES[a.status]} />
        ) : (
          <span className="text-caption">—</span>
        ),
    },
    { key: "createdAt", header: "Created", render: (a) => formatDate(a.createdAt) },
  ];

  return (
    <>
      <PageHeader
        title="Admin Users"
        breadcrumb={[{ label: "System" }, { label: "Admin Users" }]}
        description="Every account holding the admin role, and so with access to this portal."
      />

      <FilterBar>
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Search by name, email or phone..."
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          placeholder="Status"
          options={[
            { label: "All statuses", value: "" },
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
            { label: "Blocked", value: "blocked" },
          ]}
        />
      </FilterBar>

      <DataTable
          rowOffset={(page - 1) * PAGE_SIZE}
        columns={columns}
        rows={rows}
        getRowId={(a) => a.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(a) => navigate(`/users/${a.id}`)}
        emptyTitle="No admin users found"
        emptyDescription="Try adjusting your search or filters."
        rowActions={(a) => (
          <IconButton icon={<Eye size={15} />} label="View" size="sm" onClick={() => navigate(`/users/${a.id}`)} />
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
