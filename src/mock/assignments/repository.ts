import type { Assignment } from "../../types/assignment";
import { MOCK_ASSIGNMENTS, MOCK_ASSIGNMENT_HISTORY } from "./data";
import { MOCK_COACHES } from "../coaches/data";
import { delay, nextId, daysAgo } from "../shared/utils";

let store: Assignment[] = [...MOCK_ASSIGNMENTS];
let history = [...MOCK_ASSIGNMENT_HISTORY];

export async function listAssignments() {
  return delay(store, 350);
}

export async function listAssignmentHistory() {
  return delay(history, 350);
}

export function coachCapacitySummary() {
  return MOCK_COACHES.map((c) => ({
    coachId: c.id,
    coachName: `${c.firstName} ${c.lastName}`,
    activeClients: store.filter((a) => a.coachId === c.id && a.status === "Active").length,
    availableSlots: c.availableSlots,
    level: c.level,
  }));
}

export async function reassignClient(assignmentId: string, newCoachId: string, newCoachName: string) {
  const current = store.find((a) => a.id === assignmentId);
  if (current) {
    history = [
      {
        ...current,
        action: "Reassigned",
        previousCoachName: current.coachName,
        actionedAt: new Date().toISOString(),
      },
      ...history,
    ];
  }
  store = store.map((a) => (a.id === assignmentId ? { ...a, coachId: newCoachId, coachName: newCoachName } : a));
  return delay(store.find((a) => a.id === assignmentId)!, 600);
}

export async function removeAssignment(assignmentId: string) {
  const current = store.find((a) => a.id === assignmentId);
  if (current) {
    history = [{ ...current, action: "Removed", actionedAt: new Date().toISOString() }, ...history];
  }
  store = store.map((a) => (a.id === assignmentId ? { ...a, status: "Removed" } : a));
  return delay(true, 500);
}

export async function assignClient(clientId: string, clientName: string, coachId: string, coachName: string, planName: string) {
  const assignment: Assignment = {
    id: nextId("assign"),
    coachId,
    coachName,
    clientId,
    clientName,
    planName,
    assignedDate: daysAgo(0),
    status: "Active",
  };
  store = [assignment, ...store];
  history = [{ ...assignment, action: "Assigned", actionedAt: new Date().toISOString() }, ...history];
  return delay(assignment, 600);
}
