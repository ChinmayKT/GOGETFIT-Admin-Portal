import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DietListPage } from "./DietListPage";
import { ToastProvider } from "../../components/feedback/ToastProvider";
import { tokenStore } from "../../api/client";

/** One row of GET /api/admin/free-diet-plans, in the shape the backend returns. */
const makePlan = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  dietType: "Veg.",
  range: { from: 800, to: 840 },
  mealCount: 4,
  foodCount: 12,
  status: "active",
  legacyPlanId: 5,
  createdAt: "2022-01-12T13:20:19.000Z",
  updatedAt: "2023-05-10T18:55:44.000Z",
  ...overrides,
});

const listResponse = (plans: unknown[], total = plans.length, page = 1, pageSize = 10) =>
  new Response(
    JSON.stringify({
      success: true,
      data: {
        plans,
        pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );

const errorResponse = (status: number, code: string, message: string) =>
  new Response(JSON.stringify({ success: false, error: { code, message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const requests: { url: string; method: string }[] = [];

/** The confirm button inside the open dialog, not the row's delete icon. */
const confirmButton = () => {
  const dialog = screen.getByText("Delete diet plan?").closest("div[class*='modal'], div[role='dialog']")
    ?? document.body;
  const buttons = Array.from(dialog.querySelectorAll("button")).filter(
    (button) => button.textContent?.trim() === "Delete",
  );
  return buttons[buttons.length - 1];
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <ToastProvider>
        <DietListPage />
      </ToastProvider>
    </MemoryRouter>,
  );

describe("DietListPage", () => {
  beforeEach(() => {
    requests.length = 0;
    tokenStore.set("test-admin-token");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    tokenStore.clear();
  });

  /** Records every call and answers with `handler`. */
  const stubFetch = (handler: (url: string, init?: RequestInit) => Response) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        requests.push({ url, method: init?.method ?? "GET" });
        return handler(url, init);
      }),
    );
  };

  it("loads real plans from the backend, not mock data", async () => {
    stubFetch(() =>
      listResponse([
        makePlan("aaa", { dietType: "Veg.", range: { from: 800, to: 840 }, foodCount: 12 }),
        makePlan("bbb", { dietType: "Veg/Egg", range: { from: 841, to: 850 }, foodCount: 7 }),
      ]),
    );

    renderPage();

    await waitFor(() => expect(screen.getByText("Veg/Egg")).toBeTruthy());
    expect(screen.getByText("800 kcal")).toBeTruthy();
    expect(screen.getByText("840 kcal")).toBeTruthy();
    // The count comes from the server; the list never receives the food rows.
    expect(screen.getByText("12 food rows")).toBeTruthy();
    expect(screen.getByText("7 food rows")).toBeTruthy();
    expect(requests[0].url).toContain("/admin/free-diet-plans");
  });

  it("sends the Authorization header", async () => {
    let seenAuth: string | null = null;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        seenAuth = (init?.headers as Record<string, string>)?.Authorization ?? null;
        return listResponse([makePlan("aaa")]);
      }),
    );

    renderPage();

    await waitFor(() => expect(seenAuth).toBe("Bearer test-admin-token"));
  });

  it("pages on the server rather than in the browser", async () => {
    stubFetch(() => listResponse([makePlan("aaa")], 25));

    renderPage();
    await waitFor(() => expect(screen.getByText("Veg.")).toBeTruthy());

    fireEvent.click(screen.getByLabelText(/next/i));

    await waitFor(() => expect(requests.some((r) => r.url.includes("page=2"))).toBe(true));
    expect(requests[0].url).toContain("pageSize=10");
  });

  it("asks the server to filter by diet type", async () => {
    stubFetch(() => listResponse([makePlan("aaa")]));

    renderPage();
    await waitFor(() => expect(screen.getByText("Veg.")).toBeTruthy());

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Veg/Egg" } });

    await waitFor(() =>
      expect(requests.some((r) => r.url.includes(`dietType=${encodeURIComponent("Veg/Egg")}`))).toBe(
        true,
      ),
    );
  });

  it("shows the empty state when the backend returns no plans", async () => {
    stubFetch(() => listResponse([], 0));

    renderPage();

    await waitFor(() => expect(screen.getByText("No free diet plans yet")).toBeTruthy());
  });

  it("shows an error state when the request fails", async () => {
    stubFetch(() => errorResponse(500, "INTERNAL_ERROR", "Something broke"));

    renderPage();

    await waitFor(() => expect(screen.getByText("Something went wrong")).toBeTruthy());
  });

  it("deletes through the API and reloads the list", async () => {
    stubFetch((_url, init) => {
      if ((init?.method ?? "GET") === "DELETE") {
        return new Response(JSON.stringify({ success: true, data: { plan: makePlan("aaa") } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return listResponse([makePlan("aaa")]);
    });

    renderPage();
    await waitFor(() => expect(screen.getByText("Veg.")).toBeTruthy());

    fireEvent.click(screen.getByLabelText("Delete"));
    await waitFor(() => expect(screen.getByText("Delete diet plan?")).toBeTruthy());
    // The row's icon button and the dialog's confirm button share the name, so
    // the confirmation is clicked inside the dialog.
    fireEvent.click(confirmButton());

    await waitFor(() =>
      expect(requests.some((r) => r.method === "DELETE" && r.url.endsWith("/aaa"))).toBe(true),
    );
    // A reload follows the delete, so the table reflects the server again.
    await waitFor(() => expect(requests.filter((r) => r.method === "GET").length).toBeGreaterThan(1));
  });

  it("keeps the row and reports the failure when a delete is refused", async () => {
    stubFetch((_url, init) =>
      (init?.method ?? "GET") === "DELETE"
        ? errorResponse(403, "FORBIDDEN", "Insufficient permissions")
        : listResponse([makePlan("aaa")]),
    );

    renderPage();
    // The diet-type filter also renders "Veg." as an option, so the row is
    // identified by its calorie band instead.
    await waitFor(() => expect(screen.getByText("800 kcal")).toBeTruthy());

    fireEvent.click(screen.getByLabelText("Delete"));
    await waitFor(() => expect(screen.getByText("Delete diet plan?")).toBeTruthy());
    // The row's icon button and the dialog's confirm button share the name, so
    // the confirmation is clicked inside the dialog.
    fireEvent.click(confirmButton());

    await waitFor(() => expect(screen.getByText(/not allowed to delete/i)).toBeTruthy());
    expect(screen.getByText("800 kcal")).toBeTruthy();
  });
});
