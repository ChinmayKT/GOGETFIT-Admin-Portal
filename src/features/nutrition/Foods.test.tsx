import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { FoodListPage } from "./FoodListPage";
import { FoodFormPage } from "./FoodFormPage";
import { ToastProvider } from "../../components/feedback/ToastProvider";
import { tokenStore, setUnauthorizedHandler } from "../../api/client";
import { restoreFood, uploadFoodImage } from "../../api/foods";

/** A food in the backend's shape. `legacyFoodId` marks a migrated one. */
const food = (overrides: Record<string, unknown> = {}) => ({
  id: "f1",
  name: "Paneer Cubes",
  foodType: "Vegetarian",
  brand: "Farm Fresh",
  servingUnit: "Grams",
  servingQuantity: 100,
  calories: 114,
  fat: 2.6,
  carbs: 0,
  protein: 21,
  image: null,
  status: "active",
  legacyFoodId: 1396,
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
  ...overrides,
});

const detail = (overrides: Record<string, unknown> = {}) => ({
  ...food(),
  notes: "High protein",
  deletedAt: null,
  legacy: { source: "gogetfit", foodId: 1396 },
  migration: { runId: "foods-run", migratedAt: "2026-10-01T10:00:00.000Z", version: 1 },
  ...overrides,
});

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
const ok = (data: unknown, status = 200) => json(status, { success: true, data });
const fail = (status: number, code: string, message: string) => json(status, { success: false, error: { code, message } });
const pageOf = (foods: unknown[], total = foods.length, page = 1, pageSize = 10) =>
  ok({ foods, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });

interface Captured {
  url: string;
  method: string;
  body: Record<string, unknown> | null;
}
const captured: Captured[] = [];

const stubFetch = (handler: (url: string, method: string) => Response | Promise<Response>) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      captured.push({
        url: String(input),
        method,
        body: typeof init?.body === "string" ? JSON.parse(init.body) : null,
      });
      return handler(String(input), method);
    }),
  );
};

const renderAt = (path: string) => {
  const router = createMemoryRouter(
    [
      { path: "/nutrition/foods", element: <FoodListPage /> },
      { path: "/nutrition/foods/new", element: <FoodFormPage /> },
      { path: "/nutrition/foods/:id/edit", element: <FoodFormPage /> },
    ],
    { initialEntries: [path] },
  );
  render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
  return router;
};

const lists = () => captured.filter((c) => c.method === "GET" && /\/admin\/foods(\?|$)/.test(c.url));
const latestList = () => lists()[lists().length - 1];
const writes = () => captured.filter((c) => c.method !== "GET");

beforeEach(() => {
  captured.length = 0;
  tokenStore.set("test-token");
  setUnauthorizedHandler(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  tokenStore.clear();
});

describe("Food list", () => {
  it("renders real foods from the API, not mock data", async () => {
    stubFetch(() =>
      pageOf([
        food(),
        food({
          id: "f2",
          name: "Grilled Chicken",
          foodType: "Non-Vegetarian",
          brand: null,
          servingUnit: "Piece",
          servingQuantity: 1,
          calories: 248,
          fat: 5.4,
          carbs: 7.25,
          protein: 46,
        }),
      ]),
    );
    renderAt("/nutrition/foods");

    expect(await screen.findByText("Paneer Cubes")).toBeTruthy();
    expect(screen.getByText("Grilled Chicken")).toBeTruthy();
    // Values come from the flat fields, in the portion they describe.
    expect(screen.getByText("100 Grams")).toBeTruthy();
    expect(screen.getByText("1 Piece")).toBeTruthy();
    expect(screen.getByText("114")).toBeTruthy();
    expect(screen.getByText("248")).toBeTruthy();
    expect(screen.getByText("21.0")).toBeTruthy();
    expect(screen.getByText("46.0")).toBeTruthy();
    expect(screen.getByText("7.3")).toBeTruthy();
    expect(screen.getByText("2.6")).toBeTruthy();
    expect(screen.getByText("5.4")).toBeTruthy();
    expect(latestList().url).toContain("/admin/foods");
  });

  it("asks the server for one page at a time", async () => {
    stubFetch(() => pageOf([food()], 25));
    renderAt("/nutrition/foods");

    await screen.findByText("Paneer Cubes");
    expect(latestList().url).toContain("pageSize=10");
    expect(latestList().url).toContain("page=1");

    fireEvent.click(screen.getByRole("button", { name: /next page/i }));
    await waitFor(() => expect(latestList().url).toContain("page=2"));
  });

  it("sends the search term to the server rather than filtering the loaded page", async () => {
    stubFetch(() => pageOf([food()]));
    renderAt("/nutrition/foods");
    await screen.findByText("Paneer Cubes");

    fireEvent.change(screen.getByLabelText("Search by food name, brand..."), { target: { value: "milk" } });

    await waitFor(() => expect(latestList().url).toContain("search=milk"));
    expect(latestList().url).toContain("page=1");
  });

  it("sends food type and unit filters as query parameters, in the new vocabulary", async () => {
    stubFetch(() => pageOf([food()]));
    renderAt("/nutrition/foods");
    await screen.findByText("Paneer Cubes");

    fireEvent.change(screen.getByLabelText("Food Type"), { target: { value: "Non-Vegetarian" } });
    await waitFor(() => expect(latestList().url).toContain("foodType=Non-Vegetarian"));
    // Never the legacy spellings.
    expect(latestList().url).not.toContain("Veg.");
    expect(latestList().url).not.toContain("NonVeg&");

    fireEvent.change(screen.getByLabelText("Unit"), { target: { value: "ML" } });
    await waitFor(() => expect(latestList().url).toContain("unit=ML"));
  });

  it("sorts on the server with allow-listed keys", async () => {
    stubFetch(() => pageOf([food()]));
    renderAt("/nutrition/foods");
    await screen.findByText("Paneer Cubes");

    expect(latestList().url).toContain("sortKey=name");
    expect(latestList().url).toContain("sortDir=asc");

    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "createdAt:desc" } });
    await waitFor(() => expect(latestList().url).toContain("sortKey=createdAt"));
    expect(latestList().url).toContain("sortDir=desc");

    // A flat backend sort key, not a nested path.
    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "calories:asc" } });
    await waitFor(() => expect(latestList().url).toContain("sortKey=calories"));
    expect(latestList().url).toContain("sortDir=asc");
    expect(latestList().url).not.toContain("nutrition");
  });

  it("shows a placeholder instead of inventing an image", async () => {
    stubFetch(() => pageOf([food({ image: null })]));
    renderAt("/nutrition/foods");

    await screen.findByText("Paneer Cubes");
    expect(screen.getByLabelText("No image")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders a stored image reference when the food has one", async () => {
    stubFetch(() => pageOf([food({ image: { url: "http://localhost:3000/uploads/foods/f1/a.png", storageKey: "k" } })]));
    renderAt("/nutrition/foods");

    const image = (await screen.findAllByRole("img"))[0] as HTMLImageElement;
    expect(image.src).toContain("/uploads/foods/f1/a.png");
  });

  it("shows an error state, never fake rows, when the API fails", async () => {
    stubFetch(() => fail(500, "INTERNAL_ERROR", "Something broke"));
    renderAt("/nutrition/foods");

    expect(await screen.findByText("Something went wrong")).toBeTruthy();
    expect(screen.queryByText("Paneer Cubes")).toBeNull();
  });

  it("distinguishes an empty database from an empty search result", async () => {
    stubFetch(() => pageOf([]));
    renderAt("/nutrition/foods");

    expect(await screen.findByText("No foods yet")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Search by food name, brand..."), { target: { value: "zzz" } });
    expect(await screen.findByText("No foods match these filters")).toBeTruthy();
  });

  it("archives through DELETE and refreshes the list", async () => {
    stubFetch((_url, method) => {
      if (method === "DELETE") return ok({ food: detail({ status: "archived" }) });
      return pageOf([food()]);
    });
    renderAt("/nutrition/foods");
    await screen.findByText("Paneer Cubes");

    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Nothing is deleted/i)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Archive" }));

    await waitFor(() => expect(writes().some((w) => w.method === "DELETE" && w.url.includes("/admin/foods/f1"))).toBe(true));
    // The table is reloaded from the server afterwards.
    await waitFor(() => expect(lists().length).toBeGreaterThan(1));
  });
});

describe("Add Food", () => {
  it("creates a real food through POST with the flat document shape", async () => {
    stubFetch((_url, method) => (method === "POST" ? ok({ food: detail({ id: "new1", legacy: null, legacyFoodId: null }) }, 201) : pageOf([])));
    const router = renderAt("/nutrition/foods/new");

    fireEvent.change(screen.getByLabelText(/Food Name/), { target: { value: "Oats Porridge" } });
    fireEvent.change(screen.getByLabelText(/^Qty/), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/^Unit/), { target: { value: "Bowl" } });
    fireEvent.change(screen.getByLabelText(/Calories/), { target: { value: "158" } });
    fireEvent.change(screen.getByLabelText(/Protein/), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Food" }));

    await waitFor(() => expect(writes().length).toBe(1));
    const [post] = writes();
    expect(post.method).toBe("POST");
    expect(post.body).toEqual({
      name: "Oats Porridge",
      foodType: "Vegetarian",
      brand: null,
      servingUnit: "Bowl",
      servingQuantity: 1,
      calories: 158,
      fat: 0,
      carbs: 0,
      protein: 6,
      notes: null,
    });
    // The pre-flattening nested shape is never sent.
    expect(post.body).not.toHaveProperty("serving");
    expect(post.body).not.toHaveProperty("nutrition");
    // No legacy or audit metadata is ever sent from the form.
    expect(post.body).not.toHaveProperty("legacy");
    expect(post.body).not.toHaveProperty("image");
    await waitFor(() => expect(router.state.location.pathname).toBe("/nutrition/foods"));
  });

  it("blocks invalid input before it reaches the server", async () => {
    stubFetch(() => pageOf([]));
    renderAt("/nutrition/foods/new");

    fireEvent.change(screen.getByLabelText(/^Qty/), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText(/Calories/), { target: { value: "-5" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Food" }));

    expect(await screen.findByText("Food name is required")).toBeTruthy();
    expect(screen.getByText("Enter a quantity greater than 0")).toBeTruthy();
    expect(screen.getByText("Cannot be negative")).toBeTruthy();
    expect(writes()).toHaveLength(0);
  });

  it("surfaces a backend validation error instead of claiming success", async () => {
    stubFetch((_url, method) =>
      method === "POST" ? fail(400, "VALIDATION_ERROR", "calories must be at most 20000") : pageOf([]),
    );
    const router = renderAt("/nutrition/foods/new");

    fireEvent.change(screen.getByLabelText(/Food Name/), { target: { value: "Absurd" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Food" }));

    expect(await screen.findByText("calories must be at most 20000")).toBeTruthy();
    expect(router.state.location.pathname).toBe("/nutrition/foods/new");
  });
});

describe("Edit Food", () => {
  it("loads the real food and updates it, keeping legacy metadata out of the body", async () => {
    stubFetch((url, method) => {
      if (method === "PUT") return ok({ food: detail({ name: "Paneer Cubes (Low Fat)" }) });
      if (/\/admin\/foods\/f1$/.test(url)) return ok({ food: detail() });
      return pageOf([food()]);
    });
    const router = renderAt("/nutrition/foods/f1/edit");

    const name = (await screen.findByLabelText(/Food Name/)) as HTMLInputElement;
    expect(name.value).toBe("Paneer Cubes");
    // Legacy id is shown as secondary metadata only.
    expect(screen.getByText("Legacy Food ID: 1396")).toBeTruthy();
    // The flat fields populate the form.
    expect((screen.getByLabelText(/^Qty/) as HTMLInputElement).value).toBe("100");
    expect((screen.getByLabelText(/^Unit/) as HTMLSelectElement).value).toBe("Grams");
    expect((screen.getByLabelText(/Calories/) as HTMLInputElement).value).toBe("114");
    expect((screen.getByLabelText(/Protein/) as HTMLInputElement).value).toBe("21");

    fireEvent.change(name, { target: { value: "Paneer Cubes (Low Fat)" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Food" }));

    await waitFor(() => expect(writes().length).toBe(1));
    const [put] = writes();
    expect(put.method).toBe("PUT");
    expect(put.url).toContain("/admin/foods/f1");
    expect(put.body).not.toHaveProperty("legacy");
    expect(put.body).not.toHaveProperty("migration");
    expect(put.body).toEqual({
      name: "Paneer Cubes (Low Fat)",
      foodType: "Vegetarian",
      brand: "Farm Fresh",
      servingUnit: "Grams",
      servingQuantity: 100,
      calories: 114,
      fat: 2.6,
      carbs: 0,
      protein: 21,
      notes: "High protein",
    });
    await waitFor(() => expect(router.state.location.pathname).toBe("/nutrition/foods"));
  });

  it("shows an error state when the food cannot be loaded", async () => {
    stubFetch(() => fail(404, "FOOD_NOT_FOUND", "Food not found"));
    renderAt("/nutrition/foods/missing/edit");

    expect(await screen.findByText("Could not load this food")).toBeTruthy();
    expect(screen.queryByLabelText(/Food Name/)).toBeNull();
  });
});

describe("Food API helpers", () => {
  it("restores an archived food with a flat status-only PUT", async () => {
    stubFetch(() => ok({ food: detail({ status: "active" }) }));

    const restored = await restoreFood("f1");

    expect(restored.status).toBe("active");
    const [put] = writes();
    expect(put.method).toBe("PUT");
    expect(put.url).toContain("/admin/foods/f1");
    expect(put.body).toEqual({ status: "active" });
  });

  it("uploads a picture to the image endpoint and returns the flat food", async () => {
    stubFetch(() => ok({ food: detail({ image: { url: "/uploads/foods/f1/a.png", storageKey: "k" } }) }));

    const updated = await uploadFoodImage("f1", new File([new Uint8Array([137, 80, 78, 71])], "a.png", { type: "image/png" }));

    expect(updated.image?.url).toBe("/uploads/foods/f1/a.png");
    expect(updated.calories).toBe(114);
    const [put] = writes();
    expect(put.method).toBe("PUT");
    expect(put.url).toContain("/admin/foods/f1/image");
  });
});
