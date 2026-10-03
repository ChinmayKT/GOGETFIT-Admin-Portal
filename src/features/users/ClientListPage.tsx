import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { resolveMediaUrl } from "../../api/media";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { StatusBadge } from "../../components/ui/StatusBadge";
import {
  listEnrolledClients,
  STATUS_LABELS,
  type EnrolledClientRow,
  type EnrollmentStatus,
} from "../../api/enrolledClients";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { formatDate } from "../../utils/format";
import { STATUS_TONE, dash, money } from "./clientFormat";

/**
 * Clients — one row per enrollment, from GET /api/admin/enrolled-clients.
 *
 * A member with three purchases appears three times, because each row is a
 * purchase with its own plan, coach, coupon and payment. The related documents
 * are joined by the backend; nothing here is stored twice.
 */

export function ClientListPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<EnrollmentStatus | "">("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Server-side paging, search and filtering: the backend caps the page size,
  // so the browser never receives the whole collection.
  const params = useMemo(
    () => ({ search: query || undefined, status: status || undefined, page, pageSize }),
    [query, status, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listEnrolledClients, params);

  const columns: Column<EnrolledClientRow>[] = [
    {
      key: "client",
      header: "Client",
      render: (c) =>
        c.client ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* The member's own photo; initials when they have none. */}
            <Avatar name={c.client.name ?? c.client.phone ?? "?"} src={resolveMediaUrl(c.client.profilePicture) ?? undefined} size="sm" />
            <div>
              <div style={{ fontWeight: 600 }}>{dash(c.client.name)}</div>
              <div className="text-caption">{dash(c.client.phone)}</div>
            </div>
          </div>
        ) : (
          "—"
        ),
    },
    {
      key: "coach",
      header: "Coach",
      // Most migrated enrollments have no new Coach document yet, so the name
      // the legacy system recorded is shown instead. The id is only a last
      // resort, for a legacy coach whose m_coach row no longer exists.
      render: (c) =>
        c.coach?.name ??
        c.legacyCoachName ??
        (c.legacyCoachId ? `Legacy #${c.legacyCoachId}` : "—"),
    },
    { key: "plan", header: "Plan", render: (c) => dash(c.plan?.name ?? null) },
    {
      key: "coupon",
      header: "Coupon",
      // The resolved coupon, or the code as it was typed when it resolved to none.
      render: (c) => dash(c.coupon?.code ?? c.legacyCouponCode),
    },
    { key: "amount", header: "Paid", render: (c) => money(c.amount, c.currency) },
    { key: "transactionId", header: "Transaction ID", render: (c) => dash(c.transactionId) },
    {
      key: "status",
      header: "Status",
      render: (c) => <StatusBadge label={STATUS_LABELS[c.status]} tone={STATUS_TONE[c.status]} />,
    },
    { key: "enrollDate", header: "Enrolled", render: (c) => (c.enrollDate ? formatDate(c.enrollDate) : "—") },
    { key: "startDate", header: "Start", render: (c) => (c.startDate ? formatDate(c.startDate) : "—") },
    { key: "endDate", header: "End", render: (c) => (c.endDate ? formatDate(c.endDate) : "—") },
    {
      key: "legacyId",
      header: "Legacy ID",
      // The legacy m_user id, which is the only member identifier the migrated
      // data actually carries - there is no GGF ID column in the legacy system.
      render: (c) => dash(c.client?.legacyUserId ?? null),
    },
  ];

  return (
    <>
      <PageHeader
        title="Clients"
        breadcrumb={[{ label: "People", path: "/users" }, { label: "Clients" }]}
        description="One row per enrollment. A member who bought more than once appears once per purchase."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate("/users/clients/add")}>
            Add Client
          </Button>
        }
      />

      <FilterBar>
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Search by client name, phone, transaction ID, coupon..."
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as EnrollmentStatus | "");
            setPage(1);
          }}
          placeholder="Status"
          options={[
            { label: "All statuses", value: "" },
            { label: "Active", value: "active" },
            { label: "Expired", value: "inactive" },
            { label: "Not Started", value: "not_started" },
            { label: "Deleted", value: "deleted" },
          ]}
        />
      </FilterBar>

      <DataTable
          rowOffset={(page - 1) * pageSize}
        columns={columns}
        rows={rows}
        getRowId={(c) => c.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(c) => c.client && navigate(`/users/clients/${c.client.id}`)}
        emptyTitle="No enrollments found"
        emptyDescription="Try adjusting your search or filters."
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
