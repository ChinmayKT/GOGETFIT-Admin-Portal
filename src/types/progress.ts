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
