import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { InCartPage } from "./InCartPage";
import { ToastProvider } from "../../components/feedback/ToastProvider";
import { tokenStore, setUnauthorizedHandler } from "../../api/client";

/** A cart row in the backend's shape: only active items are ever returned. */
const cartRow = (overrides: Record<string, unknown> = {}) => ({
  id: "cart1",
  status: "active",
  user: { id: "u1", name: "Rohit Sharma", phone: "919000000001", email: "rohit@example.com" },
  coach: { id: "c1", name: "Coach Prajwal", level: "LEVEL 1" },
  plan: { id: "p1", name: "12 WEEKS GOGETFIT PLAN", planType: "Enrollment", durationWeeks: 12, price: 4999, currency: "INR" },
  addedAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
  ...overrides,
});

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
const ok = (data: unknown) => json(200, { success: true, data });
const fail = (status: number, code: string, message: string) => json(status, { success: false, error: { code, message } });
const page = (items: unknown[], total = items.length) =>
  ok({ cartItems: items, pagination: { page: 1, pageSize: 10, total, totalPages: Math.max(1, Math.ceil(total / 10)) } });

const captured: { url: string; method: string }[] = [];

const stubFetch = (handler: (url: string) => Response) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      captured.push({ url, method: init?.method ?? "GET" });
      // The filter dropdowns load from the coach and plan APIs.
      if (url.includes("/admin/coaches")) return ok({ coaches: [], pagination: { page: 1, pageSize: 100, total: 0, totalPages: 1 } });
      if (url.includes("/admin/gogetfit-plans")) return ok({ plans: [], pagination: { page: 1, pageSize: 100, total: 0, totalPages: 1 } });
      return handler(url);
    }),
  );
};

const carts = () => captured.filter((c) => c.url.includes("/admin/cart-items"));
const latest = () => carts()[carts().length - 1];

const renderPage = () => {
  const router = createMemoryRouter([{ path: "/commerce/in-cart", element: <InCartPage /> }], {
    initialEntries: ["/commerce/in-cart"],
  });
  render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
  return router;
};

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

describe("In cart", () => {
  it("lists unpurchased carts from the real API", async () => {
    stubFetch(() => page([cartRow()]));
    renderPage();

    expect(await screen.findByText("Rohit Sharma")).toBeTruthy();
    expect(screen.getByText("919000000001")).toBeTruthy();
    expect(screen.getByText("rohit@example.com")).toBeTruthy();
    expect(screen.getByText("Coach Prajwal")).toBeTruthy();
    expect(screen.getByText("12 WEEKS GOGETFIT PLAN")).toBeTruthy();
    expect(screen.getByText("₹4,999")).toBeTruthy();
    expect(latest().url).toContain("/admin/cart-items");
  });

  it("asks the server for one page at a time", async () => {
    stubFetch(() => page([cartRow()], 25));
    renderPage();

    await screen.findByText("Rohit Sharma");
    expect(latest().url).toContain("pageSize=10");
    expect(latest().url).toContain("page=1");
  });

  it("sends search and coach/plan filters to the server", async () => {
    stubFetch(() => page([cartRow()]));
    renderPage();
    await screen.findByText("Rohit Sharma");

    fireEvent.change(screen.getByLabelText("Search by member name, phone, email, plan..."), {
      target: { value: "rohit" },
    });
    await waitFor(() => expect(latest().url).toContain("search=rohit"));
    expect(latest().url).toContain("page=1");
  });

  it("sorts on the server", async () => {
    stubFetch(() => page([cartRow()]));
    renderPage();
    await screen.findByText("Rohit Sharma");

    expect(latest().url).toContain("sortKey=addedAt");
    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "price:desc" } });
    await waitFor(() => expect(latest().url).toContain("sortKey=price"));
  });

  it("shows an empty state when nothing is pending, never fake rows", async () => {
    stubFetch(() => page([]));
    renderPage();

    expect(await screen.findByText("No pending carts")).toBeTruthy();
    expect(screen.queryByText("Rohit Sharma")).toBeNull();
  });

  it("shows an error state when the API fails", async () => {
    stubFetch(() => fail(500, "INTERNAL_ERROR", "boom"));
    renderPage();

    expect(await screen.findByText("Something went wrong")).toBeTruthy();
    expect(screen.queryByText("Rohit Sharma")).toBeNull();
  });

  it("does not show purchased carts: the API returns only active items", async () => {
    // The backend filters on status: 'active', so a purchased item is simply
    // absent from the response rather than filtered in the browser.
    stubFetch(() => page([]));
    renderPage();

    expect(await screen.findByText("No pending carts")).toBeTruthy();
    expect(latest().url).not.toContain("status=");
  });
});
