/**
 * Food Database multi-level nutrition sort: the rules the Sort By drawer edits,
 * in priority order. The server applies them (GET /api/admin/foods?sort=...),
 * so the order covers every matching food before paging, never one page.
 */

export const SORT_METRICS = [
  { value: "calories", label: "Calories", short: "Calories" },
  { value: "protein", label: "Protein (g)", short: "Protein" },
  { value: "carbs", label: "Carbs (g)", short: "Carbs" },
  { value: "fat", label: "Fat (g)", short: "Fat" },
] as const;

export type SortMetric = (typeof SORT_METRICS)[number]["value"];
export type SortDirection = "asc" | "desc";

export interface SortRule {
  metric: SortMetric;
  direction: SortDirection;
}

/** "none" leaves a nutrient out of the sort. */
export type SortChoice = SortDirection | "none";

export const SORT_CHOICES: { value: SortChoice; label: string }[] = [
  { value: "none", label: "None" },
  { value: "desc", label: "High to low" },
  { value: "asc", label: "Low to high" },
];

/** One row of the drawer: every nutrient is always listed, in priority order. */
export interface SortRow {
  metric: SortMetric;
  choice: SortChoice;
}

/** The drawer's rows for [applied]: its rules first, in order, then the other nutrients as None. */
export const toRows = (applied: SortRule[] | null): SortRow[] => [
  ...(applied ?? []).map((r) => ({ metric: r.metric, choice: r.direction })),
  ...SORT_METRICS.filter((m) => !applied?.some((r) => r.metric === m.value)).map((m) => ({
    metric: m.value,
    choice: "none" as const,
  })),
];

/** The rules the rows ask for: the nutrients not set to None, top to bottom. */
export const toRules = (rows: SortRow[]): SortRule[] =>
  rows.flatMap((r) => (r.choice === "none" ? [] : [{ metric: r.metric, direction: r.choice }]));

export const metricInfo = (value: SortMetric) => SORT_METRICS.find((m) => m.value === value)!;

/** The API's `sort` parameter: `calories:desc,protein:asc`, in priority order. */
export const toSortParam = (rules: SortRule[]) => rules.map((r) => `${r.metric}:${r.direction}`).join(",");

/** "Calories ↓ → Protein ↓ → Fat ↑", from the rules as configured. */
export const describeRules = (rules: SortRule[]) =>
  rules.map((r) => `${metricInfo(r.metric).short} ${r.direction === "desc" ? "↓" : "↑"}`).join(" → ");

/** The list with the rule at [from] moved to [to]. */
export const moveRule = <T,>(rules: T[], from: number, to: number): T[] => {
  if (from === to || to < 0 || to >= rules.length) return rules;
  const next = [...rules];
  const [rule] = next.splice(from, 1);
  next.splice(to, 0, rule);
  return next;
};
