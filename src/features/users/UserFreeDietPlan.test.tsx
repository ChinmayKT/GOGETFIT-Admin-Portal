import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup, fireEvent, within, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { UserDetailPage } from "./UserDetailPage";
import { ClientDetailPage } from "./ClientDetailPage";
import { tokenStore } from "../../api/client";
import type { UserFreeDietPlan } from "../../api/adminUsers";

const fitness = { height: 176.8, weight: 66.3, bodyFatPercentage: 15, activityLevel: "sedentary", foodType: "nonVegetarian", goal: "maintainPhysique", bmr: 1648, tdee: 1977.6 };

const user = {
  id: "u1",
  phone: { raw: "8123260930", normalized: "918123260930" },
  profile: {
    name: "Prajwal",
    email: null,
    isEmailVerified: false,
    dateOfBirth: null,
    age: 25,
    gender: "male",
    city: null,
    profilePicture: null,
    freeDietPlanId: "p1",
    fitnessProfile: fitness,
  },
  profileCompleted: true,
  roles: ["user"],
  status: "active",
  legacy: null,
  createdAt: null,
  updatedAt: null,
};

const assigned = (overrides: Partial<UserFreeDietPlan> = {}): UserFreeDietPlan => ({
  user: { id: "u1", name: "Prajwal" },
  status: "assigned",
  fitness,
  missing: [],
  match: { dietType: "Veg/NonVeg", targetCalories: 1987.6, lookupCalories: 1988 },
  freeDietPlanId: "p1",
  freeDietPlan: {
    id: "p1",
    dietType: "Veg/NonVeg",
    range: { from: 1981, to: 1990 },
    mealCount: 2,
    foodCount: 3,
    status: "active",
    legacyPlanId: 409,
    meals: [
      { mealId: 1, foods: [{ legacyPlanMealId: 1, foodName: "Oats", foodType: null, unit: "grams", quantity: 40, calories: 150, fat: 3, carbs: 27, protein: 5 }] },
      {
        mealId: 2,
        foods: [
          { legacyPlanMealId: 2, foodName: "Chicken breast", foodType: null, unit: "grams", quantity: 150, calories: 248, fat: 5.4, carbs: 0, protein: 46.5 },
          { legacyPlanMealId: 3, foodName: "Rice", foodType: null, unit: "bowl", quantity: 1, calories: 200, fat: 0.4, carbs: 44, protein: 4.2 },
        ],
      },
    ],
    totals: { calories: 598, fat: 8.8, carbs: 71, protein: 55.7 },
  },
  planMatchesProfile: true,
  ...overrides,
});

const ok = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { "Content-Type": "application/json" } });
const requests: string[] = [];
const stub = (freePlan: () => Response | Promise<Response>) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      requests.push(url);
      if (url.includes("/free-diet-plan")) return freePlan();
      if (url.includes("/diet-plans")) return ok({ client: { id: "u1", name: "Prajwal" }, today: "2026-10-07", dietPlans: [], schedule: [], missingFoodIds: [] });
      if (url.includes("/workout-plans")) return ok({ client: { id: "u1", name: "Prajwal" }, today: "2026-10-07", timezone: "Asia/Kolkata", workoutPlans: [] });
      if (url.includes("/questionnaires")) return ok({ questionnaires: [], total: 0 });
      if (url.includes("/body-metrics")) return ok({ bodyMetrics: [], total: 0 });
      if (url.includes("/admin/users/")) return ok({ user });
      return ok({ enrolledClients: [], pagination: { page: 1, pageSize: 100, total: 0, totalPages: 1 } });
    }),
  );

const openUserTab = async () => {
  render(<RouterProvider router={createMemoryRouter([{ path: "/users/:id", element: <UserDetailPage /> }], { initialEntries: ["/users/u1"] })} />);
  fireEvent.click(await screen.findByRole("tab", { name: "Free Diet Plan" }));
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

describe("User details → Free Diet Plan", () => {
  it("is its own tab, loads from the admin endpoint, and shows BMR, TDEE, target and range", async () => {
    stub(() => ok(assigned()));
    await openUserTab();
    expect(requests.some((u) => u.endsWith("/admin/users/u1/free-diet-plan"))).toBe(true);

    const snapshot = await screen.findByLabelText("Fitness snapshot");
    expect(within(snapshot).getByText("1,648 kcal/day")).toBeTruthy();
    expect(within(snapshot).getByText("1,978 kcal/day")).toBeTruthy();
    expect(within(snapshot).getByText("1,988 kcal/day")).toBeTruthy();
    expect(within(snapshot).getByText("1,981 – 1,990 kcal/day")).toBeTruthy();
    expect(within(snapshot).getByText("Maintain Physique")).toBeTruthy();
    expect(within(snapshot).getByText("Non-Vegetarian")).toBeTruthy();
    expect(within(snapshot).getByText("Sedentary")).toBeTruthy();
  });

  it("shows the assigned plan card and the full plan content", async () => {
    stub(() => ok(assigned()));
    await openUserTab();

    expect(await screen.findByText("Veg/NonVeg · 1,981 – 1,990 kcal")).toBeTruthy();
    expect(screen.getByText("2 meals · 3 foods · Legacy plan #409")).toBeTruthy();
    const nutrition = screen.getByLabelText("Plan nutrition");
    expect(within(nutrition).getByText("598 kcal")).toBeTruthy();
    expect(within(nutrition).getByText("55.7 g")).toBeTruthy();
    expect(screen.getByRole("link", { name: /View template in Free Diet Plans/ }).getAttribute("href")).toBe("/nutrition/freediets/p1");

    expect(screen.getByText("Meal 1")).toBeTruthy();
    expect(screen.getByText("Meal 2")).toBeTruthy();
    expect(screen.getByText("Chicken breast")).toBeTruthy();
    expect(screen.getByText("150 grams")).toBeTruthy();
    expect(screen.getByText("2 foods · 448 kcal")).toBeTruthy();
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("plan content is food rows, not a table - the template's own values, and no images", async () => {
    stub(() => ok(assigned()));
    await openUserTab();
    await screen.findByText("Meal 2");

    expect(screen.queryByRole("table")).toBeNull();
    const rows = screen.getAllByRole("article");
    expect(rows.map((r) => r.getAttribute("aria-label"))).toEqual(["Oats", "Chicken breast", "Rice"]);

    const chicken = screen.getByRole("article", { name: "Chicken breast" });
    expect(within(chicken).getByText("150 grams")).toBeTruthy();
    expect(within(chicken).getByText("248")).toBeTruthy();
    expect(within(chicken).getByLabelText("F 5.4 g · C 0 g · P 46.5 g")).toBeTruthy();
    expect(within(chicken).getByText("46.5g")).toBeTruthy();
    expect(within(chicken).getByText("5.4g")).toBeTruthy();
    expect(within(screen.getByRole("article", { name: "Rice" })).getByText("1 bowl")).toBeTruthy();
    expect(within(screen.getByRole("article", { name: "Rice" })).getByText("44g")).toBeTruthy();

    // Templates reference no Food: no picture and no placeholder glyph either.
    expect(screen.queryAllByRole("img")).toHaveLength(0);
    expect(screen.queryByLabelText("No image")).toBeNull();
  });

  it("flags a plan the profile no longer matches", async () => {
    stub(() => ok(assigned({ planMatchesProfile: false })));
    await openUserTab();
    expect((await screen.findByRole("note")).textContent).toContain("profile changed after this plan was assigned");
  });

  it("incomplete: no plan is shown, only what is missing", async () => {
    stub(() =>
      ok(assigned({
        status: "incomplete",
        fitness: { ...fitness, goal: null, foodType: null },
        missing: [{ field: "profile.fitnessProfile.foodType", label: "Food type" }, { field: "profile.fitnessProfile.goal", label: "Goal" }],
        match: { dietType: null, targetCalories: null, lookupCalories: null },
        freeDietPlanId: null,
        freeDietPlan: null,
        planMatchesProfile: null,
      })),
    );
    await openUserTab();
    expect(await screen.findByText("Free Diet Plan not available")).toBeTruthy();
    expect(screen.getByText("Complete the required fitness information to generate a free diet plan.")).toBeTruthy();
    const missing = screen.getByLabelText("Missing information");
    expect(within(missing).getByText("Food type")).toBeTruthy();
    expect(within(missing).getByText("Goal")).toBeTruthy();
    expect(within(screen.getByLabelText("Fitness snapshot")).getByText("1,648 kcal/day")).toBeTruthy();
    expect(screen.queryByText("Meal 1")).toBeNull();
    expect(screen.queryByLabelText("Plan nutrition")).toBeNull();
  });

  it("not assigned: the target is shown, and no plan is invented", async () => {
    stub(() => ok(assigned({ status: "not_assigned", freeDietPlanId: null, freeDietPlan: null, planMatchesProfile: null })));
    await openUserTab();
    expect(await screen.findByText("Free Diet Plan not assigned")).toBeTruthy();
    expect(screen.getByText("No Veg/NonVeg Free Diet Plan template covers a target of 1,988 kcal/day.")).toBeTruthy();
    expect(screen.queryByText("Meal 1")).toBeNull();
  });

  it("no fitness data: its own empty state", async () => {
    stub(() => ok(assigned({ status: "no_fitness", fitness: { height: null, weight: null, bodyFatPercentage: null, activityLevel: null, foodType: null, goal: null, bmr: null, tdee: null }, freeDietPlan: null })));
    await openUserTab();
    expect(await screen.findByText("Fitness information not available")).toBeTruthy();
    expect(screen.queryByLabelText("Fitness snapshot")).toBeNull();
  });

  it("a removed template is reported", async () => {
    stub(() => ok(assigned({ status: "plan_missing", freeDietPlan: null })));
    await openUserTab();
    expect(await screen.findByText("Assigned plan not found")).toBeTruthy();
  });

  it("shows a loader, then an error with retry", async () => {
    let calls = 0;
    let release: (r: Response) => void = () => {};
    stub(() => {
      calls += 1;
      if (calls === 1) return new Promise<Response>((r) => (release = r));
      return ok(assigned());
    });
    await openUserTab();
    expect(screen.queryByLabelText("Fitness snapshot")).toBeNull();
    release(new Response(JSON.stringify({ success: false, error: { code: "X", message: "boom" } }), { status: 500 }));
    expect(await screen.findByText("Something went wrong")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /retry|try again/i }));
    await waitFor(() => expect(screen.getByLabelText("Fitness snapshot")).toBeTruthy());
  });

  it("is also on Client Details, next to (and separate from) the coach's Diet Plans", async () => {
    stub(() => ok(assigned()));
    render(<RouterProvider router={createMemoryRouter([{ path: "/users/clients/:userId", element: <ClientDetailPage /> }], { initialEntries: ["/users/clients/u1"] })} />);
    const tabs = (await screen.findAllByRole("tab")).map((t) => t.textContent);
    expect(tabs.slice(-3)).toEqual(["Diet Plans0", "Workout Plans0", "Free Diet Plan"]);
    fireEvent.click(screen.getByRole("tab", { name: "Free Diet Plan" }));
    expect(await screen.findByText("Veg/NonVeg · 1,981 – 1,990 kcal")).toBeTruthy();
  });
});
