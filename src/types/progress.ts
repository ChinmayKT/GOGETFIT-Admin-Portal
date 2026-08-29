export type TransformationStatus = "Pending Review" | "Approved" | "Changes Requested" | "Rejected" | "Published";

export interface Transformation {
  id: string;
  userId: string;
  ggfId: string;
  userName: string;
  title: string;
  description: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  status: TransformationStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
}

export interface MeasurementEntry {
  date: string;
  weightKg: number;
  waistCm: number;
  chestCm: number;
  hipsCm: number;
  bodyFatPct: number;
}

export interface UserMeasurementHistory {
  userId: string;
  ggfId: string;
  userName: string;
  history: MeasurementEntry[];
}
