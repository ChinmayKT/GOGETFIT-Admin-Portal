export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  group: "Users" | "Coaches" | "Plans" | "Food" | "Workouts" | "Challenges" | "Orders" | "Articles";
  path: string;
}

/** Placeholder index — replaced by a live aggregation once each module's mock repository ships. */
export const SEARCH_INDEX: SearchResult[] = [
  { id: "u1", title: "Rahul Sharma", subtitle: "GGF10042 · Fat Loss", group: "Users", path: "/users/u1" },
  { id: "u2", title: "Priya Rao", subtitle: "GGF10091 · Muscle Gain", group: "Users", path: "/users/u2" },
  { id: "c1", title: "Karthik Nair", subtitle: "Level 4 Coach · Bengaluru", group: "Coaches", path: "/coaches/c1" },
  { id: "p1", title: "Fat Loss — Advanced", subtitle: "1500–1800 kcal · Veg-Egg", group: "Plans", path: "/nutrition/diets/p1" },
  { id: "f1", title: "Grilled Chicken Breast", subtitle: "Non-Vegetarian · 165 kcal", group: "Food", path: "/nutrition/foods/f1" },
  { id: "w1", title: "Barbell Back Squat", subtitle: "Gym · Legs", group: "Workouts", path: "/fitness/workouts/w1" },
  { id: "ch1", title: "30-Day Transformation Challenge", subtitle: "Active · 214 participants", group: "Challenges", path: "/challenges/ch1" },
  { id: "o1", title: "Order #10234", subtitle: "Priya Rao · ₹2,499", group: "Orders", path: "/commerce/orders/o1" },
  { id: "a1", title: "5 Habits of Consistent Lifters", subtitle: "Published · Aug 2026", group: "Articles", path: "/content/articles/a1" },
];

export function searchAll(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return SEARCH_INDEX.filter((r) => r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q));
}
