import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { GogetfitPlansPage } from "./GogetfitPlansPage";
import { GogetfitPlanFormPage } from "./GogetfitPlanFormPage";
import { GogetfitPlanViewPage } from "./GogetfitPlanViewPage";
import { ToastProvider } from "../../components/feedback/ToastProvider";
import { tokenStore, setUnauthorizedHandler } from "../../api/client";

/** A plan in the backend's shape (a migrated legacy package). */
const plan = (overrides: Record<string, unknown> = {}) => ({
  id: "p15",
  name: "12 WEEKS GOGETFIT PLAN",
  planType: "Enrollment",
  coachLevel: "LEVEL 1",
  durationWeeks: 12,
  personsAllowed: 1,
  pricing: { basePrice: 4999, reward: 0, currency: "INR" },
  status: "active",
  legacyPackageId: 15,
  createdAt: "2026-09-29T10:09:00.000Z",
  updatedAt: "2026-09-29T10:09:00.000Z",
  content: {
    description: "Healthy isn't a goal, it's a way of living.",
    inclusions: "* A personalised diet plan\n* Weekly check-ins",
    whatNext: null,
    termsAndConditions: "*Money refund is only valid for genuine cases",
    eligibility: "You must be at least 18 years to enrol",
  },
  deletedAt: null,
  legacy: { source: "gogetfit", packageId: 15, createdBy: "123", updatedAt: "2022-01-24T03:32:59.000Z", updatedBy: "123" },
  ...overrides,
});

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
const ok = (data: unknown, status = 200) => json(status, { success: true, data });
const fail = (status: number, code: string, message: string) => json(status, { success: false, error: { code, message } });
const page = (plans: unknown[], total = plans.length) =>
  ok({ plans, pagination: { page: 1, pageSize: 10, total, totalPages: Math.max(1, Math.ceil(total / 10)) } });

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
      captured.push({ url: String(input), method, body: typeof init?.body === "string" ? JSON.parse(init.body) : null });
      return handler(String(input), method);
    }),
  );
};

const renderAt = (path: string) => {
  const router = createMemoryRouter(
    [
      { path: "/content/gogetfit-plans", element: <GogetfitPlansPage /> },
      { path: "/content/gogetfit-plans/new", element: <GogetfitPlanFormPage /> },
      { path: "/content/gogetfit-plans/:id", element: <GogetfitPlanViewPage /> },
      { path: "/content/gogetfit-plans/:id/edit", element: <GogetfitPlanFormPage /> },
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

const lists = () => captured.filter((c) => c.method === "GET" && /\/admin\/gogetfit-plans(\?|$)/.test(c.url));
const writes = () => captured.filter((c) => c.method !== "GET");

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

describe("GoGetFit Plans list", () => {
  it("1-2. shows a loading state, then the legacy columns", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    stubFetch(async () => {
      await gate;
      return page([
        plan(),
        plan({ id: "p22", name: "12 WEEKS GOGETFIT PLAN (CHALLENGE)", planType: "Challenge", pricing: { basePrice: 7999, reward: 3999, currency: "INR" } }),
      ]);
    });
    renderAt("/content/gogetfit-plans");

    expect(screen.queryByText("12 WEEKS GOGETFIT PLAN")).toBeNull();
    release();

    expect(await screen.findByText("12 WEEKS GOGETFIT PLAN")).toBeTruthy();
    for (const header of ["Plan Name", "Plan Type", "Plan Level", "Duration", "Person(s)", "Base Price"]) {
      expect(screen.getAllByText(header).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByText("12 weeks").length).toBe(2);
    expect(screen.getByText("₹4,999")).toBeTruthy();
    expect(screen.getByText("₹3,999")).toBeTruthy();
    expect(lists()[0].url).toContain("status=active");
    expect(lists()[0].url).toContain("pageSize=10");
  });

  it("3. an empty collection offers Add Plan", async () => {
    stubFetch(() => page([]));
    renderAt("/content/gogetfit-plans");
    expect(await screen.findByText("No plans yet")).toBeTruthy();
  });

  it("4. search and filters go to the server, and no results is its own state", async () => {
    stubFetch((url) => (url.includes("search=zzz") ? page([]) : page([plan()])));
    renderAt("/content/gogetfit-plans");
    await screen.findByText("12 WEEKS GOGETFIT PLAN");

    fireEvent.change(screen.getByLabelText("Plan Type"), { target: { value: "Challenge" } });
    await waitFor(() => expect(lists().at(-1)!.url).toContain("planType=Challenge"));
    fireEvent.change(screen.getByLabelText("Plan Level"), { target: { value: "LEVEL 2" } });
    await waitFor(() => expect(lists().at(-1)!.url).toContain("coachLevel=LEVEL+2"));

    fireEvent.change(screen.getByPlaceholderText("Search plans by name..."), { target: { value: "zzz" } });
    expect(await screen.findByText("No plans match your filters")).toBeTruthy();
  });

  it("5. pagination requests the next page from the server", async () => {
    stubFetch(() => page([plan()], 25));
    renderAt("/content/gogetfit-plans");
    await screen.findByText("12 WEEKS GOGETFIT PLAN");

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => expect(lists().at(-1)!.url).toContain("page=2"));
  });

  it("11-12. delete asks first, names the plan, then archives through DELETE", async () => {
    let deleted = false;
    stubFetch((_url, method) => {
      if (method === "DELETE") {
        deleted = true;
        return ok({ plan: plan({ status: "archived", deletedAt: "2026-09-29T11:00:00.000Z" }) });
      }
      return deleted ? page([]) : page([plan()]);
    });
    renderAt("/content/gogetfit-plans");
    await screen.findByText("12 WEEKS GOGETFIT PLAN");

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Are you sure you want to delete "12 WEEKS GOGETFIT PLAN"\?/)).toBeTruthy();
    expect(writes()).toHaveLength(0);

    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(writes()[0]).toMatchObject({ method: "DELETE" }));
    expect(writes()[0].url).toContain("/admin/gogetfit-plans/p15");
    expect(await screen.findByText("No plans yet")).toBeTruthy();
  });

  it("deleted plans can be listed and restored", async () => {
    stubFetch((url, method) =>
      method === "PATCH" ? ok({ plan: plan() }) : url.includes("status=archived") ? page([plan({ status: "archived" })]) : page([]),
    );
    renderAt("/content/gogetfit-plans");
    await screen.findByText("No plans yet");

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "archived" } });
    fireEvent.click(await screen.findByRole("button", { name: "Restore" }));
    await waitFor(() => expect(writes()[0]).toMatchObject({ method: "PATCH", body: { status: "active" } }));
  });

  it("13. an API error shows a retry", async () => {
    let calls = 0;
    stubFetch(() => (++calls === 1 ? fail(500, "INTERNAL_ERROR", "boom") : page([plan()])));
    renderAt("/content/gogetfit-plans");

    fireEvent.click(await screen.findByRole("button", { name: /retry|try again/i }));
    expect(await screen.findByText("12 WEEKS GOGETFIT PLAN")).toBeTruthy();
  });
});

describe("GoGetFit Plan form", () => {
  const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

  it("6-7. the add form has every legacy field and validates before saving", async () => {
    stubFetch(() => ok({}));
    renderAt("/content/gogetfit-plans/new");

    for (const label of [/Plan Level/, /Plan Type/, /Plan Name/, /Duration/, /Persons Allowed/, /Base Price/, /Reward/, /^Description/, /Package Inclusions/, /What Next/, /Terms and Conditions/, /Eligibility/]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
    // Legacy defaults for the dropdowns; numbers start empty (no fake 0).
    expect((screen.getByLabelText(/Plan Level/) as HTMLSelectElement).value).toBe("LEVEL 1");
    expect((screen.getByLabelText(/Plan Type/) as HTMLSelectElement).value).toBe("Enrollment");
    expect((screen.getByLabelText(/Base Price/) as HTMLInputElement).value).toBe("");

    fill(/Plan Name/, "x".repeat(46));
    fill(/Duration/, "0");
    fill(/Plan Type/, "Challenge");
    fireEvent.click(screen.getByRole("button", { name: "Add Plan" }));

    expect(screen.getByText("At most 45 characters")).toBeTruthy();
    expect(screen.getByText("Enter a value from 1 to 520")).toBeTruthy();
    expect(screen.getAllByText("This field is required").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Reward (Refund Amount) is mandatory when challenge is selected")).toBeTruthy();
    expect(writes()).toHaveLength(0);
  });

  it("8. a valid plan is created through POST and opens its page", async () => {
    stubFetch((_url, method) => (method === "POST" ? ok({ plan: plan({ id: "new1" }) }, 201) : ok({ plan: plan({ id: "new1" }) })));
    const router = renderAt("/content/gogetfit-plans/new");

    fill(/Plan Name/, "  12 WEEKS GOGETFIT PLAN  ");
    fill(/Duration/, "12");
    fill(/Persons Allowed/, "1");
    fill(/Base Price/, "4999");
    fill(/Package Inclusions/, "* Diet plan\n* Check-ins");
    fireEvent.click(screen.getByRole("button", { name: "Add Plan" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/content/gogetfit-plans/new1"));
    expect(writes()[0].body).toEqual({
      name: "12 WEEKS GOGETFIT PLAN",
      planType: "Enrollment",
      coachLevel: "LEVEL 1",
      durationWeeks: 12,
      personsAllowed: 1,
      pricing: { basePrice: 4999, reward: null },
      content: { description: null, inclusions: "* Diet plan\n* Check-ins", whatNext: null, termsAndConditions: null, eligibility: null },
    });
    expect(await screen.findByText("Plan added successfully")).toBeTruthy();
  });

  it("server validation errors are shown", async () => {
    stubFetch((_url, method) =>
      method === "POST" ? fail(400, "VALIDATION_ERROR", "pricing.reward cannot be more than pricing.basePrice") : ok({}),
    );
    renderAt("/content/gogetfit-plans/new");
    fill(/Plan Name/, "Plan");
    fill(/Duration/, "12");
    fill(/Persons Allowed/, "1");
    fill(/Base Price/, "4999");
    fireEvent.click(screen.getByRole("button", { name: "Add Plan" }));
    expect((await screen.findByRole("alert")).textContent).toBe("pricing.reward cannot be more than pricing.basePrice");
  });

  it("9-10. edit loads every stored value (zeros included) and saves through PATCH", async () => {
    stubFetch((_url, method) =>
      method === "PATCH"
        ? ok({ plan: plan({ name: "24 WEEKS GOGETFIT PLAN" }) })
        : ok({ plan: plan({ pricing: { basePrice: 0, reward: 0, currency: "INR" } }) }),
    );
    const router = renderAt("/content/gogetfit-plans/p15/edit");

    expect(await screen.findByDisplayValue("12 WEEKS GOGETFIT PLAN")).toBeTruthy();
    expect((screen.getByLabelText(/Base Price/) as HTMLInputElement).value).toBe("0");
    expect((screen.getByLabelText(/Reward/) as HTMLInputElement).value).toBe("0");
    expect((screen.getByLabelText(/Package Inclusions/) as HTMLTextAreaElement).value).toBe("* A personalised diet plan\n* Weekly check-ins");
    expect((screen.getByLabelText(/What Next/) as HTMLTextAreaElement).value).toBe("");

    fill(/Plan Name/, "24 WEEKS GOGETFIT PLAN");
    fireEvent.click(screen.getByRole("button", { name: "Update Plan" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/content/gogetfit-plans/p15"));
    const patch = writes()[0];
    expect(patch.method).toBe("PATCH");
    expect(patch.url).toContain("/admin/gogetfit-plans/p15");
    // Only what changed is sent - untouched fields (and their exact stored text) are never rewritten.
    expect(patch.body).toEqual({ name: "24 WEEKS GOGETFIT PLAN" });
    expect(await screen.findByText("Plan updated successfully")).toBeTruthy();
  });

  it("untouched legacy text is never sent back, and an unchanged save writes nothing", async () => {
    stubFetch(() => ok({ plan: plan({ content: { ...plan().content, description: "Line one\r\nLine two" } }) }));
    const router = renderAt("/content/gogetfit-plans/p15/edit");
    await screen.findByDisplayValue("12 WEEKS GOGETFIT PLAN");

    fireEvent.click(screen.getByRole("button", { name: "Update Plan" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/content/gogetfit-plans/p15"));
    expect(writes()).toHaveLength(0);
    expect(await screen.findByText("No changes to save")).toBeTruthy();
  });

  it("edit of an unknown plan says so", async () => {
    stubFetch(() => fail(404, "GOGETFIT_PLAN_NOT_FOUND", "GoGetFit plan not found"));
    renderAt("/content/gogetfit-plans/missing/edit");
    expect(await screen.findByText("Plan not found")).toBeTruthy();
  });
});

describe("GoGetFit Plan view", () => {
  it("shows the plan with its text sections and legacy id", async () => {
    stubFetch(() => ok({ plan: plan() }));
    renderAt("/content/gogetfit-plans/p15");
    expect(await screen.findByText("Legacy Package ID")).toBeTruthy();
    expect(screen.getByText("15")).toBeTruthy();
    expect(screen.getByText(/Weekly check-ins/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Edit Plan/ })).toBeTruthy();
  });
});
