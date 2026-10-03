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
  coverPhoto: string | null;

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

/*
 * ---------------------------------------------------------------------------
 * Real coach profiles from the Node backend (/api/admin/coaches).
 *
 * A coach is an existing User plus a Coach document holding only coach-specific
 * fields. Name, phone, email, gender and city are never stored
 * on the coach - they arrive as the joined, read-only `user` summary.
 *
 * The mock `Coach` above is still used by the Finance and Assignments screens,
 * which have not moved to the backend yet.
 * ---------------------------------------------------------------------------
 */

/** Coach tiers, matching the backend's COACH_LEVELS. */
export const COACH_PROFILE_LEVELS = ["LEVEL 1", "LEVEL 2", "LEVEL 3", "LEVEL 4", "LEVEL 5"] as const;
export type CoachProfileLevel = (typeof COACH_PROFILE_LEVELS)[number];

export type CoachProfileStatus = "active" | "inactive";

export interface CoachUserSummary {
  id: string;
  name: string | null;
  /** Normalized digits, e.g. "919876543210". */
  phone: string | null;
  email: string | null;
  gender: "male" | "female" | null;
  city: string | null;
  profilePicture: string | null;
  roles: string[];
  status: string | null;
}

/** A stored image reference. Only this is kept in MongoDB, never the bytes. */
export interface CoachImage {
  url: string;
  storageKey: string | null;
}

export type CoachImageSlot = "profilePicture" | "coverPicture";

export interface CoachProfile {
  /** The coach's own photo - NOT the user's avatar (user.profilePicture). */
  profilePicture: CoachImage | null;
  coverPicture: CoachImage | null;
  level: CoachProfileLevel;
  specialization: string | null;
  description: string | null;
  languages: string[];
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  transformations: number | null;
  availableSlots: number | null;
}

export interface CoachRecord {
  id: string;
  userId: string;
  /** Null only if the linked user has been removed. */
  user: CoachUserSummary | null;
  profile: CoachProfile;
  status: CoachProfileStatus;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
