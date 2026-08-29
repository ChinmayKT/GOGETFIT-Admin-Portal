import type { Client } from "../../types/user";
import { MOCK_USERS } from "./data";
import { randomInt, daysAgo, daysFromNow } from "../shared/utils";

const COUPONS = ["WELCOME20", "FITJULY", "SUMMER15", null, null, "REFER10"];
const STATUSES: Client["status"][] = ["Active", "Active", "Active", "Pending Renewal", "Expired", "Cancelled"];

function makeClient(index: number): Client {
  const user = MOCK_USERS.filter((u) => u.coachId)[index % MOCK_USERS.filter((u) => u.coachId).length];
  const startDate = daysAgo(randomInt(20, 300));
  const status = STATUSES[index % STATUSES.length];

  return {
    id: `client_${index}`,
    userId: user.id,
    clientName: `${user.firstName} ${user.lastName}`,
    coachId: user.coachId!,
    coachName: user.coachName!,
    planName: user.planName ?? "Fat Loss — Starter",
    couponCode: COUPONS[index % COUPONS.length],
    transactionId: `TXN${randomInt(100000, 999999)}`,
    status,
    email: user.email,
    phone: user.phone,
    enrolledDate: startDate,
    startDate,
    endDate: status === "Expired" ? daysAgo(randomInt(1, 30)) : daysFromNow(randomInt(10, 180)),
    ggfId: user.ggfId,
    renewalCode: status === "Pending Renewal" ? `RNW${randomInt(1000, 9999)}` : null,
    brandAmbassadorCode: index % 7 === 0 ? `BA${randomInt(100, 999)}` : null,
  };
}

export const MOCK_CLIENTS: Client[] = Array.from({ length: 96 }, (_, i) => makeClient(i));
