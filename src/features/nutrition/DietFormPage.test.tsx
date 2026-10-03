import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { DietFormPage } from "./DietFormPage";
import { ToastProvider } from "../../components/feedback/ToastProvider";
import { tokenStore, setUnauthorizedHandler } from "../../api/client";
import { toApiMeals, toMeals } from "../../api/freeDietPlans";

/** GET /api/admin/free-diet-plans/:id, in the backend's shape. */
const planDetail = (overrides: Record<string, unknown> = {}) => ({
  id: "aaa",
  dietType: "Veg.",
  range: { from: 800, to: 840 },
  mealCount: 2,
  foodCount: 2,
  status: "active",
  legacyPlanId: 5,
  meals: [
    {
      mealId: 1,
      foods: [
        {
          legacyPlanMealId: 13350,
          foodName: "Bread",
          foodType: null,
          unit: "slice",
          quantity: 1,
          calories: 69,
          fat: 1,
          carbs: 12.5,
          protein: 2.5,
        },
      ],
    },
    {
      mealId: 3,
      foods: [
        {
          legacyPlanMealId: 13352,
          foodName: "Dal (Any)(Raw)",
          foodType: null,
          unit: "grams",
          quantity: 35,
          calories: 121,
          fat: 0.3,
          carbs: 20.7,
          protein: 8.9,
        },
      ],
    },
  ],
  totals: { calories: 190, fat: 1.3, carbs: 33.2, protein: 11.4 },
  legacy: { source: "gogetfit", planId: 5 },
  createdAt: "2022-01-12T13:20:19.000Z",
  updatedAt: "2023-05-10T18:55:44.000Z",
  ...overrides,
});

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const errorResponse = (status: number, code: string, message: string) =>
  new Response(JSON.stringify({ success: false, error: { code, message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

interface Captured {
  url: string;
  method: string;
  body: Record<string, unknown> | null;
}

const captured: Captured[] = [];

const stubFetch = (handler: (url: string, init?: RequestInit) => Response) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      captured.push({
        url: String(input),
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : null,
      });
      return handler(String(input), init);
    }),
  );
};

/**
 * A data router, because the page uses useBlocker to guard unsaved edits and
 * that hook only works inside one (the app itself uses createBrowserRouter).
 */
const renderAt = (path: string) => {
  const router = createMemoryRouter(
    [
      { path: "/nutrition/freediets/new", element: <DietFormPage /> },
      { path: "/nutrition/freediets/:id/edit", element: <DietFormPage /> },
      { path: "/nutrition/freediets", element: <p>list</p> },
    ],
    { initialEntries: [path] },
  );

  return render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
};

const lastWrite = () => captured.filter((c) => c.method === "POST" || c.method === "PATCH").at(-1)!;

describe("DietFormPage", () => {
  beforeEach(() => {
    captured.length = 0;
    tokenStore.set("test-admin-token");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    tokenStore.clear();
    setUnauthorizedHandler(() => {});
  });

  it("creates a plan through POST, with the meals nested", async () => {
    stubFetch((_url, init) =>
      (init?.method ?? "GET") === "POST" ? ok({ plan: planDetail() }) : ok({ plan: planDetail() }),
    );

    renderAt("/nutrition/freediets/new");

    fireEvent.click(screen.getByRole("button", { name: /create plan/i }));

    await waitFor(() => expect(captured.some((c) => c.method === "POST")).toBe(true));
    const write = lastWrite();
    expect(write.url).toContain("/admin/free-diet-plans");
    expect(write.body).toMatchObject({ dietType: "Veg.", range: { from: 1200, to: 1500 } });
    // Nested under meals, never flattened onto the plan.
    expect(Array.isArray(write.body?.meals)).toBe(true);
    expect(write.body).not.toHaveProperty("foods");
    expect(write.body).not.toHaveProperty("legacy");
  });

  it("populates the form from the stored document, not from defaults", async () => {
    stubFetch(() => ok({ plan: planDetail() }));

    renderAt("/nutrition/freediets/aaa/edit");

    await waitFor(() => expect(screen.getByDisplayValue("800")).toBeTruthy());
    expect(screen.getByDisplayValue("840")).toBeTruthy();
    expect(screen.getByDisplayValue("Bread")).toBeTruthy();
    // The unit arrives lowercase from the API and is shown in the UI's casing.
    expect(screen.getByDisplayValue("Slice")).toBeTruthy();
    expect(captured[0].url).toContain("/admin/free-diet-plans/aaa");
  });

  it("saves an edit through PATCH and keeps the meal numbers", async () => {
    stubFetch((_url, init) =>
      (init?.method ?? "GET") === "PATCH" ? ok({ plan: planDetail() }) : ok({ plan: planDetail() }),
    );

    renderAt("/nutrition/freediets/aaa/edit");
    await waitFor(() => expect(screen.getByDisplayValue("Bread")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: /update plan/i }));

    await waitFor(() => expect(captured.some((c) => c.method === "PATCH")).toBe(true));
    const write = lastWrite();
    expect(write.url).toContain("/admin/free-diet-plans/aaa");
    // Meal 1 and Meal 3 are what the plan holds; the empty tabs are not sent.
    const meals = (write.body?.meals ?? []) as { mealId: number }[];
    expect(meals.map((meal) => meal.mealId)).toEqual([1, 3]);
  });

  it("surfaces the backend's refusal instead of claiming success", async () => {
    stubFetch((_url, init) =>
      (init?.method ?? "GET") === "POST"
        ? errorResponse(409, "PLAN_ALREADY_EXISTS", "A free diet plan with the same diet type and calorie range already exists")
        : ok({ plan: planDetail() }),
    );

    renderAt("/nutrition/freediets/new");

    fireEvent.click(screen.getByRole("button", { name: /create plan/i }));

    await waitFor(() => expect(screen.getByText(/already exists/i)).toBeTruthy());
    // Still on the form, so nothing is lost.
    expect(screen.getByRole("button", { name: /create plan/i })).toBeTruthy();
  });

  it("validates the calorie band before calling the API", async () => {
    stubFetch(() => ok({ plan: planDetail() }));

    renderAt("/nutrition/freediets/new");

    const [from, to] = screen.getAllByRole("spinbutton");
    fireEvent.change(from, { target: { value: "1500" } });
    fireEvent.change(to, { target: { value: "1200" } });
    fireEvent.click(screen.getByRole("button", { name: /create plan/i }));

    await waitFor(() => expect(screen.getByText(/must be greater than Range From/i)).toBeTruthy());
    expect(captured.some((c) => c.method === "POST")).toBe(false);
  });

  it("shows a load-failure state when the plan cannot be fetched", async () => {
    stubFetch(() => errorResponse(404, "PLAN_NOT_FOUND", "Free diet plan not found"));

    renderAt("/nutrition/freediets/aaa/edit");

    await waitFor(() => expect(screen.getByText(/could not load this diet plan/i)).toBeTruthy());
  });

  it("routes a 401 to the session handler so the operator is signed out", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    stubFetch(() => errorResponse(401, "UNAUTHORIZED", "Bearer token required"));

    renderAt("/nutrition/freediets/aaa/edit");

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });
});

describe("free diet plan mapping", () => {
  it("gives the editor all five meal tabs even when the plan has fewer", () => {
    // 504 migrated templates have no meal 5; the editor still needs the tab.
    const meals = toMeals([{ mealId: 1, foods: [] }]);

    expect(meals.map((m) => m.label)).toEqual(["Meal 1", "Meal 2", "Meal 3", "Meal 4", "Meal 5"]);
  });

  it("drops empty meals and blank rows on the way back out", () => {
    const meals = toMeals([]);
    meals[0].rows = [
      {
        id: "r1",
        foodName: "Bread",
        unit: "Slice",
        qty: 1,
        calories: 69,
        fat: 1,
        carbs: 12.5,
        protein: 2.5,
      },
      { id: "r2", foodName: "   ", unit: "Serving", qty: 1, calories: 0, fat: 0, carbs: 0, protein: 0 },
    ];

    const payload = toApiMeals(meals);

    expect(payload).toHaveLength(1);
    expect(payload[0].mealId).toBe(1);
    expect(payload[0].foods).toHaveLength(1);
    // Units go back lowercase, the way the legacy column stored them.
    expect(payload[0].foods[0].unit).toBe("slice");
  });

  it("never sends a legacy row id back to the server", () => {
    const meals = toMeals([
      {
        mealId: 2,
        foods: [
          {
            legacyPlanMealId: 13350,
            foodName: "Bread",
            foodType: null,
            unit: "slice",
            quantity: 1,
            calories: 69,
            fat: 1,
            carbs: 12.5,
            protein: 2.5,
          },
        ],
      },
    ]);

    const payload = toApiMeals(meals);

    expect(payload[0].foods[0]).not.toHaveProperty("legacyPlanMealId");
    expect(payload[0].mealId).toBe(2);
  });
});
