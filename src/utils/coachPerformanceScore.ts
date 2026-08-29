import type { CoachPerformanceBreakdown, CoachTier } from "../types/finance";

export interface CoachScoreInputs {
  revenue: number;
  maxRevenue: number;
  newClients: number;
  maxNewClients: number;
  retentionPct: number;
  transformationsCount: number;
  activeClients: number;
}

export interface CoachScoreResult {
  overall: number;
  breakdown: CoachPerformanceBreakdown;
  tier: CoachTier;
}

/**
 * Composite coach performance score — deliberately not just revenue.
 * Kept isolated so a future backend can supply these numbers directly
 * without the UI layer changing.
 */
export function computeCoachPerformanceScore(inputs: CoachScoreInputs): CoachScoreResult {
  const revenueScore = inputs.maxRevenue > 0 ? Math.round((inputs.revenue / inputs.maxRevenue) * 100) : 0;
  const acquisitionScore = inputs.maxNewClients > 0 ? Math.round((inputs.newClients / inputs.maxNewClients) * 100) : 0;
  const retentionScore = Math.round(inputs.retentionPct);
  const engagementScore = Math.min(100, Math.round(inputs.transformationsCount * 2 + inputs.activeClients * 0.5));

  const overall = Math.round(revenueScore * 0.35 + acquisitionScore * 0.25 + retentionScore * 0.25 + engagementScore * 0.15);
  const tier: CoachTier = overall >= 90 ? "Excellent" : overall >= 80 ? "Strong" : overall >= 65 ? "Good" : "Needs Attention";

  return {
    overall,
    breakdown: { revenue: revenueScore, acquisition: acquisitionScore, retention: retentionScore, engagement: engagementScore },
    tier,
  };
}
