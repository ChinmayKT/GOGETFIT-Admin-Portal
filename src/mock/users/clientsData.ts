import type { Client } from "../../types/user";
import { MOCK_USERS } from "./data";
import { randomInt, daysAgo, daysFromNow } from "../shared/utils";

const COUPONS = ["WELCOME20", "FITJULY", "SUMMER15", null, null, "REFER10"];
const STATUSES: Client["status"][] = ["Active", "Active", "Active", "Pending Renewal", "Expired", "Cancelled"];

/**
 * A client is a registered user who has bought a plan — so the client list is
 * exactly the subscribed subset of MOCK_USERS, one row per user, never a
 * separately generated population.
 */
export const SUBSCRIBED_USERS = MOCK_USERS.filter((u) => u.coachId && u.planName);

function makeClient(user: (typeof MOCK_USERS)[number], index: number): Client {
  const enrolledOffset = randomInt(20, 300);
  const enrolledDate = daysAgo(enrolledOffset);
  const startDate = daysAgo(Math.max(0, enrolledOffset - randomInt(0, 7)));
  const status = STATUSES[index % STATUSES.length];

  return {
    id: `client_${index}`,
    userId: user.id,
    clientName: `${user.firstName} ${user.lastName}`,
    coachId: user.coachId!,
    coachName: user.coachName!,
    planName: user.planName!,
    couponCode: COUPONS[index % COUPONS.length],
    transactionId: `TXN${randomInt(100000, 999999)}`,
    status,
    email: user.email,
    phone: user.phone,
    enrolledDate,
    startDate,
    endDate: status === "Expired" ? daysAgo(randomInt(1, 30)) : daysFromNow(randomInt(10, 180)),
    ggfId: user.ggfId,
    renewalCode: status === "Pending Renewal" ? `RNW${randomInt(1000, 9999)}` : null,
    brandAmbassadorCode: index % 7 === 0 ? `BA${randomInt(100, 999)}` : null,
  };
}

export const MOCK_CLIENTS: Client[] = SUBSCRIBED_USERS.map(makeClient);
