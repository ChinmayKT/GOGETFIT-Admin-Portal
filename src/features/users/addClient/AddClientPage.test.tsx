import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup, fireEvent, within, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { AddClientPage } from "./AddClientPage";
import { ClientListPage } from "../ClientListPage";
import { emptyDraft, planEndDate, pricing, toPayload, update, validateStep, type Draft } from "./draft";
import { tokenStore } from "../../../api/client";
import type { AdminUser } from "../../../types/admin";
import type { CoachRecord } from "../../../types/coach";
import type { Coupon } from "../../../types/coupons";
import type { GogetfitPlanRow } from "../../../types/gogetfitPlans";

// --- fixtures in the shapes the real endpoints return ------------------------------------

const user = (id: string, name: string, phone: string, email: string): AdminUser => ({
  id,
  phone: { raw: phone.slice(2), normalized: phone },
  profile: {
    name,
    email,
    isEmailVerified: false,
    dateOfBirth: null,
    age: null,
    gender: null,
    city: null,
    profilePicture: null,
    freeDietPlanId: null,
    fitnessProfile: { height: null, weight: null, bodyFatPercentage: null, activityLevel: null, foodType: null, goal: null, bmr: null, tdee: null },
  },
  profileCompleted: true,
  roles: ["user"],
  status: "active",
  legacy: null,
  createdAt: null,
  updatedAt: null,
});
const USERS = [
  user("u1", "Rahul Sharma", "919876543210", "rahul@gmail.com"),
  user("u2", "Ananya Rao", "919876512345", "ananya@gmail.com"),
];

const plan = (id: string, name: string, weeks: number, price: number, level = "LEVEL 1"): GogetfitPlanRow => ({
  id,
  image: null,
  name,
  planType: "Enrollment",
  coachLevel: level,
  durationWeeks: weeks,
  personsAllowed: 1,
  pricing: { basePrice: price, reward: 0 } as GogetfitPlanRow["pricing"],
  status: "active",
  legacyPackageId: null,
  createdAt: null,
  updatedAt: null,
});
const PLANS = [plan("p12", "12 WEEKS GOGETFIT PLAN", 12, 4999), plan("p24", "24 WEEKS GOGETFIT PLAN", 24, 8999), plan("pL2", "LEVEL 2 PLAN", 12, 9999, "LEVEL 2")];

const coach = (id: string, name: string, level: string, specialization: string | null): CoachRecord =>
  ({
    id,
    userId: `cu-${id}`,
    user: { id: `cu-${id}`, name, phone: null, email: null, gender: null, city: null, profilePicture: null, roles: ["user", "coach"], status: "active" },
    profile: { profilePicture: null, coverPicture: null, level, specialization, description: null, languages: [], facebook: null, instagram: null, linkedin: null, transformations: 0, availableSlots: 0 },
    status: "active",
    createdBy: null,
    updatedBy: null,
    createdAt: null,
    updatedAt: null,
  }) as CoachRecord;
const COACHES = [coach("c1", "Prajwal", "LEVEL 1", "Weight Management"), coach("c2", "Siri Shankar", "LEVEL 1", null), coach("c3", "Level Two Coach", "LEVEL 2", "Strength")];

const coupon = (id: string, code: string, value: number, visibility: "public" | "private"): Coupon => ({
  id,
  code,
  description: null,
  discount: { type: "percent", value },
  validFrom: "2026-09-01T00:00:00.000Z",
  validTo: "2026-10-31T00:00:00.000Z",
  visibility,
  status: "active",
  createdBy: null,
  updatedBy: null,
  createdAt: null,
  updatedAt: null,
});
const COUPONS = [coupon("k1", "WELCOME10", 10, "public"), coupon("k2", "VIP20", 20, "private")];

// --- a fake backend -------------------------------------------------------------------------

const json = (status: number, payload: unknown) => new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
const ok = (data: unknown, status = 200) => json(status, { success: true, data });
const page = (key: string, rows: unknown[]) => ok({ [key]: rows, pagination: { page: 1, pageSize: 100, total: rows.length, totalPages: 1 } });

interface Call {
  method: string;
  url: string;
  body: unknown;
}
let calls: Call[] = [];
let postResponse: () => Response;

const backend = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const method = init?.method ?? "GET";
  calls.push({ method, url, body: typeof init?.body === "string" ? JSON.parse(init.body) : null });
  const path = url.replace(/^.*\/api/, "");
  if (method === "POST" && path === "/admin/enrolled-clients") return postResponse();
  if (path.startsWith("/admin/gogetfit-plans")) return page("plans", PLANS);
  if (path.startsWith("/admin/coaches")) return page("coaches", COACHES);
  if (path.startsWith("/admin/coupons")) return page("coupons", COUPONS);
  if (path.startsWith("/admin/users")) {
    const q = (new URL(url, "http://x").searchParams.get("search") ?? "").toLowerCase();
    return page("users", USERS.filter((u) => `${u.profile.name} ${u.profile.email} ${u.phone.normalized}`.toLowerCase().includes(q)));
  }
  if (path.startsWith("/admin/enrolled-clients")) return page("enrolledClients", []);
  return json(404, { success: false, error: { code: "NOT_FOUND", message: "not found" } });
});

const created = (amount: number, discountPercent = 0) =>
  ok(
    {
      enrolledClient: { id: "e-new", client: { id: "u1" } },
      pricing: { originalAmount: 4999, discountPercent, discountAmount: 4999 - amount, finalAmount: amount, amountReceived: amount, difference: 0 },
    },
    201,
  );

const renderAt = (path = "/users/clients/add") => {
  const router = createMemoryRouter(
    [
      { path: "/users/clients", element: <ClientListPage /> },
      { path: "/users/clients/add", element: <AddClientPage /> },
      { path: "/users/clients/:userId", element: <p>Client details page</p> },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
};

const cont = () => screen.getByRole("button", { name: /Continue/ });
const search = (q: string) => fireEvent.change(screen.getByPlaceholderText("Search by name, phone or email"), { target: { value: q } });
const selectUser = async (name = "Rahul Sharma") => {
  search(name.split(" ")[0]);
  fireEvent.click(await screen.findByRole("button", { name: `Select ${name}` }));
};
const pickPlan = (id: string) => fireEvent.change(screen.getByRole("combobox", { name: /Plan/ }), { target: { value: id } });
const coachButton = () => screen.getByRole("button", { name: /^Coach/ });
const coachOptions = () => {
  fireEvent.click(coachButton());
  return within(screen.getByRole("listbox", { name: "Coaches" }));
};
const pickCoach = (name: string) => fireEvent.click(coachOptions().getByRole("option", { name: new RegExp(name) }));
const setDate = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const amountInput = () => screen.getByRole("spinbutton", { name: "Amount Received" }) as HTMLInputElement;
const couponSelect = () => screen.getByRole("combobox", { name: /Coupon/ }) as HTMLSelectElement;

/** Client + Enrollment filled in, landing on Payment. */
const toPayment = async () => {
  await screen.findByPlaceholderText("Search by name, phone or email");
  await selectUser();
  fireEvent.click(cont());
  pickPlan("p12");
  pickCoach("Prajwal");
  setDate(/Enrollment Date/, "2026-10-01");
  setDate(/Start Date/, "2026-10-02");
  fireEvent.click(cont());
};

beforeEach(() => {
  calls = [];
  postResponse = () => created(4999);
  tokenStore.set("t");
  vi.stubGlobal("fetch", backend);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  tokenStore.clear();
});

describe("Add Client (real API)", () => {
  it("1. opens from the Clients page and loads active plans, coaches and coupons", async () => {
    const router = renderAt("/users/clients");
    fireEvent.click(await screen.findByRole("button", { name: "Add Client" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/users/clients/add"));
    await screen.findByPlaceholderText("Search by name, phone or email");
    const urls = calls.map((c) => c.url);
    expect(urls.some((u) => u.includes("/admin/gogetfit-plans?status=active"))).toBe(true);
    expect(urls.some((u) => u.includes("/admin/coaches?status=active"))).toBe(true);
    expect(urls.some((u) => u.includes("/admin/coupons?status=active"))).toBe(true);
  });

  it("shows a retryable error when plans, coaches or coupons cannot be loaded", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json(500, { success: false, error: { code: "INTERNAL_ERROR", message: "x" } })));
    renderAt();
    expect(await screen.findByText(/couldn't load plans, coaches and coupons/)).toBeTruthy();
  });

  it("2-5. searches real users (active only), selects one, and can change it", async () => {
    renderAt();
    await screen.findByPlaceholderText("Search by name, phone or email");
    expect(cont()).toHaveProperty("disabled", true);
    search("ana");
    expect(await screen.findByRole("button", { name: "Select Ananya Rao" })).toBeTruthy();
    const req = calls.filter((c) => c.url.includes("/admin/users")).pop()!.url;
    expect(req).toContain("search=ana");
    expect(req).toContain("status=active");

    fireEvent.click(screen.getByRole("button", { name: "Select Ananya Rao" }));
    const card = screen.getByLabelText("Selected user");
    expect(within(card).getByText("Ananya Rao")).toBeTruthy();
    expect(within(card).getByText(/\+91 98765 12345 · ananya@gmail.com/)).toBeTruthy();
    expect(cont()).toHaveProperty("disabled", false);

    fireEvent.click(screen.getByRole("button", { name: "Change User" }));
    await selectUser("Rahul Sharma");
    expect(within(screen.getByLabelText("Selected user")).getByText("Rahul Sharma")).toBeTruthy();
  });

  it("no match offers Create New User, which is handled in Users", async () => {
    renderAt();
    await screen.findByPlaceholderText("Search by name, phone or email");
    search("zzzz");
    expect(await screen.findByText(/Can't find this user\?/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Create New User/ }));
    expect(screen.getByText(/User creation is handled separately in Users/)).toBeTruthy();
  });

  it("6-8, 13. plan, coach (only coaches of the plan's level) and dates; end date from the plan's weeks", async () => {
    renderAt();
    await screen.findByPlaceholderText("Search by name, phone or email");
    await selectUser();
    fireEvent.click(cont());
    expect(cont()).toHaveProperty("disabled", true);

    pickPlan("p12");
    const summary = within(screen.getByLabelText("Plan summary"));
    expect(summary.getByText("12 weeks")).toBeTruthy();
    expect(summary.getByText("₹4,999")).toBeTruthy();

    // A LEVEL 1 plan lists only LEVEL 1 coaches.
    const options = coachOptions();
    expect(options.getAllByRole("option").map((o) => o.textContent)).toEqual(["PrajwalWeight Management · LEVEL 1", "Siri ShankarLEVEL 1"]);
    fireEvent.click(options.getByRole("option", { name: /Prajwal/ }));
    expect(coachButton().textContent).toBe("PrajwalWeight Management · LEVEL 1");
    // Start/End optional: plan + coach + enrollment date are enough.
    expect(cont()).toHaveProperty("disabled", false);

    // Switching to a LEVEL 2 plan drops the LEVEL 1 coach.
    pickPlan("pL2");
    expect(coachButton().textContent).toBe("Select Coach");
    expect(cont()).toHaveProperty("disabled", true);
    pickPlan("p12");
    pickCoach("Prajwal");

    setDate(/Start Date/, "2026-10-02");
    // 12 weeks after 02 Oct.
    expect((screen.getByLabelText(/End Date/) as HTMLInputElement).value).toBe("2026-12-25");
    setDate(/End Date/, "2026-09-01");
    expect(screen.getByText("End Date must be on or after the Start Date.")).toBeTruthy();
    expect(cont()).toHaveProperty("disabled", true);
  });

  it("9-12. payment: 4 methods, reference required for UPI and bank transfer, amount from the plan price", async () => {
    renderAt();
    await toPayment();
    expect(amountInput().value).toBe("4999");
    expect(screen.getAllByRole("radio").map((r) => r.textContent)).toEqual(["Cash", "UPI", "Bank Transfer", "Other"]);
    expect(screen.getByLabelText(/Receipt \/ Reference/)).toBeTruthy();
    expect(cont()).toHaveProperty("disabled", false);

    for (const method of ["UPI", "Bank Transfer"]) {
      fireEvent.click(screen.getByRole("radio", { name: method }));
      expect(screen.getByRole("radio", { name: method }).getAttribute("aria-checked")).toBe("true");
      fireEvent.change(screen.getByPlaceholderText("Enter reference"), { target: { value: "" } });
      expect(cont()).toHaveProperty("disabled", true);
      fireEvent.change(screen.getByPlaceholderText("Enter reference"), { target: { value: "UTR998877" } });
      expect(cont()).toHaveProperty("disabled", false);
    }
    fireEvent.click(screen.getByRole("radio", { name: "Other" }));
    expect(screen.queryByPlaceholderText("Enter reference")).toBeNull();

    fireEvent.change(amountInput(), { target: { value: "4999.5" } });
    expect(screen.getByText("Enter a whole amount in rupees, 0 or more.")).toBeTruthy();
    fireEvent.change(amountInput(), { target: { value: "0" } });
    expect(screen.queryByText("Enter a whole amount in rupees, 0 or more.")).toBeNull();
  });

  it("coupons: active public and private coupons from the API; preview uses the server's truncation rule", async () => {
    renderAt();
    await toPayment();
    expect(Array.from(couponSelect().options).map((o) => o.textContent)).toEqual([
      "No coupon",
      "WELCOME10 · 10% off · Public",
      "VIP20 · 20% off · Private",
    ]);
    fireEvent.change(couponSelect(), { target: { value: "k1" } });
    // 4999 at 10% = 499.9 → discount ₹499 → ₹4,500 (integer arithmetic, as the server does).
    expect(amountInput().value).toBe("4500");
    expect(screen.getByText(/10% off · saves ₹499 · price ₹4,500/)).toBeTruthy();
    const summary = within(screen.getByLabelText("Payment summary"));
    expect(summary.getByText("Coupon WELCOME10 (10%)")).toBeTruthy();
    expect(summary.getByText("−₹499")).toBeTruthy();
  });

  it("14-15. Create Client sends only ids and the admin's entries, then shows the server's result", async () => {
    postResponse = () => created(4500, 10);
    const router = renderAt();
    await toPayment();
    fireEvent.change(couponSelect(), { target: { value: "k1" } });
    fireEvent.click(screen.getByRole("radio", { name: "UPI" }));
    fireEvent.change(screen.getByPlaceholderText("Enter reference"), { target: { value: "UTR998877" } });
    fireEvent.change(screen.getByPlaceholderText("Optional"), { target: { value: "Paid at the studio" } });
    fireEvent.click(cont());

    expect(screen.getByRole("heading", { name: "Review Client" })).toBeTruthy();
    for (const text of ["12 WEEKS GOGETFIT PLAN", "Coach: Prajwal", "01/10/2026", "02/10/2026", "25/12/2026", "WELCOME10 · 10% off", "UPI", "UTR998877", "Paid at the studio"]) {
      expect(screen.getByText(text)).toBeTruthy();
    }

    fireEvent.click(screen.getByRole("button", { name: "Create Client" }));
    expect(await screen.findByText("Client Added Successfully")).toBeTruthy();

    const post = calls.find((c) => c.method === "POST")!;
    expect(post.url).toMatch(/\/admin\/enrolled-clients$/);
    expect(post.body).toEqual({
      userId: "u1",
      planId: "p12",
      coachId: "c1",
      couponId: "k1",
      enrollDate: "2026-10-01",
      startDate: "2026-10-02",
      endDate: "2026-12-25",
      payment: { method: "upi", amount: 4500, paymentDate: expect.any(String), referenceId: "UTR998877", notes: "Paid at the studio" },
    });
    // Never the price, the discount, the status or the creator.
    expect(JSON.stringify(post.body)).not.toMatch(/basePrice|discountPercent|originalAmount|finalAmount|createdBy|status/);

    expect(screen.getByText("₹4,500 · UPI")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "View Client" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/users/clients/u1"));
  });

  it("a server refusal is shown on the review and nothing is marked as created", async () => {
    postResponse = () => json(400, { success: false, error: { code: "COUPON_INACTIVE", message: "Coupon WELCOME10 is not active today" } });
    renderAt();
    await toPayment();
    fireEvent.change(couponSelect(), { target: { value: "k1" } });
    fireEvent.click(cont());
    fireEvent.click(screen.getByRole("button", { name: "Create Client" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Coupon WELCOME10 is not active today");
    expect(screen.queryByText("Client Added Successfully")).toBeNull();
    expect(screen.getByRole("heading", { name: "Review Client" })).toBeTruthy();
  });

  it("16. Back keeps everything entered", async () => {
    renderAt();
    await toPayment();
    fireEvent.change(amountInput(), { target: { value: "4000" } });
    fireEvent.click(screen.getByRole("button", { name: /^Back$/ }));
    expect((screen.getByRole("combobox", { name: /Plan/ }) as HTMLSelectElement).value).toBe("p12");
    expect((screen.getByLabelText(/Start Date/) as HTMLInputElement).value).toBe("2026-10-02");
    fireEvent.click(screen.getByRole("button", { name: /^Back$/ }));
    expect(within(screen.getByLabelText("Selected user")).getByText("Rahul Sharma")).toBeTruthy();
    fireEvent.click(cont());
    fireEvent.click(cont());
    expect(amountInput().value).toBe("4000");
    expect(within(screen.getByLabelText("Payment summary")).getByRole("status").textContent).toBe("Short by₹999");
  });
});

describe("draft rules", () => {
  const filled = (): Draft => update(update(emptyDraft("2026-10-01"), { plan: PLANS[0] }), { coach: COACHES[0], user: USERS[0] });

  it("end date is start + the plan's weeks; the amount follows plan and coupon until typed", () => {
    expect(planEndDate("2026-03-05", 12)).toBe("2026-05-28"); // the legacy example
    let d = filled();
    expect(d.amount).toBe("4999");
    d = update(d, { coupon: COUPONS[1] });
    expect(pricing(d)).toEqual({ price: 4999, percent: 20, discount: 999, due: 4000 });
    expect(d.amount).toBe("4000");
    d = update(d, { amount: "3000", amountTouched: true });
    d = update(d, { coupon: null });
    expect(d.amount).toBe("3000");
  });

  it("start and end dates are optional and sent as null", () => {
    const d = filled();
    expect(validateStep(1, d).missing).toEqual([]);
    expect(toPayload(d)).toMatchObject({ startDate: null, endDate: null, couponId: null });
    expect(validateStep(2, { ...d, method: "bank_transfer" }).missing).toContain("reference");
    expect(validateStep(2, { ...d, method: "cash" }).missing).not.toContain("reference");
  });
});
