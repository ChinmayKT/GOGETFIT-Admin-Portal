export type Gender = "Male" | "Female" | "Other";
export type UserStatus = "Active" | "Inactive" | "Pending";
export type FitnessGoal = "Fat Loss" | "Muscle Gain" | "Body Recomposition" | "General Fitness" | "Strength" | "Endurance";

export interface AppUser {
  id: string;
  ggfId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  userType: "User" | "Admin";
  dob: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  address: string;

  heightCm: number;
  weightKg: number;
  waistCm: number;
  neckCm: number;
  hipsCm: number;
  bodyFatPct: number;
  bmr: number;
  tdee: number;

  goal: FitnessGoal;
  coachId: string | null;
  coachName: string | null;
  planName: string | null;
  status: UserStatus;
  streakDays: number;

  joinedAt: string;
  lastActiveAt: string;
}

export interface Client {
  id: string;
  userId: string;
  clientName: string;
  coachId: string;
  coachName: string;
  planName: string;
  couponCode: string | null;
  transactionId: string;
  status: "Active" | "Expired" | "Pending Renewal" | "Cancelled";
  email: string;
  phone: string;
  enrolledDate: string;
  startDate: string;
  endDate: string;
  ggfId: string;
  renewalCode: string | null;
  brandAmbassadorCode: string | null;
}
