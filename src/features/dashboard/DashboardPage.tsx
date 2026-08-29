import { useNavigate } from "react-router-dom";
import {
  Users, Award, ClipboardList, Wallet, Dumbbell, Utensils, Trophy, Image as ImageIcon, Ticket, ArrowRight,
} from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { MetricCard } from "../../components/charts/MetricCard";
import { LineChart } from "../../components/charts/LineChart";
import { DonutChart } from "../../components/charts/DonutChart";
import { DataTable, type Column } from "../../components/data-display/DataTable";
import { StatusBadge, type StatusTone } from "../../components/ui/StatusBadge";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { dashboardKpis, userGrowthSeries, planOverview, recentUsers } from "../../mock/dashboard/data";
import { recentOrders } from "../../mock/orders/repository";
import { OPERATIONAL_ALERTS } from "../../mock/system/alerts";
import { formatCurrencyINR, formatCompactNumber, formatDate } from "../../utils/format";
import type { AppUser } from "../../types/user";
import type { Order } from "../../types/order";
import styles from "./DashboardPage.module.css";

const USER_STATUS_TONE: Record<string, StatusTone> = { Active: "success", Inactive: "neutral", Pending: "warning" };
const ORDER_STATUS_TONE: Record<string, StatusTone> = { Booked: "info", Sent: "warning", Delivered: "success" };

const QUICK_ACTIONS = [
  { label: "Add User", icon: Users, path: "/users/new" },
  { label: "Add Coach", icon: Award, path: "/coaches/new" },
  { label: "Create Diet Plan", icon: Utensils, path: "/nutrition/diets/new" },
  { label: "Create Workout", icon: Dumbbell, path: "/fitness/workouts/new" },
  { label: "Add Challenge", icon: Trophy, path: "/challenges/new" },
  { label: "Add Banner", icon: ImageIcon, path: "/content/banners" },
  { label: "Create Coupon", icon: Ticket, path: "/commerce/coupons" },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const kpis = dashboardKpis();
  const growth = userGrowthSeries();
  const plans = planOverview();
  const users = recentUsers(5);
  const orders = recentOrders(5);

  const userColumns: Column<AppUser>[] = [
    {
      key: "name",
      header: "User",
      render: (u) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" />
          <span>{u.firstName} {u.lastName}</span>
        </div>
      ),
    },
    { key: "goal", header: "Goal" },
    { key: "coachName", header: "Coach", render: (u) => u.coachName ?? "—" },
    { key: "planName", header: "Plan", render: (u) => u.planName ?? "—" },
    { key: "status", header: "Status", render: (u) => <StatusBadge label={u.status} tone={USER_STATUS_TONE[u.status]} /> },
    { key: "joinedAt", header: "Joined", render: (u) => formatDate(u.joinedAt) },
  ];

  const orderColumns: Column<Order>[] = [
    { key: "orderNumber", header: "Order" },
    { key: "userName", header: "User" },
    { key: "itemName", header: "Item" },
    { key: "amount", header: "Amount", render: (o) => formatCurrencyINR(o.amount) },
    { key: "status", header: "Status", render: (o) => <StatusBadge label={o.status} tone={ORDER_STATUS_TONE[o.status]} /> },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Live snapshot of the GoGetFit business — mock data for prototype purposes." />

      <div className={styles.kpiGrid}>
        <MetricCard label="Total Users" value={formatCompactNumber(kpis.totalUsers)} trend={{ value: "8.2%", direction: "up" }} comparison="vs last month" sparklineData={[40, 55, 48, 62, 70, 68, 82]} icon={<Users size={16} />} />
        <MetricCard label="Active Coaches" value={String(kpis.activeCoaches)} trend={{ value: "3.1%", direction: "up" }} comparison="vs last month" sparklineData={[18, 19, 21, 20, 22, 23, 24]} icon={<Award size={16} />} />
        <MetricCard label="Active Plans" value={String(kpis.activePlans)} trend={{ value: "1.4%", direction: "down" }} comparison="vs last month" sparklineData={[9, 10, 8, 9, 9, 8, 7]} icon={<ClipboardList size={16} />} />
        <MetricCard label="Revenue (MTD)" value={formatCurrencyINR(kpis.revenueMTD)} trend={{ value: "12.6%", direction: "up" }} comparison="vs last month" sparklineData={[20, 35, 28, 42, 38, 50, 60]} icon={<Wallet size={16} />} />
      </div>

      <div className={styles.midGrid}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 16 }}>User Growth</p>
          <LineChart data={growth} xKey="month" series={[{ key: "New Users", label: "New Users" }, { key: "Active Users", label: "Active Users" }]} height={260} />
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 16 }}>Plan Overview</p>
          <DonutChart data={plans} height={260} />
        </GlassCard>
      </div>

      <div className={styles.midGrid}>
        <GlassCard>
          <p className="text-title" style={{ marginBottom: 14 }}>Needs Attention</p>
          <div className={styles.alertList}>
            {OPERATIONAL_ALERTS.map((a) => (
              <button key={a.id} className={styles.alertItem} onClick={() => navigate(a.path)}>
                <span>{a.label}</span>
                <StatusBadge label={String(a.count)} tone={a.tone} dot={false} />
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-title" style={{ marginBottom: 14 }}>Quick Actions</p>
          <div className={styles.quickGrid}>
            {QUICK_ACTIONS.map((qa) => (
              <button key={qa.label} className={styles.quickAction} onClick={() => navigate(qa.path)}>
                <qa.icon size={16} />
                <span>{qa.label}</span>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      <SectionTable
        title="Recent Users"
        onViewAll={() => navigate("/users")}
        table={<DataTable columns={userColumns} rows={users} getRowId={(u) => u.id} emptyTitle="No users yet" />}
      />

      <SectionTable
        title="Recent Orders"
        onViewAll={() => navigate("/commerce/orders")}
        table={<DataTable columns={orderColumns} rows={orders} getRowId={(o) => o.id} emptyTitle="No orders yet" />}
      />
    </>
  );
}

function SectionTable({ title, table, onViewAll }: { title: string; table: React.ReactNode; onViewAll: () => void }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <p className="text-title">{title}</p>
        <Button variant="ghost" size="sm" iconRight={<ArrowRight size={14} />} onClick={onViewAll}>
          View all
        </Button>
      </div>
      {table}
    </div>
  );
}
