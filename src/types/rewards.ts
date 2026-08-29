export interface RewardTransaction {
  id: string;
  userId: string;
  ggfId: string;
  userName: string;
  points: number;
  description: string;
  date: string;
  issuedBy: string;
}

export interface RewardRule {
  id: string;
  name: string;
  points: number;
  description: string;
}

export interface Badge {
  id: string;
  name: string;
  criteria: string;
  color: string;
  earnedCount: number;
}

export interface LeaderboardEntry {
  userId: string;
  ggfId: string;
  name: string;
  totalPoints: number;
  rank: number;
}
