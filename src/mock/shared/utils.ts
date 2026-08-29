let seedCounter = 1;

export function nextId(prefix: string): string {
  return `${prefix}_${(seedCounter++).toString(36)}`;
}

/** Simulates network latency so loading states are exercised even with local data. */
export function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function paginate<T>(rows: T[], page: number, pageSize: number): { rows: T[]; total: number } {
  const start = (page - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total: rows.length };
}

export function sortRows<T>(rows: T[], key: keyof T | string, dir: "asc" | "desc"): T[] {
  const sorted = [...rows].sort((a, b) => {
    const av = (a as Record<string, unknown>)[key as string];
    const bv = (b as Record<string, unknown>)[key as string];
    if (av == null || bv == null) return 0;
    if (typeof av === "number" && typeof bv === "number") return av - bv;
    return String(av).localeCompare(String(bv));
  });
  return dir === "asc" ? sorted : sorted.reverse();
}

export function matchesQuery(haystack: (string | undefined | null)[], query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return haystack.some((h) => h?.toLowerCase().includes(q));
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

export function pickMany<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < count && copy.length; i++) {
    out.push(copy.splice(randomInt(0, copy.length - 1), 1)[0]);
  }
  return out;
}

export function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
