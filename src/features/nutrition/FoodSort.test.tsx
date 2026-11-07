import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { FoodListPage } from "./FoodListPage";
import { ToastProvider } from "../../components/feedback/ToastProvider";
import { tokenStore, setUnauthorizedHandler } from "../../api/client";
import { describeRules, moveRule, toRows, toRules, toSortParam } from "./foodSort";

/** Food Database → Sort By: multi-level nutrition sort, applied by the server. */

const food = (id: string, name: string, calories: number, protein: number, fat = 1, carbs = 1) => ({
  id,
  name,
  foodType: "Vegetarian",
  brand: null,
  servingUnit: "Grams",
  servingQuantity: 100,
  calories,
  fat,
  carbs,
  protein,
  image: null,
  status: "active",
  legacyFoodId: null,
  createdAt: null,
  updatedAt: null,
});

const pageOf = (foods: unknown[], total = foods.length) =>
  new Response(
    JSON.stringify({ success: true, data: { foods, pagination: { page: 1, pageSize: 10, total, totalPages: Math.max(1, Math.ceil(total / 10)) } } }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );

const urls: URL[] = [];
const latest = () => urls[urls.length - 1];

// The server's order is what the table shows: by name unless a sort is sent.
const byName = [food("a", "Apple", 52, 0.3), food("b", "Banana", 89, 1.1), food("c", "Chicken", 165, 31)];
const byRules = [food("c", "Chicken", 165, 31), food("b", "Banana", 89, 1.1), food("a", "Apple", 52, 0.3)];

beforeEach(() => {
  urls.length = 0;
  tokenStore.set("t");
  setUnauthorizedHandler(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input), "http://portal.test");
      urls.push(url);
      return pageOf(url.searchParams.get("sort") ? byRules : byName, 25);
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  tokenStore.clear();
});

const renderPage = async () => {
  const router = createMemoryRouter([{ path: "/nutrition/foods", element: <FoodListPage /> }], { initialEntries: ["/nutrition/foods"] });
  render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
  await screen.findByText("Apple");
};

const drawer = () => screen.getByRole("dialog", { name: "Sort Food Database" });
const openDrawer = () => fireEvent.click(screen.getByRole("button", { name: /^Sort By/ }));
const inDrawer = () => within(drawer());
const rows = () => within(inDrawer().getByRole("list", { name: /Sorting rules/ })).getAllByRole("listitem");
/** Each row's nutrient, priority number and label, top to bottom. */
const table = () =>
  rows().map((r) => [
    r.querySelector("span[class*='metric']")!.textContent,
    r.querySelector("span[class*='number']")!.textContent,
    r.querySelector("span[class*='ruleLabel']")!.textContent,
  ]);
const choose = (label: string, value: "none" | "desc" | "asc") =>
  fireEvent.change(inDrawer().getByLabelText(`${label} order`), { target: { value } });
const choiceOf = (label: string) => (inDrawer().getByLabelText(`${label} order`) as HTMLSelectElement).value;
const preview = () => inDrawer().getByText(/^(Example order|No nutrition sort)/).textContent;
const drawerGone = () => waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

/** Calories ↓ → Protein ↓ → Fat ↑ → Carbs ↓, as in the design. */
const setDesignRules = () => {
  choose("Calories", "desc");
  choose("Protein (g)", "desc");
  choose("Carbs (g)", "desc");
  choose("Fat (g)", "asc");
  // Fat above Carbs.
  fireEvent.keyDown(inDrawer().getByRole("button", { name: /Reorder Fat/ }), { key: "ArrowUp" });
};

describe("foodSort helpers", () => {
  it("builds the API parameter and preview in priority order", () => {
    const rules = [
      { metric: "calories", direction: "desc" },
      { metric: "protein", direction: "desc" },
      { metric: "fat", direction: "asc" },
      { metric: "carbs", direction: "desc" },
    ] as const;
    expect(toSortParam([...rules])).toBe("calories:desc,protein:desc,fat:asc,carbs:desc");
    expect(describeRules([...rules])).toBe("Calories ↓ → Protein ↓ → Fat ↑ → Carbs ↓");
  });

  it("rows list every nutrient: applied rules first, the rest None; None rows are not rules", () => {
    expect(toRows(null)).toEqual([
      { metric: "calories", choice: "none" },
      { metric: "protein", choice: "none" },
      { metric: "carbs", choice: "none" },
      { metric: "fat", choice: "none" },
    ]);
    const rows = toRows([{ metric: "fat", direction: "asc" }, { metric: "protein", direction: "desc" }]);
    expect(rows.map((r) => `${r.metric}:${r.choice}`)).toEqual(["fat:asc", "protein:desc", "calories:none", "carbs:none"]);
    expect(toRules(rows)).toEqual([{ metric: "fat", direction: "asc" }, { metric: "protein", direction: "desc" }]);
    expect(moveRule([1, 2, 3, 4], 0, 2)).toEqual([2, 3, 1, 4]);
    expect(moveRule([1, 2, 3], 2, 5)).toEqual([1, 2, 3]);
  });
});

describe("Food Database → Sort By drawer", () => {
  it("shows all four nutrients at once, each None / High to low / Low to high - no add or remove", async () => {
    await renderPage();
    openDrawer();
    expect(table()).toEqual([
      ["Calories", "–", "Not sorted"],
      ["Protein (g)", "–", "Not sorted"],
      ["Carbs (g)", "–", "Not sorted"],
      ["Fat (g)", "–", "Not sorted"],
    ]);
    const options = within(inDrawer().getByLabelText("Calories order")).getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["None", "High to low", "Low to high"]);
    expect(inDrawer().queryByRole("button", { name: /Add sort rule/ })).toBeNull();
    expect(inDrawer().queryByRole("button", { name: /Remove/ })).toBeNull();
    expect(inDrawer().getByText("0 active")).toBeTruthy();
    expect(preview()).toBe("No nutrition sort: Name (A-Z)");
    expect(screen.getByRole("button", { name: /^Sort By/ }).getAttribute("aria-expanded")).toBe("true");
  });

  it("numbers only the nutrients in use, top to bottom, and the preview follows", async () => {
    await renderPage();
    openDrawer();
    choose("Protein (g)", "desc");
    expect(table()[1]).toEqual(["Protein (g)", "1", "Primary sort"]);
    expect(preview()).toBe("Example order: Protein ↓");
    setDesignRules();
    expect(table()).toEqual([
      ["Calories", "1", "Primary sort"],
      ["Protein (g)", "2", "Then sort by"],
      ["Fat (g)", "3", "Then sort by"],
      ["Carbs (g)", "4", "Then sort by"],
    ]);
    expect(inDrawer().getByText("4 active")).toBeTruthy();
    expect(preview()).toBe("Example order: Calories ↓ → Protein ↓ → Fat ↑ → Carbs ↓");
    expect(inDrawer().getByText(/tied on every rule follow the list's sort: Name \(A-Z\)/)).toBeTruthy();

    choose("Calories", "none");
    expect(table()[0]).toEqual(["Calories", "–", "Not sorted"]);
    expect(table()[1]).toEqual(["Protein (g)", "1", "Primary sort"]);
    expect(preview()).toBe("Example order: Protein ↓ → Fat ↑ → Carbs ↓");
  });

  it("reorders by drag and drop and by keyboard, and the priorities follow", async () => {
    await renderPage();
    openDrawer();
    choose("Calories", "desc");
    choose("Carbs (g)", "asc");

    // Drag Carbs onto Calories.
    const list = rows();
    fireEvent.pointerDown(within(list[2]).getByRole("button", { name: /Reorder Carbs/ }));
    expect(list[2].getAttribute("draggable")).toBe("true");
    fireEvent.dragStart(list[2]);
    fireEvent.dragOver(list[0]);
    fireEvent.drop(list[0]);
    expect(table().map((r) => r[0])).toEqual(["Carbs (g)", "Calories", "Protein (g)", "Fat (g)"]);
    expect(preview()).toBe("Example order: Carbs ↑ → Calories ↓");

    // Keyboard: ArrowDown on Carbs moves it below Calories; focus stays with it.
    fireEvent.keyDown(inDrawer().getByRole("button", { name: /Reorder Carbs/ }), { key: "ArrowDown" });
    expect(preview()).toBe("Example order: Calories ↓ → Carbs ↑");
    expect(document.activeElement).toBe(inDrawer().getByRole("button", { name: /Reorder Carbs/ }));
  });

  it("Apply sends the rules in priority order with search, filters and the Name sort, then shows the server's order", async () => {
    await renderPage();
    fireEvent.change(screen.getByPlaceholderText(/Search by food name/), { target: { value: "a" } });
    fireEvent.change(screen.getByLabelText("Food Type"), { target: { value: "Vegetarian" } });
    fireEvent.change(screen.getByLabelText("Unit"), { target: { value: "Grams" } });
    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "name:desc" } });
    fireEvent.click(await screen.findByRole("button", { name: "Next page" }));
    await waitFor(() => expect(latest().searchParams.get("page")).toBe("2"));

    openDrawer();
    setDesignRules();
    fireEvent.click(inDrawer().getByRole("button", { name: "Apply sorting" }));
    await drawerGone();

    await waitFor(() => expect(latest().searchParams.get("sort")).toBe("calories:desc,protein:desc,fat:asc,carbs:desc"));
    const q = latest().searchParams;
    expect([q.get("search"), q.get("foodType"), q.get("unit"), q.get("sortKey"), q.get("sortDir"), q.get("page")]).toEqual([
      "a",
      "Vegetarian",
      "Grams",
      "name",
      "desc",
      "1",
    ]);
    // The table shows rows in the order the server returned them.
    await waitFor(() => expect(screen.getAllByText(/^(Apple|Banana|Chicken)$/).map((n) => n.textContent)).toEqual(["Chicken", "Banana", "Apple"]));

    // Active indicator, and paging keeps the sort.
    const button = screen.getByRole("button", { name: /^Sort By/ });
    expect(button.getAttribute("aria-label")).toBe("Sort By: Calories ↓ → Protein ↓ → Fat ↑ → Carbs ↓");
    expect(button.textContent).toContain("4");
    fireEvent.click(await screen.findByRole("button", { name: "Next page" }));
    await waitFor(() => expect(latest().searchParams.get("page")).toBe("2"));
    expect(latest().searchParams.get("sort")).toBe("calories:desc,protein:desc,fat:asc,carbs:desc");

    // Reopening shows the applied rows.
    openDrawer();
    expect(table().map((r) => r[0])).toEqual(["Calories", "Protein (g)", "Fat (g)", "Carbs (g)"]);
    expect(choiceOf("Fat (g)")).toBe("asc");
  });

  it("Applying with every nutrient on None clears the nutrition sort", async () => {
    await renderPage();
    openDrawer();
    choose("Fat (g)", "asc");
    fireEvent.click(inDrawer().getByRole("button", { name: "Apply sorting" }));
    await drawerGone();
    await waitFor(() => expect(latest().searchParams.get("sort")).toBe("fat:asc"));

    openDrawer();
    choose("Fat (g)", "none");
    fireEvent.click(inDrawer().getByRole("button", { name: "Apply sorting" }));
    await drawerGone();
    await waitFor(() => expect(latest().searchParams.has("sort")).toBe(false));
    expect(screen.getByRole("button", { name: "Sort By" })).toBeTruthy();
  });

  it("Cancel, Esc, the close button and the backdrop discard edits; the applied sort stays", async () => {
    await renderPage();
    openDrawer();
    choose("Calories", "desc");
    choose("Protein (g)", "desc");
    fireEvent.click(inDrawer().getByRole("button", { name: "Apply sorting" }));
    await drawerGone();
    await waitFor(() => expect(latest().searchParams.get("sort")).toBe("calories:desc,protein:desc"));
    const requests = urls.length;

    const discard = [
      () => fireEvent.click(inDrawer().getByRole("button", { name: "Cancel" })),
      () => fireEvent.keyDown(document, { key: "Escape" }),
      () => fireEvent.click(inDrawer().getByRole("button", { name: "Close" })),
      () => fireEvent.mouseDown(drawer().parentElement!),
    ];
    for (const close of discard) {
      openDrawer();
      choose("Calories", "asc");
      choose("Fat (g)", "desc");
      close();
      await drawerGone();
    }
    expect(urls.length).toBe(requests);
    openDrawer();
    expect([choiceOf("Calories"), choiceOf("Protein (g)"), choiceOf("Fat (g)")]).toEqual(["desc", "desc", "none"]);
  });

  it("Reset returns to the list's own order and keeps search, filters and the Name sort", async () => {
    await renderPage();
    fireEvent.change(screen.getByPlaceholderText(/Search by food name/), { target: { value: "an" } });
    fireEvent.change(screen.getByLabelText("Unit"), { target: { value: "Grams" } });
    openDrawer();
    choose("Calories", "desc");
    fireEvent.click(inDrawer().getByRole("button", { name: "Apply sorting" }));
    await drawerGone();
    await waitFor(() => expect(latest().searchParams.get("sort")).toBe("calories:desc"));

    openDrawer();
    fireEvent.click(inDrawer().getByRole("button", { name: "Reset" }));
    await drawerGone();
    await waitFor(() => expect(latest().searchParams.has("sort")).toBe(false));
    expect([latest().searchParams.get("search"), latest().searchParams.get("unit"), latest().searchParams.get("sortKey")]).toEqual(["an", "Grams", "name"]);
    await waitFor(() => expect(screen.getAllByText(/^(Apple|Banana|Chicken)$/).map((n) => n.textContent)).toEqual(["Apple", "Banana", "Chicken"]));

    // Reopening after a reset: every nutrient on None.
    openDrawer();
    expect(table().every((r) => r[2] === "Not sorted")).toBe(true);
  });

  it("returns focus to Sort By when the drawer closes", async () => {
    await renderPage();
    const button = screen.getByRole("button", { name: /^Sort By/ });
    button.focus();
    fireEvent.click(button);
    expect(document.activeElement).toBe(drawer());
    fireEvent.click(inDrawer().getByRole("button", { name: "Cancel" }));
    await drawerGone();
    expect(document.activeElement).toBe(button);
  });
});

describe("Food Database table headers", () => {
  it("show the applied rule under each nutrient column, and nothing once reset", async () => {
    await renderPage();
    for (const m of ["calories", "protein", "carbs", "fat"]) expect(screen.queryByTestId(`sort-rule-${m}`)).toBeNull();

    openDrawer();
    setDesignRules();
    fireEvent.click(inDrawer().getByRole("button", { name: "Apply sorting" }));
    await drawerGone();

    // Calories ↓ → Protein ↓ → Fat ↑ → Carbs ↓, each under its own column.
    await waitFor(() => expect(screen.getByTestId("sort-rule-calories").textContent).toBe("1 · High to low"));
    expect(screen.getByTestId("sort-rule-protein").textContent).toBe("2 · High to low");
    expect(screen.getByTestId("sort-rule-fat").textContent).toBe("3 · Low to high");
    expect(screen.getByTestId("sort-rule-carbs").textContent).toBe("4 · High to low");
    expect(screen.getByTestId("sort-rule-calories").closest("th")!.textContent).toContain("Calories");

    openDrawer();
    fireEvent.click(inDrawer().getByRole("button", { name: /Reset/ }));
    await drawerGone();
    for (const m of ["calories", "protein", "carbs", "fat"]) expect(screen.queryByTestId(`sort-rule-${m}`)).toBeNull();
  });
});
