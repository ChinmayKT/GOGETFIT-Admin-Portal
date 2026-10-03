import { useMemo, useState } from "react";
import { formatDate } from "../../utils/format";
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
import { Avatar } from "../../components/ui/Avatar";
import { resolveMediaUrl } from "../../api/media";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { RoleBadges } from "../../components/ui/RoleBadges";
import { listAdminUsers } from "../../api/adminUsers";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { useToast } from "../../components/feedback/ToastProvider";
import type { AdminUser, AccountStatus, Role } from "../../types/admin";

const PAGE_SIZE = 25;

const STATUS_TONES: Record<AccountStatus, StatusTone> = {
  active: "success",
  inactive: "neutral",
  blocked: "error",
};


export function UserListPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      search: query || undefined,
      // The <Select> yields a plain string; narrow it to Role for the client.
      role: (role || undefined) as Role | undefined,
      status: status || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [query, role, status, page],
  );

  // Server-side pagination, search and filtering - the browser never receives
  // more than one page.
  const { rows, total, loading, error, retry } = usePagedQuery(listAdminUsers, params);

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: "User",
      render: (u) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            name={u.profile.name ?? u.profile.email ?? "?"}
            // The member's own photo when they have uploaded one; the initials
            // fall back automatically when they have not.
            src={resolveMediaUrl(u.profile.profilePicture) ?? undefined}
            size="sm"
          />
          <div>
            <div style={{ fontWeight: 600 }}>{u.profile.name ?? "—"}</div>
            <div className="text-caption">{u.phone.normalized ?? "—"}</div>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (u) => (
        <div>
          <div>{u.profile.email ?? "—"}</div>
          {/* Only the user can verify an email, in the app. */}
          {u.profile.email && (
            <div className="text-caption" style={{ color: u.profile.isEmailVerified ? "var(--color-success)" : "var(--color-warning)" }}>
              {u.profile.isEmailVerified ? "Verified" : "Not verified"}
            </div>
          )}
        </div>
      ),
    },
    // Roles are additive, so every role is shown, not a single persona.
    { key: "roles", header: "Roles", render: (u) => <RoleBadges roles={u.roles} /> },
    {
      key: "profileCompleted",
      header: "Profile",
      render: (u) => (
        <StatusBadge
          label={u.profileCompleted ? "Complete" : "Incomplete"}
          tone={u.profileCompleted ? "success" : "warning"}
          dot={false}
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (u) =>
        u.status ? (
          <StatusBadge
            label={u.status[0].toUpperCase() + u.status.slice(1)}
            tone={STATUS_TONES[u.status]}
          />
        ) : (
          <span className="text-caption">—</span>
        ),
    },
    { key: "createdAt", header: "Created", render: (u) => formatDate(u.createdAt) },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        breadcrumb={[{ label: "People" }, { label: "Users" }]}
        description="Every account in the GoGetFit app. Roles are additive — an account can be a user, client, coach and admin at once."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Download size={15} />}
              onClick={() => show("Export started — you'll be notified when it's ready", "info")}
            >
              Export
            </Button>
            <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/users/new")}>
              Add User
            </Button>
          </>
        }
      />

      <FilterBar>
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Search by name, email, phone, city..."
        />
        <Select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          placeholder="Role"
          options={[
            { label: "All roles", value: "" },
            { label: "User", value: "user" },
            { label: "Client", value: "client" },
            { label: "Coach", value: "coach" },
            { label: "Admin", value: "admin" },
          ]}
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
            <IconButton
              icon={<Pencil size={15} />}
              label="Edit"
              size="sm"
              onClick={() => navigate(`/users/${u.id}/edit`)}
            />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
