import type {
  RevenuePoint, RevenueByCategory, RevenueByPackage, FinanceOverviewKpis, BusinessHealth,
  FinanceInsight, SubscriptionsSummary, CoachFinancialPerformance, CoachAcquisition, CoachFunnelStage,
} from "../../types/finance";
import { MOCK_PAYMENTS, MOCK_REFUNDS, MOCK_SUBSCRIPTIONS } from "./data";
import { MOCK_COACHES } from "../coaches/data";
import { MOCK_CLIENTS } from "../users/clientsData";
import { computeCoachPerformanceScore } from "../../utils/coachPerformanceScore";

const NEW_CLIENT_WINDOW_DAYS = 90;
const now = () => Date.now();
const daysBetween = (iso: string) => Math.floor((now() - new Date(iso).getTime()) / 86400000);

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-IN", { month: "short" });
}

const recognizedPayments = () => MOCK_PAYMENTS.filter((p) => p.status === "Success" || p.status === "Partially Refunded");

export function financeOverviewKpis(): FinanceOverviewKpis {
  const recognized = recognizedPayments();
  const totalRevenue = recognized.reduce((s, p) => s + p.netAmount, 0);

  const nowD = new Date();
  const thisMonthKey = monthKey(nowD.toISOString());
  const lastMonthD = new Date(nowD.getFullYear(), nowD.getMonth() - 1, 1);
  const lastMonthKey = monthKey(lastMonthD.toISOString());

  const thisMonthRevenue = recognized.filter((p) => monthKey(p.createdAt) === thisMonthKey).reduce((s, p) => s + p.netAmount, 0);
  const lastMonthRevenue = recognized.filter((p) => monthKey(p.createdAt) === lastMonthKey).reduce((s, p) => s + p.netAmount, 0);
  const thisMonthGrowthPct = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  const twoMonthsAgoD = new Date(nowD.getFullYear(), nowD.getMonth() - 2, 1);
  const twoMonthsAgoKey = monthKey(twoMonthsAgoD.toISOString());
  const twoMonthsAgoRevenue = recognized.filter((p) => monthKey(p.createdAt) === twoMonthsAgoKey).reduce((s, p) => s + p.netAmount, 0);
  const revenueGrowthPct = twoMonthsAgoRevenue > 0 ? ((lastMonthRevenue - twoMonthsAgoRevenue) / twoMonthsAgoRevenue) * 100 : thisMonthGrowthPct;

  const successCount = MOCK_PAYMENTS.filter((p) => p.status === "Success").length;
  const totalCount = MOCK_PAYMENTS.length;
  const successRatePct = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

  const newEnrollmentsWindow = MOCK_PAYMENTS.filter(
    (p) => p.kind === "Enrollment" && p.status === "Success" && daysBetween(p.createdAt) <= NEW_CLIENT_WINDOW_DAYS,
  );
  const newEnrollmentsPrevWindow = MOCK_PAYMENTS.filter(
    (p) =>
      p.kind === "Enrollment" &&
      p.status === "Success" &&
      daysBetween(p.createdAt) > NEW_CLIENT_WINDOW_DAYS &&
      daysBetween(p.createdAt) <= NEW_CLIENT_WINDOW_DAYS * 2,
  );
  const newEnrollments = newEnrollmentsWindow.length;
  const newEnrollmentsGrowthPct =
    newEnrollmentsPrevWindow.length > 0 ? ((newEnrollments - newEnrollmentsPrevWindow.length) / newEnrollmentsPrevWindow.length) * 100 : 0;

  const refundsTotal = MOCK_REFUNDS.filter((r) => r.status === "Completed").reduce((s, r) => s + r.refundAmount, 0);
  const refundsPctOfRevenue = totalRevenue > 0 ? (refundsTotal / (totalRevenue + refundsTotal)) * 100 : 0;

  const averageOrderValue = successCount > 0 ? totalRevenue / recognized.length : 0;
  const prevAvg = twoMonthsAgoRevenue > 0 && lastMonthRevenue > 0 ? lastMonthRevenue / Math.max(1, newEnrollmentsPrevWindow.length) : averageOrderValue;
  const aovGrowthPct = prevAvg > 0 ? ((averageOrderValue - prevAvg) / prevAvg) * 100 : 0;

  return {
    totalRevenue,
    revenueGrowthPct,
    thisMonthRevenue,
    thisMonthGrowthPct,
    successfulPayments: successCount,
    successRatePct,
    newEnrollments,
    newEnrollmentsGrowthPct,
    refundsTotal,
    refundsPctOfRevenue,
    averageOrderValue,
    aovGrowthPct,
  };
}

export function revenueTrend(months = 6): RevenuePoint[] {
  const points: RevenuePoint[] = [];
  const nowD = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(nowD.getFullYear(), nowD.getMonth() - i, 1);
    const key = monthKey(d.toISOString());
    const inMonth = MOCK_PAYMENTS.filter((p) => monthKey(p.createdAt) === key);
    const revenue = inMonth.filter((p) => p.status === "Success" || p.status === "Partially Refunded").reduce((s, p) => s + p.netAmount, 0);
    const enrollments = inMonth.filter((p) => p.kind === "Enrollment" && p.status === "Success").length;
    const refunds = MOCK_REFUNDS.filter((r) => monthKey(r.createdAt) === key).reduce((s, r) => s + r.refundAmount, 0);
    points.push({ label: monthLabel(d), revenue, payments: inMonth.length, enrollments, refunds });
  }
  return points;
}

export function revenueByBusinessType(): RevenueByCategory[] {
  const recognized = recognizedPayments();
  const total = recognized.reduce((s, p) => s + p.netAmount, 0);
  const categories: RevenueByCategory["label"][] = ["Coaching Plans", "Renewals", "Challenges", "Other"];
  return categories
    .map((label) => {
      const value = recognized.filter((p) => p.businessType === label).reduce((s, p) => s + p.netAmount, 0);
      return { label, value, pct: total > 0 ? (value / total) * 100 : 0 };
    })
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function revenueByPackage(): RevenueByPackage[] {
  const recognized = recognizedPayments();
  const map = new Map<string, RevenueByPackage>();
  recognized.forEach((p) => {
    const existing = map.get(p.packageId);
    if (existing) existing.revenue += p.netAmount;
    else map.set(p.packageId, { packageId: p.packageId, packageName: p.packageName, revenue: p.netAmount });
  });
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}

function newClientCountForCoach(coachId: string): number {
  return MOCK_CLIENTS.filter((c) => c.coachId === coachId && daysBetween(c.enrolledDate) <= NEW_CLIENT_WINDOW_DAYS).length;
}

export function coachFinancialPerformanceList(): CoachFinancialPerformance[] {
  const raw = MOCK_COACHES.map((coach) => {
    const clients = MOCK_CLIENTS.filter((c) => c.coachId === coach.id);
    const clientIds = new Set(clients.map((c) => c.userId));
    const coachPayments = recognizedPayments().filter((p) => clientIds.has(p.clientId));
    const revenue = coachPayments.reduce((s, p) => s + p.netAmount, 0);
    const newClients = newClientCountForCoach(coach.id);
    const renewals = coachPayments.filter((p) => p.kind === "Renewal").length;
    const nonCancelled = clients.filter((c) => c.status !== "Cancelled").length;
    const activeOrRenewed = clients.filter((c) => c.status === "Active" || c.status === "Pending Renewal").length;
    const retentionPct = nonCancelled > 0 ? (activeOrRenewed / nonCancelled) * 100 : 0;
    const activeClients = clients.filter((c) => c.status !== "Cancelled").length;
    return { coach, clients, revenue, newClients, renewals, retentionPct, activeClients };
  });

  const maxRevenue = Math.max(1, ...raw.map((r) => r.revenue));
  const maxNewClients = Math.max(1, ...raw.map((r) => r.newClients));

  const scored: CoachFinancialPerformance[] = raw.map((r) => {
    const score = computeCoachPerformanceScore({
      revenue: r.revenue,
      maxRevenue,
      newClients: r.newClients,
      maxNewClients,
      retentionPct: r.retentionPct,
      transformationsCount: r.coach.transformationsCount,
      activeClients: r.activeClients,
    });
    return {
      coachId: r.coach.id,
      coachName: `${r.coach.firstName} ${r.coach.lastName}`,
      level: r.coach.level,
      activeClients: r.activeClients,
      newClients: r.newClients,
      renewals: r.renewals,
      revenue: r.revenue,
      revenuePerClient: r.activeClients > 0 ? Math.round(r.revenue / r.activeClients) : 0,
      retentionPct: Math.round(r.retentionPct * 10) / 10,
      performanceScore: score.overall,
      performanceBreakdown: score.breakdown,
      tier: score.tier,
      capacity: r.activeClients + r.coach.availableSlots,
      utilizationPct: r.activeClients + r.coach.availableSlots > 0 ? (r.activeClients / (r.activeClients + r.coach.availableSlots)) * 100 : 0,
      pendingAssignments: r.coach.pendingClients,
      rank: 0,
    };
  });

  return scored
    .sort((a, b) => b.revenue - a.revenue)
    .map((c, i) => ({ ...c, rank: i + 1 }));
}

export function coachAcquisitionList(): CoachAcquisition[] {
  const perCoach = MOCK_COACHES.map((coach) => {
    const newClients = MOCK_CLIENTS.filter((c) => c.coachId === coach.id && daysBetween(c.enrolledDate) <= NEW_CLIENT_WINDOW_DAYS);
    const newClientIds = new Set(newClients.map((c) => c.userId));
    const acquisitionRevenue = recognizedPayments()
      .filter((p) => p.kind === "Enrollment" && newClientIds.has(p.clientId))
      .reduce((s, p) => s + p.netAmount, 0);
    return { coachId: coach.id, coachName: `${coach.firstName} ${coach.lastName}`, newClientsAcquired: newClients.length, acquisitionRevenue };
  });
  const totalNew = perCoach.reduce((s, c) => s + c.newClientsAcquired, 0);
  return perCoach
    .filter((c) => c.newClientsAcquired > 0)
    .map((c) => ({ ...c, percentOfNewClients: totalNew > 0 ? (c.newClientsAcquired / totalNew) * 100 : 0 }))
    .sort((a, b) => b.newClientsAcquired - a.newClientsAcquired);
}

export function coachFunnel(coachId: string): CoachFunnelStage[] {
  const clients = MOCK_CLIENTS.filter((c) => c.coachId === coachId);
  const clientIds = new Set(clients.map((c) => c.userId));
  const enrolled = clients.length;

  const failedOrPendingIds = new Set(
    MOCK_PAYMENTS.filter((p) => p.kind === "Enrollment" && clientIds.has(p.clientId) && (p.status === "Pending" || p.status === "Failed")).map(
      (p) => p.clientId,
    ),
  );
  const startedClients = clients.filter((c) => !failedOrPendingIds.has(c.userId));
  const started = startedClients.length;

  // Each stage below is a lifecycle MILESTONE ("did this client ever reach X"),
  // not a current-snapshot state — so each one is a strict SUBSET of the previous
  // one and the funnel can never widen. A client who renewed and later expired
  // still counts under "Active" and "Renewed"; only clients who dropped before
  // ever being genuinely active (Cancelled) are excluded from every stage after Started.
  const activeClients = startedClients.filter((c) => c.status !== "Cancelled");
  const active = activeClients.length;

  const renewedPaymentIds = new Set(
    MOCK_PAYMENTS.filter((p) => p.kind === "Renewal" && p.status !== "Failed").map((p) => p.clientId),
  );
  const renewedClients = activeClients.filter((c) => renewedPaymentIds.has(c.userId));
  const renewed = renewedClients.length;

  const completed = renewedClients.filter((c) => c.status === "Expired").length;

  const leadFactor = 0.55 + (Math.abs(coachId.length * 7) % 20) / 100;
  const leads = Math.max(enrolled, Math.round(enrolled / leadFactor));

  return [
    { stage: "Leads", count: leads },
    { stage: "Enrolled", count: enrolled },
    { stage: "Started", count: started },
    { stage: "Active", count: active },
    { stage: "Renewed", count: renewed },
    { stage: "Completed", count: completed },
  ];
}

export function subscriptionsSummary(): SubscriptionsSummary {
  const activeCount = MOCK_SUBSCRIPTIONS.filter((s) => s.status === "Active").length;
  const expiringSoonCount = MOCK_SUBSCRIPTIONS.filter((s) => s.status === "Expiring Soon").length;
  const expiredCount = MOCK_SUBSCRIPTIONS.filter((s) => s.status === "Expired").length;
  const renewedCount = MOCK_SUBSCRIPTIONS.filter((s) => s.status === "Renewed").length;
  const cancelledCount = MOCK_SUBSCRIPTIONS.filter((s) => s.status === "Cancelled").length;

  const upcomingRenewals = expiringSoonCount;
  const expectedRenewalRevenue = MOCK_SUBSCRIPTIONS.filter((s) => s.status === "Expiring Soon").reduce((s, sub) => s + sub.revenue, 0);
  const dueForRenewal = renewedCount + expiredCount;
  const renewalRatePct = dueForRenewal > 0 ? (renewedCount / dueForRenewal) * 100 : 0;
  const churnRatePct = MOCK_SUBSCRIPTIONS.length > 0 ? (expiredCount / MOCK_SUBSCRIPTIONS.length) * 100 : 0;

  return { activeCount, expiringSoonCount, expiredCount, renewedCount, cancelledCount, upcomingRenewals, expectedRenewalRevenue, renewalRatePct, churnRatePct };
}

export function businessHealth(): BusinessHealth {
  const kpis = financeOverviewKpis();
  const subs = subscriptionsSummary();
  const coaches = coachFinancialPerformanceList();
  const avgUtilization = coaches.length > 0 ? coaches.reduce((s, c) => s + c.utilizationPct, 0) / coaches.length : 0;

  const clientGrowthPct = kpis.newEnrollmentsGrowthPct;
  const scoreInputs = [kpis.revenueGrowthPct > 5, subs.renewalRatePct > 70, kpis.successRatePct > 90, kpis.refundsPctOfRevenue < 3];
  const passCount = scoreInputs.filter(Boolean).length;
  const overall: BusinessHealth["overall"] = passCount >= 3 ? "Strong" : passCount >= 2 ? "Stable" : "Needs Attention";

  return {
    clientGrowthPct,
    revenueGrowthPct: kpis.revenueGrowthPct,
    renewalRatePct: subs.renewalRatePct,
    paymentSuccessPct: kpis.successRatePct,
    refundRatePct: kpis.refundsPctOfRevenue,
    coachUtilizationPct: avgUtilization,
    overall,
  };
}

export function financeInsights(): FinanceInsight[] {
  const insights: FinanceInsight[] = [];
  const failedToday = MOCK_PAYMENTS.filter((p) => p.status === "Failed" && daysBetween(p.createdAt) <= 1).length;
  const expiringSoon = subscriptionsSummary().expiringSoonCount;
  const overCapacity = coachFinancialPerformanceList().filter((c) => c.utilizationPct >= 90).length;
  const kpis = financeOverviewKpis();

  if (failedToday > 0) {
    insights.push({ id: "failed-today", tone: "warning", message: `${failedToday} payments failed in the last 24 hours`, actionLabel: "Review failed payments", actionPath: "/finance/payments" });
  }
  if (expiringSoon > 0) {
    insights.push({ id: "expiring-soon", tone: "warning", message: `${expiringSoon} client subscriptions expire within 14 days`, actionLabel: "View renewals", actionPath: "/finance/subscriptions" });
  }
  if (overCapacity > 0) {
    insights.push({ id: "over-capacity", tone: "warning", message: `${overCapacity} coach${overCapacity > 1 ? "es are" : " is"} above 90% capacity`, actionLabel: "Review coach allocation", actionPath: "/finance/coaches" });
  }
  if (kpis.revenueGrowthPct > 0) {
    insights.push({ id: "revenue-up", tone: "success", message: `Revenue is ${kpis.revenueGrowthPct.toFixed(1)}% higher than the previous month` });
  }
  const renewalRate = subscriptionsSummary().renewalRatePct;
  if (renewalRate > 0) {
    insights.push({ id: "renewal-rate", tone: "info", message: `Current renewal rate is ${renewalRate.toFixed(1)}%` });
  }
  return insights;
}
