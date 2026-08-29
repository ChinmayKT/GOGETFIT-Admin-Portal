/** Shared shapes for the Analytics workspace (`operations/analytics`). Aggregation functions
 * live in `src/mock/analytics/data.ts` and return these — kept here so section components
 * and the mock layer agree on a single contract. KPI aggregates are returned as raw numbers
 * (matching `dashboardKpis()` in `src/mock/dashboard/data.ts`) and formatted by the section
 * component at render time via `MetricCard` + `src/utils/format.ts`. */

/** One point in a month/day-labelled time series feeding LineChart/BarChart (`xKey` + series keys). */
export type AnalyticsSeriesPoint = Record<string, string | number>;

/** One labelled slice/bar feeding DonutChart or a single-series BarChart. */
export interface AnalyticsCategoryValue {
  label: string;
  value: number;
}
