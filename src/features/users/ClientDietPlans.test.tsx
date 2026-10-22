import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup, fireEvent, within, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { ClientDetailPage } from "./ClientDetailPage";
import { addDays, firstShownDay, initialDay, planOnDay } from "./ClientDietPlans";
import { tokenStore } from "../../api/client";
import type { AdminUser } from "../../types/admin";
import type { ClientDietPlan, ClientDietPlans, DietPlanFood } from "../../api/adminUsers";

const user: AdminUser = {
  id: "u1",
  phone: { raw: "6366192524", normalized: "916366192524" },
  profile: {
    name: "Jeevika",
    email: null,
    isEmailVerified: false,
    dateOfBirth: null,
    age: null,
    gender: null,
    city: null,
    profilePicture: null,
    freeDietPlanId: null,
    fitnessProfile: { height: null, weight: null, bodyFatPercentage: null, activityLevel: null, foodType: null, goal: null, bmr: 9999, tdee: 9999 },
  },
  profileCompleted: true,
  roles: ["user", "client"],
  status: "active",
  legacy: { source: "gogetfit", userId: 334 },
  createdAt: "2026-09-22T07:50:01.000Z",
  updatedAt: null,
};

const food = (overrides: Partial<DietPlanFood> = {}): DietPlanFood => ({
  foodId: "f1",
  food: { id: "f1", name: "White Bread", brand: "(Generic)", foodType: "Vegetarian", image: null, status: "active" },
  missingFood: false,
  qty: 2,
  portion: 1,
  servingUnit: "Piece",
  perPortion: { calories: 67, protein: 2.2, carbs: 12, fat: 0.8 },
  nutrition: { calories: 134, protein: 4.4, carbs: 24, fat: 1.6 },
  ...overrides,
});

const plan = (overrides: Partial<ClientDietPlan> = {}): ClientDietPlan => ({
  id: "d1",
  planId: "gogetfit:173",
  name: "Jeevika meal plan",
  fromDate: "2024-06-04",
  toDate: "2024-06-06",
  days: 3,
  period: "current",
  status: "active",
  assignedAt: "2024-06-03T10:00:00.000Z",
  coach: { id: "c1", name: "Prajwal", level: "LEVEL 1" },
  legacyCreatedBy: 187,
  enrollment: { id: "e1", planName: "12 WEEKS GOGETFIT PLAN", enrollDate: null, startDate: null, endDate: null, isDeleted: false },
  missingEnrollmentId: null,
  goal: "Fat/Weight Loss",
  bmr: 1369.93,
  tdee: 1883.65,
  targets: { calories: 1633, protein: 122, carbs: 204, fat: 36 },
  totals: { calories: 434, protein: 24.4, carbs: 64, fat: 11.6 },
  meals: [
    { meal: 1, label: "Meal 1", foods: [food()], totals: { calories: 134, protein: 4.4, carbs: 24, fat: 1.6 } },
    {
      meal: 3,
      label: "Meal 3",
      foods: [food({ foodId: "f2", food: { id: "f2", name: "Chicken Breast", brand: null, foodType: "Non-Vegetarian", image: null, status: "active" }, qty: 150, portion: 100, servingUnit: "Grams", perPortion: { calories: 200, protein: 13.3, carbs: 26.7, fat: 6.7 }, nutrition: { calories: 300, protein: 20, carbs: 40, fat: 10 } })],
      totals: { calories: 300, protein: 20, carbs: 40, fat: 10 },
    },
  ],
  legacyPlanId: 173,
  ...overrides,
});

/** Older plan 1..10 June, newer plan 4..6 June on top of it, gap after the 10th, a later run 13..13. */
const older = plan({ id: "d0", planId: "gogetfit:131", name: "Karthik era plan", fromDate: "2024-06-01", toDate: "2024-06-10", days: 10, coach: null, legacyCreatedBy: 332, enrollment: null, assignedAt: "2024-05-01T00:00:00.000Z", goal: "Muscle/Weight Gain", bmr: 1200, tdee: 1500, period: "current" });
const laterRun = plan({ id: "d2", fromDate: "2024-06-13", toDate: "2024-06-13", days: 1, period: "upcoming", enrollment: null });
const data = (overrides: Partial<ClientDietPlans> = {}): ClientDietPlans => ({
  client: { id: "u1", name: "Jeevika" },
  today: "2024-06-05",
  dietPlans: [plan(), laterRun, older],
  schedule: [
    { from: "2024-06-01", to: "2024-06-03", dietPlanId: "d0" },
    { from: "2024-06-04", to: "2024-06-06", dietPlanId: "d1" },
    { from: "2024-06-07", to: "2024-06-10", dietPlanId: "d0" },
    { from: "2024-06-13", to: "2024-06-13", dietPlanId: "d2" },
  ],
  missingFoodIds: [],
  ...overrides,
});

const ok = (payload: unknown) =>
  new Response(JSON.stringify({ success: true, data: payload }), { status: 200, headers: { "Content-Type": "application/json" } });
const requests: string[] = [];
const stub = (dietPlans: () => Response) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      requests.push(url);
      if (url.includes("/diet-plans")) return dietPlans();
      if (url.includes("/questionnaires")) return ok({ questionnaires: [], total: 0 });
      if (url.includes("/body-metrics")) return ok({ bodyMetrics: [], total: 0 });
      if (url.includes("/admin/users/")) return ok({ user });
      return ok({ enrolledClients: [], pagination: { page: 1, pageSize: 100, total: 0, totalPages: 1 } });
    }),
  );

const openTab = async () => {
  const router = createMemoryRouter([{ path: "/users/clients/:userId", element: <ClientDetailPage /> }], { initialEntries: ["/users/clients/u1"] });
  render(<RouterProvider router={router} />);
  fireEvent.click(await screen.findByRole("tab", { name: /Diet Plans/ }));
};

beforeEach(() => {
  requests.length = 0;
  tokenStore.set("t");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  tokenStore.clear();
});

describe("Client detail → Diet Plans", () => {
  it("loads the member's plans from the admin API and counts distinct plans on the tab", async () => {
    stub(() => ok(data()));
    await openTab();
    expect(requests.some((u) => u.endsWith("/admin/users/u1/diet-plans"))).toBe(true);
    // d1 and d2 are two runs of one plan; d0 is another plan.
    expect(screen.getByRole("tab", { name: /Diet Plans/ }).textContent).toContain("2");
  });

  it("the plan list has one entry per plan - the tab's count - with its date ranges inside", async () => {
    stub(() => ok(data()));
    await openTab();
    await screen.findAllByText("Jeevika meal plan");

    const options = within(screen.getByLabelText("Diet plan")).getAllByRole("option").filter((o) => !(o as HTMLOptionElement).disabled);
    expect(options).toHaveLength(2);
    expect(screen.getByRole("tab", { name: /Diet Plans/ }).textContent).toBe("Diet Plans2");
    expect(options[0].textContent).toBe("Jeevika meal plan · 04/06/2024 → 13/06/2024 · 2 date ranges · Current · Prajwal");
    expect(options[1].textContent).toBe("Karthik era plan · 01/06/2024 → 10/06/2024 · Current");
    expect(screen.getByText(/2 plans over 3 date ranges/)).toBeTruthy();

    // The plan's runs are listed on the plan; picking one moves to it.
    const runs = within(screen.getByLabelText("Date ranges")).getAllByRole("button");
    expect(runs.map((b) => [b.textContent, b.getAttribute("aria-pressed")])).toEqual([
      ["04/06/2024 → 06/06/2024", "true"],
      ["13/06/2024 → 13/06/2024", "false"],
    ]);
    fireEvent.click(runs[1]);
    expect((screen.getByLabelText("Day") as HTMLInputElement).value).toBe("2024-06-13");
    expect((screen.getByLabelText("Diet plan") as HTMLSelectElement).value).toBe("gogetfit:173");
  });

  it("opens on today's plan with its header, snapshot, targets, meals and foods", async () => {
    stub(() => ok(data()));
    await openTab();

    expect((await screen.findAllByText("Jeevika meal plan")).length).toBeGreaterThan(0);
    expect((screen.getByLabelText("Day") as HTMLInputElement).value).toBe("2024-06-05");
    expect(screen.getByText(/04\/06\/2024 → 06\/06\/2024 · 3 days · Coach Prajwal · Enrollment 12 WEEKS GOGETFIT PLAN/)).toBeTruthy();
    const snapshot = screen.getByLabelText("Plan snapshot");
    // The plan's own snapshot, not the profile's 9999.
    expect(within(snapshot).getByText("1370 kcal")).toBeTruthy();
    expect(within(snapshot).getByText("1884 kcal")).toBeTruthy();
    expect(within(snapshot).getByText("Fat/Weight Loss")).toBeTruthy();
    expect(screen.getByText("/ 1633 kcal")).toBeTruthy();
    expect(screen.getByText("27%")).toBeTruthy(); // 434 of 1633 kcal planned

    expect(screen.getByText("Meal 1")).toBeTruthy();
    expect(screen.getByText("Meal 3")).toBeTruthy();
    expect(screen.queryByText("Meal 2")).toBeNull();
    expect(screen.getByText("White Bread")).toBeTruthy();
    expect(screen.getByText("2 Piece")).toBeTruthy();
    expect(screen.getByText("150 Grams")).toBeTruthy();
    expect(screen.getByText("134.0")).toBeTruthy();
    const bread = screen.getByRole("article", { name: "White Bread" });
    expect(within(bread).getByLabelText("F 1.6 g · C 24.0 g · P 4.4 g")).toBeTruthy();
    expect(within(bread).getByText("1.6g")).toBeTruthy();
    const per = within(bread).getByText("Per 1 Piece: 67.0 kcal");
    expect(per.getAttribute("title")).toBe("The plan's frozen values for 1 Piece: 67.0 kcal · F 0.8 g · C 12.0 g · P 2.2 g");
    expect(screen.getByLabelText("Non-vegetarian")).toBeTruthy();
  });

  it("moving through days follows the schedule: newer plan, older plan, then a gap", async () => {
    stub(() => ok(data()));
    await openTab();
    await screen.findAllByText("Jeevika meal plan");

    fireEvent.click(screen.getByRole("button", { name: "Next day" })); // 06
    fireEvent.click(screen.getByRole("button", { name: "Next day" })); // 07 -> older plan
    expect((screen.getByLabelText("Day") as HTMLInputElement).value).toBe("2024-06-07");
    expect(screen.getAllByText("Karthik era plan").length).toBeGreaterThan(0);
    expect(screen.getByText(/Coach Not linked \(legacy creator #332\) · No enrollment/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Day"), { target: { value: "2024-06-11" } });
    expect(screen.getByText("No diet plan on 11/06/2024")).toBeTruthy();
    expect(screen.queryByText("Meal 1")).toBeNull();
  });

  it("choosing a plan opens it on a day the member sees it; a hidden day is called out", async () => {
    stub(() => ok(data()));
    await openTab();
    await screen.findAllByText("Jeevika meal plan");

    fireEvent.change(screen.getByLabelText("Diet plan"), { target: { value: "gogetfit:131" } });
    expect((screen.getByLabelText("Day") as HTMLInputElement).value).toBe("2024-06-01");

    // Fully hidden plan: opens on its first day with a notice naming what the member sees.
    const hidden = plan({ id: "h", planId: "gogetfit:9", name: "Hidden plan", fromDate: "2024-06-04", toDate: "2024-06-05", assignedAt: "2024-01-01T00:00:00.000Z" });
    cleanup();
    stub(() => ok(data({ dietPlans: [plan(), hidden] , schedule: [{ from: "2024-06-04", to: "2024-06-06", dietPlanId: "d1" }] })));
    await openTab();
    await screen.findAllByText("Jeevika meal plan");
    fireEvent.change(screen.getByLabelText("Diet plan"), { target: { value: "gogetfit:9" } });
    expect(screen.getByRole("note").textContent).toContain("the member sees “Jeevika meal plan”");
  });

  it("shows an empty state when the member has no diet plan", async () => {
    stub(() => ok(data({ dietPlans: [], schedule: [] })));
    await openTab();
    expect(await screen.findByText("No diet plans")).toBeTruthy();
  });

  it("shows an error state with retry when the API fails", async () => {
    let calls = 0;
    stub(() => {
      calls += 1;
      return calls === 1 ? new Response(JSON.stringify({ success: false, error: { code: "X", message: "boom" } }), { status: 500 }) : ok(data());
    });
    await openTab();
    expect(await screen.findByText("Something went wrong")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /retry|try again/i }));
    await waitFor(() => expect(screen.getAllByText("Jeevika meal plan").length).toBeGreaterThan(0));
  });

  it("each food is one row: the Food's image, identity, quantity and the plan's numbers", async () => {
    const withImage = food({ food: { id: "f1", name: "White Bread", brand: "(Generic)", foodType: "Vegetarian", image: { url: "http://localhost:3000/uploads/foods/f1/bread.jpg", storageKey: "k" }, status: "active" } });
    stub(() => ok(data({ dietPlans: [plan({ meals: [{ meal: 1, label: "Meal 1", foods: [withImage, food({ foodId: "f9", food: { id: "f9", name: "Plain Curd", brand: null, foodType: "Vegetarian", image: null, status: "active" }, qty: 100, portion: 100, servingUnit: "Grams" })], totals: { calories: 268, protein: 8.8, carbs: 48, fat: 3.2 } }] })], schedule: [{ from: "2024-06-04", to: "2024-06-06", dietPlanId: "d1" }] })));
    await openTab();
    await screen.findAllByText("Jeevika meal plan");

    const rows = screen.getAllByRole("article");
    expect(rows.map((r) => r.getAttribute("aria-label"))).toEqual(["White Bread", "Plain Curd"]);
    const bread = rows[0];
    const img = within(bread).getByRole("img", { name: "White Bread" }) as HTMLImageElement;
    expect(img.src).toContain("/uploads/foods/f1/bread.jpg");
    expect(within(bread).getByText("(Generic)")).toBeTruthy();
    expect(within(bread).getByText("2 Piece")).toBeTruthy();
    expect(within(bread).getByText("134.0")).toBeTruthy();
    expect(within(bread).getByText("1.6g")).toBeTruthy();
    expect(within(bread).getByText("24.0g")).toBeTruthy();
    expect(within(bread).getByText("4.4g")).toBeTruthy();
    expect(screen.getByText("268.0 kcal · F 3.2 g · C 48.0 g · P 8.8 g")).toBeTruthy(); // meal totals unchanged

    // No image on the Food: the placeholder glyph, never a broken image.
    expect(within(rows[1]).getByLabelText("No image")).toBeTruthy();
    // A picture that fails to load falls back to the same glyph.
    fireEvent.error(img);
    expect(within(bread).getByLabelText("No image")).toBeTruthy();
    expect(within(bread).queryByRole("img", { name: "White Bread" })).toBeNull();
  });

  it("a plan with no meals and a missing food reference are shown, not hidden", async () => {
    const missing = food({ foodId: "gone", food: null, missingFood: true, servingUnit: "Bowl" });
    stub(() => ok(data({ dietPlans: [plan({ meals: [{ meal: 2, label: "Meal 2", foods: [missing], totals: missing.nutrition }] }), plan({ id: "e", planId: "gogetfit:5", name: "Empty plan", fromDate: "2024-06-20", toDate: "2024-06-20", meals: [] })], schedule: [{ from: "2024-06-04", to: "2024-06-06", dietPlanId: "d1" }, { from: "2024-06-20", to: "2024-06-20", dietPlanId: "e" }], missingFoodIds: ["gone"] })));
    await openTab();
    expect(await screen.findByText("Food not found")).toBeTruthy();
    expect(screen.getByText(/Reference gone no longer exists/)).toBeTruthy();
    expect(screen.getByText(/1 food reference\(s\) missing/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Day"), { target: { value: "2024-06-20" } });
    expect(screen.getByText("No meals in this plan")).toBeTruthy();
  });
});

describe("diet plan day helpers", () => {
  const d = data();
  it("planOnDay reads the server schedule and leaves gaps empty", () => {
    expect(planOnDay(d.schedule, "2024-06-05")).toBe("d1");
    expect(planOnDay(d.schedule, "2024-06-08")).toBe("d0");
    expect(planOnDay(d.schedule, "2024-06-11")).toBeNull();
  });
  it("firstShownDay and initialDay", () => {
    expect(firstShownDay(d.schedule, "d0")).toBe("2024-06-01");
    expect(firstShownDay(d.schedule, "zz")).toBeNull();
    expect(initialDay(d)).toBe("2024-06-05");
    expect(initialDay(data({ today: "2024-07-01" }))).toBe("2024-06-13");
    expect(initialDay(data({ today: "2024-05-01" }))).toBe("2024-06-01");
    expect(addDays("2024-02-28", 2)).toBe("2024-03-01");
  });
});
