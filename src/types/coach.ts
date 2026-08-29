export type CoachLevel = 1 | 2 | 3 | 4 | 5;
export type CoachStatus = "Active" | "Pending Approval" | "Inactive";

export interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  gender: "Male" | "Female" | "Other";
  email: string;
  phone: string;
  languages: string[];
  city: string;
  state: string;
  country: string;
  profilePicture: string | null;

  level: CoachLevel;
  specialization: string;
  description: string;
  transformationsCount: number;
  availableSlots: number;
  activeClients: number;
  pendingClients: number;
  status: CoachStatus;

  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;

  certificates: { id: string; fileName: string; uploadedAt: string }[];

  joinedAt: string;
}
