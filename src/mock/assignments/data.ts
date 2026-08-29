import type { Assignment, AssignmentHistoryEntry } from "../../types/assignment";
import { MOCK_CLIENTS } from "../users/clientsData";
import { MOCK_COACHES } from "../coaches/data";
import { randomInt, daysAgo } from "../shared/utils";

const COACH_CAPACITY = 40;

/** Reconciles each coach's activeClients/availableSlots against the actual assigned-client count,
 * so the Coach List and the Assignments Dashboard never disagree on the same coach. */
MOCK_COACHES.forEach((coach) => {
  const actual = MOCK_CLIENTS.filter((c) => c.coachId === coach.id && c.status !== "Cancelled").length;
  coach.activeClients = actual;
  coach.availableSlots = Math.max(0, COACH_CAPACITY - actual);
});

export const MOCK_ASSIGNMENTS: Assignment[] = MOCK_CLIENTS.filter((c) => c.status !== "Cancelled").map((c, i) => ({
  id: `assign_${i}`,
  coachId: c.coachId,
  coachName: c.coachName,
  clientId: c.userId,
  clientName: c.clientName,
  planName: c.planName,
  assignedDate: c.startDate,
  status: "Active",
}));

const ACTIONS: AssignmentHistoryEntry["action"][] = ["Assigned", "Reassigned", "Removed"];

export const MOCK_ASSIGNMENT_HISTORY: AssignmentHistoryEntry[] = MOCK_ASSIGNMENTS.slice(0, 40).map((a, i) => ({
  ...a,
  action: ACTIONS[i % ACTIONS.length],
  previousCoachName: i % 3 === 1 ? "Amit Verma" : undefined,
  actionedAt: daysAgo(randomInt(1, 200)),
}));
