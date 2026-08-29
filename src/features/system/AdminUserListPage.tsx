import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, UserX } from "lucide-react";
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
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/feedback/ToastProvider";
import { listAdminUsers, deactivateAdminUser } from "../../mock/system/adminUserRepository";
import { ROLES, getRole } from "../../mock/system/roles";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { formatDate, timeAgo } from "../../utils/format";
import type { AdminUser } from "../../types/permissions";

const STATUS_TONE: Record<string, StatusTone> = { Active: "success", Inactive: "neutral" };

export function AdminUserListPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const pageSize = 10;

  const params = useMemo(
    () => ({ query, roleId: roleId || undefined, status: status || undefined, page, pageSize }),
    [query, roleId, status, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listAdminUsers, params);

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await deactivateAdminUser(deactivateTarget.id);
      show("Admin user deactivated", "info");
      setDeactivateTarget(null);
      retry();
    } finally {
      setDeactivating(false);
    }
  }

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: "Admin",
      render: (a) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={a.name} size="sm" />
          <div style={{ fontWeight: 600 }}>{a.name}</div>
        </div>
      ),
    },
    { key: "email", header: "Email" },
    { key: "role", header: "Role", render: (a) => getRole(a.roleId).name },
    { key: "status", header: "Status", render: (a) => <StatusBadge label={a.status} tone={STATUS_TONE[a.status]} /> },
    { key: "lastActive", header: "Last Active", render: (a) => timeAgo(a.lastActive) },
    { key: "createdAt", header: "Created", render: (a) => formatDate(a.createdAt) },
  ];

  return (
    <>
      <PageHeader
        title="Admin Users"
        breadcrumb={[{ label: "System" }, { label: "Admin Users" }]}
        description="Everyone with access to this admin portal, and the role each one holds."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/system/admin-users/new")}>
            Add Admin
          </Button>
        }
      />

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by name or email..." />
        <Select
          value={roleId}
          onChange={(e) => { setRoleId(e.target.value); setPage(1); }}
          placeholder="Role"
          options={[{ label: "All roles", value: "" }, ...ROLES.map((r) => ({ label: r.name, value: r.id }))]}
        />
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          placeholder="Status"
          options={[
            { label: "All statuses", value: "" },
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
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
        onRowClick={(a) => navigate(`/system/admin-users/${a.id}/edit`)}
        emptyTitle="No admin users yet"
        emptyDescription="Add your first admin to start granting portal access."
        emptyAction={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/system/admin-users/new")}>
            Add Admin
          </Button>
        }
        rowActions={(a) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Pencil size={15} />} label="Edit" size="sm" onClick={() => navigate(`/system/admin-users/${a.id}/edit`)} />
            <IconButton
              icon={<UserX size={15} />}
              label="Deactivate"
              size="sm"
              variant="danger"
              disabled={a.status === "Inactive"}
              onClick={() => setDeactivateTarget(a)}
            />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate admin user?"
        description={`${deactivateTarget?.name ?? ""} will lose access to the admin portal. Their account is kept, not deleted, and can be reactivated later.`}
        confirmLabel="Deactivate"
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
        loading={deactivating}
      />
    </>
  );
}
