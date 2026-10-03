import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { CouponListPage } from "./CouponListPage";
import { CouponFormPage } from "./CouponFormPage";
import { CouponViewPage } from "./CouponViewPage";
import { ToastProvider } from "../../components/feedback/ToastProvider";
import { tokenStore, setUnauthorizedHandler } from "../../api/client";

const admin = (name: string) => ({ id: `u-${name}`, name, email: `${name.toLowerCase()}@example.com` });
const coupon = (overrides: Record<string, unknown> = {}) => ({
  id: "c1",
  code: "WELCOME20",
  description: "Welcome offer",
  discount: { type: "percent", value: 20 },
  validFrom: "2026-10-01T00:00:00.000Z",
  validTo: "2026-10-31T00:00:00.000Z",
  visibility: "public",
  status: "active",
  createdBy: admin("Asha"),
  updatedBy: admin("Vikram"),
  createdAt: "2026-09-30T10:00:00.000Z",
  updatedAt: "2026-09-30T11:00:00.000Z",
  ...overrides,
});

const json = (status: number, payload: unknown) => new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
const ok = (data: unknown, status = 200) => json(status, { success: true, data });
const fail = (status: number, code: string, message: string) => json(status, { success: false, error: { code, message } });
const page = (coupons: unknown[], total = coupons.length) =>
  ok({ coupons, pagination: { page: 1, pageSize: 10, total, totalPages: Math.max(1, Math.ceil(total / 10)) } });

interface Captured { url: string; method: string; body: unknown }
const captured: Captured[] = [];
const stubFetch = (handler: (url: string, method: string) => Response | Promise<Response>) =>
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    captured.push({ url: String(input), method, body: typeof init?.body === "string" ? JSON.parse(init.body) : null });
    return handler(String(input), method);
  }));

const renderAt = (path: string) => {
  const router = createMemoryRouter(
    [
      { path: "/commerce/coupons", element: <CouponListPage /> },
      { path: "/commerce/coupons/new", element: <CouponFormPage /> },
      { path: "/commerce/coupons/:id", element: <CouponViewPage /> },
      { path: "/commerce/coupons/:id/edit", element: <CouponFormPage /> },
    ],
    { initialEntries: [path] },
  );
  render(<ToastProvider><RouterProvider router={router} /></ToastProvider>);
  return router;
};

const lists = () => captured.filter((c) => c.method === "GET" && /\/admin\/coupons(\?|$)/.test(c.url));
const writes = () => captured.filter((c) => c.method !== "GET");
const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => {
  captured.length = 0;
  tokenStore.set("t");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  tokenStore.clear();
  setUnauthorizedHandler(() => {});
});

describe("Coupon list", () => {
  it("shows a loading state, then coupons with discount, validity, Visible to All, status and audit", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    stubFetch(async () => { await gate; return page([coupon()]); });
    renderAt("/commerce/coupons");
    expect(screen.queryByText("WELCOME20")).toBeNull();
    release();

    expect(await screen.findByText("WELCOME20")).toBeTruthy();
    expect(screen.getByText("20%")).toBeTruthy();
    expect(screen.getByText("01/10/2026")).toBeTruthy();
    expect(screen.getByText("31/10/2026")).toBeTruthy();
    const table = screen.getByRole("table");
    // The admin-facing label for visibility: Yes/No, never Public/Private.
    expect(within(table).getByText("Yes")).toBeTruthy();
    expect(within(table).queryByText("Public")).toBeNull();
    expect(within(table).getByText("Active")).toBeTruthy();
    expect(screen.getByText("Asha")).toBeTruthy();
    expect(screen.getByText("Vikram")).toBeTruthy();
    // Defaults: active coupons, 10 per page.
    expect(lists()[0].url).toContain("status=active");
    expect(lists()[0].url).toContain("pageSize=10");
  });

  it("search and both filters go to the server; no results is its own state", async () => {
    stubFetch((url) => (url.includes("search=zzz") ? page([]) : page([coupon()])));
    renderAt("/commerce/coupons");
    await screen.findByText("WELCOME20");

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "inactive" } });
    await waitFor(() => expect(lists().at(-1)!.url).toContain("status=inactive"));
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "" } });
    await waitFor(() => expect(lists().at(-1)!.url).not.toContain("status="));
    fireEvent.change(screen.getByLabelText("Visible to All"), { target: { value: "private" } });
    await waitFor(() => expect(lists().at(-1)!.url).toContain("visibility=private"));
    fireEvent.change(screen.getByPlaceholderText("Search by code or description..."), { target: { value: "zzz" } });
    expect(await screen.findByText("No coupons match your filters")).toBeTruthy();
  });

  it("pagination requests the next page", async () => {
    stubFetch(() => page([coupon()], 25));
    renderAt("/commerce/coupons");
    await screen.findByText("WELCOME20");
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => expect(lists().at(-1)!.url).toContain("page=2"));
  });

  it("empty state", async () => {
    stubFetch(() => page([]));
    renderAt("/commerce/coupons");
    expect(await screen.findByText("No active coupons")).toBeTruthy();
  });

  it("API error state with retry", async () => {
    let calls = 0;
    stubFetch(() => (++calls === 1 ? fail(500, "INTERNAL_ERROR", "boom") : page([coupon()])));
    renderAt("/commerce/coupons");
    fireEvent.click(await screen.findByRole("button", { name: /retry|try again/i }));
    expect(await screen.findByText("WELCOME20")).toBeTruthy();
  });

  it("status is Active/Inactive only, and there is no archive or restore anywhere", async () => {
    stubFetch(() => page([coupon(), coupon({ id: "c2", code: "OLD10", status: "inactive" })]));
    renderAt("/commerce/coupons");
    const table = await screen.findByRole("table");
    expect(within(table).getByText("Inactive")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /archive/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /restore/i })).toBeNull();
    expect(screen.queryByText(/archived/i)).toBeNull();
    // Only View and Edit per row.
    expect(screen.getAllByRole("button", { name: "View" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(2);
    const options = Array.from((screen.getByLabelText("Status") as HTMLSelectElement).options).map((o) => o.textContent);
    expect(options).toEqual(["Active", "Inactive", "All statuses"]);
  });

  it("the list renders in the server's order (active first, inactive last)", async () => {
    stubFetch(() => page([coupon({ id: "a", code: "ACTIVE1" }), coupon({ id: "b", code: "ENDED1", status: "inactive" })]));
    renderAt("/commerce/coupons");
    await screen.findByText("ACTIVE1");
    const rowsText = screen.getAllByRole("row").map((r) => r.textContent ?? "");
    expect(rowsText.findIndex((t) => t.includes("ACTIVE1"))).toBeLessThan(rowsText.findIndex((t) => t.includes("ENDED1")));
    expect(writes()).toHaveLength(0);
  });
});

describe("Coupon form", () => {
  it("create: validates, then posts the normalised code; no status or audit fields", async () => {
    stubFetch((_url, method) => (method === "POST" ? ok({ coupon: coupon({ id: "new1" }) }, 201) : ok({ coupon: coupon({ id: "new1" }) })));
    const router = renderAt("/commerce/coupons/new");
    expect(screen.queryByText(/Created By/)).toBeNull();
    // No status input: status is decided by the dates.
    expect(screen.queryByLabelText(/^Status/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Create Coupon" }));
    expect(screen.getByText("Coupon code is required")).toBeTruthy();
    expect(screen.getByText("Discount is required")).toBeTruthy();
    expect(screen.getByText("Valid from is required")).toBeTruthy();
    expect(writes()).toHaveLength(0);

    fill(/Coupon Code/, "  welcome20 ");
    fill(/Discount %/, "150");
    fill(/Valid From/, "2026-10-31");
    fill(/Valid To/, "2026-10-01");
    fireEvent.click(screen.getByRole("button", { name: "Create Coupon" }));
    expect(screen.getByText("Enter a whole number from 1 to 100")).toBeTruthy();
    expect(screen.getByText("Valid to must be on or after valid from")).toBeTruthy();

    fill(/Discount %/, "20");
    fill(/Valid From/, "2026-10-01");
    fill(/Valid To/, "2026-10-31");
    fill(/Description/, "Welcome offer");
    fill(/Visible to All/, "private");
    fireEvent.click(screen.getByRole("button", { name: "Create Coupon" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/commerce/coupons/new1"));
    expect(writes()[0].body).toEqual({
      code: "WELCOME20",
      description: "Welcome offer",
      discount: { type: "percent", value: 20 },
      validFrom: "2026-10-01",
      validTo: "2026-10-31",
      visibility: "private",
    });
  });

  it("a duplicate active code (409) is shown on the code field", async () => {
    stubFetch((_url, method) => (method === "POST" ? fail(409, "COUPON_CODE_EXISTS", 'An active coupon with the code "WELCOME20" already exists') : ok({})));
    renderAt("/commerce/coupons/new");
    fill(/Coupon Code/, "welcome20");
    fill(/Discount %/, "20");
    fill(/Valid From/, "2026-10-01");
    fill(/Valid To/, "2026-10-31");
    fireEvent.click(screen.getByRole("button", { name: "Create Coupon" }));
    // Shown under the code field and as the form message.
    await waitFor(() => expect(screen.getAllByText('An active coupon with the code "WELCOME20" already exists').length).toBe(2));
  });

  it("edit: loads values and read-only audit, and sends only what changed", async () => {
    stubFetch((_url, method) => (method === "PATCH" ? ok({ coupon: coupon({ discount: { type: "percent", value: 25 } }) }) : ok({ coupon: coupon() })));
    const router = renderAt("/commerce/coupons/c1/edit");
    expect(await screen.findByDisplayValue("WELCOME20")).toBeTruthy();
    expect((screen.getByLabelText(/Valid From/) as HTMLInputElement).value).toBe("2026-10-01");
    expect(screen.getByText("Asha")).toBeTruthy();
    expect(screen.getByText("Vikram")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("Status is automatically determined by the validity dates.")).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: /status/i })).toBeNull();

    fill(/Discount %/, "25");
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/commerce/coupons/c1"));
    expect(writes()[0]).toMatchObject({ method: "PATCH", body: { discount: { type: "percent", value: 25 } } });
    expect(Object.keys(writes()[0].body as object)).toEqual(["discount"]);
  });
});

describe("Coupon view", () => {
  it("shows the details, the automatic status and no archive/restore", async () => {
    stubFetch(() => ok({ coupon: coupon({ status: "inactive" }) }));
    renderAt("/commerce/coupons/c1");
    expect(await screen.findByText("01/10/2026")).toBeTruthy();
    expect(screen.getByText("31/10/2026")).toBeTruthy();
    expect(screen.getByText("Welcome offer")).toBeTruthy();
    expect(screen.getByText("Inactive")).toBeTruthy();
    expect(screen.getByText("Status is automatically determined by the validity dates.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /archive|restore/i })).toBeNull();
    expect(screen.getByRole("button", { name: /Edit Coupon/ })).toBeTruthy();
  });
});

// ===================== validity vs visibility, in the UI =====================

describe("Status and Visible to All are different things", () => {
  it("lists all four validity/visibility combinations without confusing them", async () => {
    stubFetch(() =>
      page([
        coupon({ id: "a", code: "ACTIVEPUB", status: "active", visibility: "public" }),
        coupon({ id: "b", code: "ACTIVEPRIV", status: "active", visibility: "private" }),
        coupon({ id: "c", code: "DONEPUB", status: "inactive", visibility: "public" }),
        coupon({ id: "d", code: "DONEPRIV", status: "inactive", visibility: "private" }),
      ]),
    );

    renderAt("/commerce/coupons");
    await waitFor(() => expect(screen.getByText("ACTIVEPUB")).toBeTruthy());

    const row = (code: string) => screen.getByText(code).closest("tr")!;

    // An active private coupon is Active and hidden - private never means inactive.
    expect(within(row("ACTIVEPRIV")).getByText("Active")).toBeTruthy();
    expect(within(row("ACTIVEPRIV")).getByText("No")).toBeTruthy();
    // A public coupon past its dates is Inactive but still "Visible to All: Yes".
    expect(within(row("DONEPUB")).getByText("Inactive")).toBeTruthy();
    expect(within(row("DONEPUB")).getByText("Yes")).toBeTruthy();
    expect(within(row("ACTIVEPUB")).getByText("Active")).toBeTruthy();
    expect(within(row("DONEPRIV")).getByText("Inactive")).toBeTruthy();
  });

  it("defaults to Active and sends the two filters independently", async () => {
    stubFetch(() => page([coupon()]));

    renderAt("/commerce/coupons");
    await waitFor(() => expect(lists().length).toBe(1));
    // Status defaults to Active; visibility is unset, so it is not sent.
    expect(lists()[0].url).toContain("status=active");
    expect(lists()[0].url).not.toContain("visibility=");

    // Visibility alone.
    fireEvent.change(screen.getByLabelText("Visible to All"), { target: { value: "private" } });
    await waitFor(() => expect(lists().at(-1)!.url).toContain("visibility=private"));

    // Then both together, each on its own query parameter.
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "inactive" } });
    await waitFor(() => {
      const url = lists().at(-1)!.url;
      expect(url).toContain("status=inactive");
      expect(url).toContain("visibility=private");
    });
  });

  it("can ask for every status while still filtering visibility", async () => {
    stubFetch(() => page([coupon()]));

    renderAt("/commerce/coupons");
    await waitFor(() => expect(lists().length).toBe(1));

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Visible to All"), { target: { value: "public" } });

    await waitFor(() => {
      const url = lists().at(-1)!.url;
      expect(url).not.toContain("status=");
      expect(url).toContain("visibility=public");
    });
  });

  it("creates a coupon with Visible to All = Yes", async () => {
    stubFetch((_url, method) => (method === "POST" ? ok({ coupon: coupon() }, 201) : page([])));

    renderAt("/commerce/coupons/new");
    fill(/Coupon Code/i, "family20");
    fill(/Discount/i, "20");
    fill(/Valid From/i, "2026-10-01");
    fill(/Valid To/i, "2026-12-31");
    fill(/Visible to All/, "public");
    fireEvent.click(screen.getByRole("button", { name: /create coupon/i }));

    await waitFor(() => expect(writes().length).toBe(1));
    // "Yes" is the label; the API still speaks public/private.
    expect((writes()[0].body as { visibility: string }).visibility).toBe("public");
    // And no status is ever sent - it is not a stored field.
    expect(writes()[0].body).not.toHaveProperty("status");
  });

  it("edits only the visibility when that is all that changed", async () => {
    stubFetch((url, method) => {
      if (method === "PATCH") return ok({ coupon: coupon({ visibility: "private" }) });
      if (url.includes("/admin/coupons/c1")) return ok({ coupon: coupon() });
      return page([coupon()]);
    });

    renderAt("/commerce/coupons/c1/edit");
    await waitFor(() => expect(screen.getByDisplayValue("WELCOME20")).toBeTruthy());

    fill(/Visible to All/, "private");
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(writes().length).toBe(1));
    expect(writes()[0].body).toEqual({ visibility: "private" });
  });

  it("the form offers no status input and no archive action", async () => {
    stubFetch(() => page([]));

    renderAt("/commerce/coupons/new");
    await waitFor(() => expect(screen.getByLabelText(/Coupon Code/i)).toBeTruthy());

    // Status is computed, so there is nothing to set; and coupons are never archived.
    expect(screen.queryByLabelText(/^Status$/)).toBeNull();
    expect(screen.queryByRole("button", { name: /archive/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /restore/i })).toBeNull();
  });

  it("the detail page explains both concepts separately", async () => {
    stubFetch((url) =>
      url.includes("/admin/coupons/c1") ? ok({ coupon: coupon({ visibility: "private" }) }) : page([]),
    );

    renderAt("/commerce/coupons/c1");
    // The code appears in both the page title and the body, so one match is enough.
    await waitFor(() => expect(screen.getAllByText("WELCOME20").length).toBeGreaterThan(0));

    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("Visible to All: No")).toBeTruthy();
    expect(screen.getByText(/Status is automatically determined by the validity dates/)).toBeTruthy();
    // The private coupon's explanation says it still works by exact code.
    expect(screen.getByText(/can still be used by entering the exact code/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /archive/i })).toBeNull();
  });
});
