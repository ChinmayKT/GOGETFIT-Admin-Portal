import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Eye, IndianRupee, ListOrdered, Power, Users, Wallet, UserPlus } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { Pagination } from "../../components/data-display/Pagination";
import { MetricCard } from "../../components/charts/MetricCard";
import { IconButton } from "../../components/ui/IconButton";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useToast } from "../../components/feedback/ToastProvider";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import {
  ambassadorSummary,
  exportAmbassadors,
  listAmbassadors,
  setAmbassadorStatus,
  type AmbassadorListParams,
} from "../../api/ambassadors";
import { formatCurrencyINR, formatDate } from "../../utils/format";
import { downloadCsv } from "../../utils/csv";
import type { Ambassador, AmbassadorSummary } from "../../types/ambassador";
import styles from "./Ambassadors.module.css";

const SORTS = [
  { label: "Newest first", value: "registeredAt:desc" },
  { label: "Oldest first", value: "registeredAt:asc" },
  { label: "Most referrals", value: "successfulReferrals:desc" },
  { label: "Highest sales", value: "salesAmount:desc" },
  { label: "Name A–Z", value: "name:asc" },
];

/** Brand Ambassadors: every ambassador, their code and how their referrals are doing. */
export function AmbassadorListPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [joined, setJoined] = useState("");
  const [sort, setSort] = useState(SORTS[0].value);
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState<AmbassadorSummary | null>(null);
  const [toggling, setToggling] = useState<Ambassador | null>(null);
  const [saving, setSaving] = useState(false);
  const pageSize = 10;

  const [sortKey, sortDir] = sort.split(":") as [string, "asc" | "desc"];
  const params = useMemo<AmbassadorListParams>(
    () => ({ query, status: status || undefined, joinedWithinDays: joined ? Number(joined) : undefined, sortKey, sortDir, page, pageSize }),
    [query, status, joined, sortKey, sortDir, page],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listAmbassadors, params);

  useEffect(() => {
    ambassadorSummary().then(setSummary);
  }, []);

  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  const confirmToggle = async () => {
    if (!toggling) return;
    setSaving(true);
    const next = toggling.status === "Active" ? "Inactive" : "Active";
    try {
      await setAmbassadorStatus(toggling.id, next);
      show(`${toggling.name ?? toggling.couponCode} is now ${next.toLowerCase()}`, "success");
    } catch (error) {
      show(error instanceof Error ? error.message : "Could not change the status", "error");
    } finally {
      setSaving(false);
      setToggling(null);
      retry();
    }
  };

  const exportCsv = async () => {
    const all = await exportAmbassadors(params);
    downloadCsv(
      "brand-ambassadors.csv",
      ["Name", "User ID", "Email", "Mobile", "Coupon", "Referrals", "Sales", "Commission", "Status", "Registered"],
      all.rows.map((a) => [a.name, a.userId, a.email, a.mobile, a.couponCode, a.successfulReferrals, a.salesAmount, a.commissionEarned, a.status, formatDate(a.registeredAt)]),
    );
    show(`Exported ${all.rows.length} ambassadors`, "success");
  };

  const columns: Column<Ambassador>[] = [
    {
      key: "name",
      header: "Ambassador",
      render: (a) => (
        <span className={styles.who}>
          <Avatar name={a.name ?? a.couponCode} size="sm" />
          <span className={styles.whoText}>
            <span className={`${styles.whoName} ${styles.nowrap}`}>{a.name ?? "—"}</span>
          </span>
        </span>
      ),
    },
    { key: "userId", header: "User ID" },
    { key: "email", header: "Email" },
    { key: "mobile", header: "Mobile", render: (a) => <span className={styles.nowrap}>{a.mobile}</span> },
    { key: "couponCode", header: "Coupon Code", render: (a) => <span className={styles.code}>{a.couponCode}</span> },
    { key: "successfulReferrals", header: "Referrals", align: "right" },
    { key: "salesAmount", header: "Sales Amount", align: "right", render: (a) => formatCurrencyINR(a.salesAmount) },
    {
      key: "commissionEarned",
      header: "Commission",
      align: "right",
      render: (a) => (
        <span className={styles.whoText}>
          <span>{formatCurrencyINR(a.commissionEarned)}</span>
          <span className={styles.sub}>{a.commissionPercent}%</span>
        </span>
      ),
    },
    { key: "status", header: "Status", render: (a) => <StatusBadge label={a.status} tone={a.status === "Active" ? "success" : "neutral"} /> },
    { key: "registeredAt", header: "Joined On", render: (a) => <span className={styles.nowrap}>{formatDate(a.registeredAt)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Brand Ambassadors"
        breadcrumb={[{ label: "People" }, { label: "Brand Ambassadors" }]}
        description="Manage ambassador profiles, coupon codes and referral performance."
        actions={
          <Button variant="primary" icon={<Download size={15} />} onClick={exportCsv} disabled={loading || total === 0}>
            Export
          </Button>
        }
      />

      <div className={styles.metrics}>
        <MetricCard label="Total Ambassadors" value={summary ? String(summary.totalAmbassadors) : "—"} icon={<Users size={16} />} />
        <MetricCard label="Total Successful Referrals" value={summary ? String(summary.totalReferrals) : "—"} icon={<UserPlus size={16} />} />
        <MetricCard label="Total Attributed Sales" value={summary ? formatCurrencyINR(summary.totalSales) : "—"} icon={<IndianRupee size={16} />} />
        <MetricCard label="Total Commission Payable" value={summary ? formatCurrencyINR(summary.totalCommissionPayable) : "—"} icon={<Wallet size={16} />} />
      </div>

      <FilterBar>
        <SearchInput value={query} onChange={reset(setQuery)} placeholder="Search by name, email, mobile, user ID or coupon..." />
        <Select
          aria-label="Status"
          value={status}
          onChange={(e) => reset(setStatus)(e.target.value)}
          options={[
            { label: "All statuses", value: "" },
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
          ]}
        />
        <Select
          aria-label="Registered"
          value={joined}
          onChange={(e) => reset(setJoined)(e.target.value)}
          options={[
            { label: "Any registration date", value: "" },
            { label: "Last 7 days", value: "7" },
            { label: "Last 30 days", value: "30" },
            { label: "Last 90 days", value: "90" },
          ]}
        />
        <Select aria-label="Sort" value={sort} onChange={(e) => reset(setSort)(e.target.value)} options={SORTS} />
      </FilterBar>

      <DataTable
        rowOffset={(page - 1) * pageSize}
        columns={columns}
        rows={rows}
        getRowId={(a) => a.id}
        loading={loading}
        error={error}
        onRetry={retry}
        onRowClick={(a) => navigate(`/ambassadors/${a.id}`)}
        emptyTitle="No ambassadors found"
        emptyDescription="Try a different search or clear the filters."
        rowActions={(a) => (
          <div style={{ display: "flex", gap: 4 }}>
            <IconButton icon={<Eye size={15} />} label="View details" size="sm" onClick={() => navigate(`/ambassadors/${a.id}`)} />
            <IconButton icon={<ListOrdered size={15} />} label="View referrals" size="sm" onClick={() => navigate(`/ambassadors/${a.id}?tab=referrals`)} />
            <IconButton
              icon={<Power size={15} />}
              label={a.status === "Active" ? "Deactivate" : "Activate"}
              size="sm"
              onClick={() => setToggling(a)}
            />
          </div>
        )}
      />

      {!loading && !error && rows.length > 0 && <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />}

      <ConfirmDialog
        open={toggling !== null}
        title={toggling?.status === "Active" ? `Deactivate ${toggling?.name}?` : `Activate ${toggling?.name}?`}
        description={
          toggling?.status === "Active"
            ? `Their code ${toggling?.couponCode} will stop giving a discount. Existing referrals are kept.`
            : `Their code ${toggling?.couponCode} will give a discount again.`
        }
        confirmLabel={toggling?.status === "Active" ? "Deactivate" : "Activate"}
        tone={toggling?.status === "Active" ? "danger" : "primary"}
        loading={saving}
        onConfirm={confirmToggle}
        onCancel={() => setToggling(null)}
      />
    </>
  );
}
