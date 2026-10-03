import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { listCartItems, type CartItemRow } from "../../api/cartItems";
import { listCoaches } from "../../api/coaches";
import { listGogetfitPlans } from "../../api/gogetfitPlans";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { formatDate } from "../../utils/format";

/**
 * In cart - the sales follow-up list.
 *
 * Members who put a coaching plan in their cart and have not bought it. A
 * purchased item disappears from here on its own, because the purchase marks the
 * cart item as purchased in the same transaction that creates the enrollment -
 * at which point it appears under Clients instead.
 */

const SORT_OPTIONS = [
  { label: "Recently added", value: "addedAt:desc" },
  { label: "Oldest first", value: "addedAt:asc" },
  { label: "Price (high to low)", value: "price:desc" },
  { label: "Price (low to high)", value: "price:asc" },
  { label: "Plan name (A-Z)", value: "planName:asc" },
];

const money = (amount: number | null, currency = "INR") =>
  amount === null ? "—" : `${currency === "INR" ? "₹" : ""}${amount.toLocaleString("en-IN")}`;

const dash = (value: string | null | undefined) => (value && value.trim() !== "" ? value : "—");

export function InCartPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [coachId, setCoachId] = useState("");
  const [planId, setPlanId] = useState("");
  const [sort, setSort] = useState("addedAt:desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const search = useDebouncedValue(query);

  // The filter dropdowns are populated from the same APIs the rest of the
  // portal uses, so a coach or plan added elsewhere appears here too.
  const [coaches, setCoaches] = useState<{ label: string; value: string }[]>([]);
  const [plans, setPlans] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    let stale = false;
    listCoaches({ pageSize: 100, status: "active" })
      .then((res) => {
        if (!stale) setCoaches(res.rows.map((c) => ({ label: c.user?.name ?? "Unnamed coach", value: c.id })));
      })
      .catch(() => { /* the filter is optional; the list still works without it */ });
    listGogetfitPlans({ pageSize: 100 })
      .then((res) => {
        if (!stale) setPlans(res.rows.map((p) => ({ label: p.name, value: p.id })));
      })
      .catch(() => { /* same */ });
    return () => { stale = true; };
  }, []);

  const params = useMemo(() => {
    const [sortKey, sortDir] = sort.split(":") as [string, "asc" | "desc"];
    return {
      search: search || undefined,
      coachId: coachId || undefined,
      planId: planId || undefined,
      sortKey,
      sortDir,
      page,
      pageSize,
    };
  }, [search, coachId, planId, sort, page]);

  const { rows, total, loading, error, retry } = usePagedQuery(listCartItems, params);

  const resetPage = () => setPage(1);

  const columns: Column<CartItemRow>[] = [
    {
      key: "user",
      header: "Member",
      render: (c) => (
        <div>
          <div style={{ fontWeight: 600 }}>{dash(c.user?.name)}</div>
          <div className="text-caption">{dash(c.user?.phone)}</div>
        </div>
      ),
    },
    { key: "email", header: "Email", render: (c) => dash(c.user?.email) },
    {
      key: "coach",
      header: "Coach",
      render: (c) => (
        <div>
          <div>{dash(c.coach?.name)}</div>
          <div className="text-caption">{dash(c.coach?.level)}</div>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan",
      render: (c) => (
        <div>
          <div>{dash(c.plan?.name)}</div>
          <div className="text-caption">
            {c.plan?.durationWeeks ? `${c.plan.durationWeeks} weeks` : "—"}
          </div>
        </div>
      ),
    },
    { key: "price", header: "Price", render: (c) => money(c.plan?.price ?? null, c.plan?.currency) },
    { key: "addedAt", header: "Added", render: (c) => (c.addedAt ? formatDate(c.addedAt) : "—") },
    { key: "updatedAt", header: "Last updated", render: (c) => (c.updatedAt ? formatDate(c.updatedAt) : "—") },
  ];

  const filtered = Boolean(search || coachId || planId);

  return (
    <>
      <PageHeader
        title="In cart"
        breadcrumb={[{ label: "Commerce" }, { label: "In cart" }]}
        description="Members who added a coaching plan but have not completed the purchase. Items disappear from this list once they are bought."
      />

      <FilterBar>
        <SearchInput
          value={query}
          onChange={(v) => { setQuery(v); resetPage(); }}
          placeholder="Search by member name, phone, email, plan..."
        />
        <Select
          value={coachId}
          aria-label="Coach"
          onChange={(e) => { setCoachId(e.target.value); resetPage(); }}
          placeholder="Coach"
          options={[{ label: "All coaches", value: "" }, ...coaches]}
        />
        <Select
          value={planId}
          aria-label="Plan"
          onChange={(e) => { setPlanId(e.target.value); resetPage(); }}
          placeholder="Plan"
          options={[{ label: "All plans", value: "" }, ...plans]}
        />
        <Select
          value={sort}
          aria-label="Sort"
          onChange={(e) => { setSort(e.target.value); resetPage(); }}
          options={SORT_OPTIONS}
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
        onRowClick={(c) => c.user && navigate(`/users/${c.user.id}`)}
        emptyTitle={filtered ? "No carts match these filters" : "No pending carts"}
        emptyDescription={
          filtered
            ? "Try a different search term or clear the filters."
            : "When a member adds a plan without buying it, they appear here for follow-up."
        }
      />

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </>
  );
}
