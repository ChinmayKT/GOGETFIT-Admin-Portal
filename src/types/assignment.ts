export interface Assignment {
  id: string;
  coachId: string;
  coachName: string;
  clientId: string;
  clientName: string;
  planName: string;
  assignedDate: string;
  status: "Active" | "Reassigned" | "Removed";
}

export interface AssignmentHistoryEntry extends Assignment {
  action: "Assigned" | "Reassigned" | "Removed";
  previousCoachName?: string;
  actionedAt: string;
}
