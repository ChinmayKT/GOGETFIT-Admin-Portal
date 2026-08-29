import { MOCK_USERS } from "../users/data";
import { MOCK_COACHES } from "../coaches/data";
import { MOCK_CLIENTS } from "../users/clientsData";
import { revenueMTD } from "../orders/repository";
import { randomInt } from "../shared/utils";

export function dashboardKpis() {
  const activeCoaches = MOCK_COACHES.filter((c) => c.status === "Active").length;
  const activePlans = new Set(MOCK_CLIENTS.filter((c) => c.status === "Active").map((c) => c.planName)).size;
  return {
    totalUsers: MOCK_USERS.length,
    activeCoaches,
    activePlans,
    revenueMTD: revenueMTD(),
  };
}

export function userGrowthSeries() {
  const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  let base = 60;
  return months.map((month) => {
    base += randomInt(8, 22);
    return { month, "New Users": randomInt(15, 35), "Active Users": base };
  });
}

export function planOverview() {
  const counts = { Active: 0, Completed: 0, Pending: 0, Expired: 0 };
  MOCK_CLIENTS.forEach((c) => {
    if (c.status === "Active") counts.Active++;
    else if (c.status === "Expired") counts.Expired++;
    else if (c.status === "Pending Renewal") counts.Pending++;
    else counts.Completed++;
  });
  return Object.entries(counts).map(([label, value]) => ({ label, value }));
}

export function recentUsers(limit = 5) {
  return [...MOCK_USERS].sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()).slice(0, limit);
}
