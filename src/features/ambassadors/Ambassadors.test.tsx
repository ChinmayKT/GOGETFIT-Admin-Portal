import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { AmbassadorListPage } from "./AmbassadorListPage";
import { AmbassadorDetailPage } from "./AmbassadorDetailPage";
import { ToastProvider } from "../../components/feedback/ToastProvider";
import { tokenStore } from "../../api/client";
import type { Ambassador, AmbassadorDetail, ReferralOrder } from "../../types/ambassador";

/**
 * Brand Ambassadors against a stubbed backend that answers the real admin
 * endpoints. The pages hold no data of their own: every figure on screen is
 * what the API returned, and every filter is sent to the API.
 */

const ambassador = (i: number, overrides: Partial<Ambassador> = {}): Ambassador => ({
  id: `a${i}`,
  name: `Ambassador ${i}`,
  userId: `u${i}`,
  email: `amb${i}@example.com`,
  mobile: `+9190000000${String(i).padStart(2, "0")}`,
  couponCode: `AMB${String(i).padStart(4, "0")}`,
  status: "Active",
  registeredAt: "2026-11-01T10:00:00.000Z",
  discountPercent: 5,
  commissionPercent: 5,
  successfulReferrals: 0,
  salesAmount: 0,
  commissionEarned: 0,
  ...overrides,
});

const CHINMAY = ambassador(1, {
  name: "Chinmay K T",
  email: "chinmay@example.com",
  couponCode: "CHI0001",
  commissionPercent: 8,
  successfulReferrals: 13,
  salesAmount: 123500,
  commissionEarned: 9880,
});
const DETAIL: AmbassadorDetail = { ...CHINMAY, discountsGiven: 6500, commissionPaid: 0, commissionPayable: 8892 };

const referral = (overrides: Partial<ReferralOrder> = {}): ReferralOrder => ({
  id: "r1",
  ambassadorId: "a1",
  ambassadorName: "Chinmay K T",
  customerName: "Rahul Verma",
  customerUserId: "u-rahul",
  email: "rahul@example.com",
  mobile: "+919000000002",
  couponCode: "CHI0001",
  planName: "12 WEEKS GOGETFIT PLAN",
  planId: "p1",
  orderId: "o1",
  originalAmount: 10000,
  discountPercent: 5,
  discountAmount: 500,
  paidAmount: 9500,
  currency: "INR",
  paymentId: "pay_rahul_1",
  gatewayReference: null,
  paymentStatus: "Success",
  paymentVerification: "simulated",
  referralStatus: "Successful",
  commissionPercent: 8,
  grossCommission: 760,
  tdsAmount: 76,
  netCommission: 684,
  commissionStatus: "pending",
  purchasedAt: "2026-11-07T09:00:00.000Z",
  createdAt: "2026-11-07T09:00:00.000Z",
  updatedAt: "2026-11-07T09:00:00.000Z",
  ...overrides,
});

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { "Content-Type": "application/json" } });
const err = (status: number, code: string, message: string) =>
  new Response(JSON.stringify({ success: false, error: { code, message } }), { status, headers: { "Content-Type": "application/json" } });

let ambassadors: Ambassador[];
let statusFails: boolean;
let rate: number;
let octoberPaid: boolean;
const requests: { method: string; url: URL; body: unknown }[] = [];
const lastQuery = (path: string) => [...requests].reverse().find((r) => r.url.pathname === path)?.url.searchParams;

const backend = (method: string, url: URL, body: unknown): Response => {
  const path = url.pathname.replace(/^\/api/, "");
  const q = url.searchParams;
  if (path === "/admin/ambassadors") {
    const page = Number(q.get("page") ?? 1);
    const pageSize = Number(q.get("pageSize") ?? 10);
    const search = (q.get("query") ?? "").toLowerCase();
    const rows = ambassadors.filter(
      (a) => (!search || [a.name, a.couponCode, a.email].some((v) => v?.toLowerCase().includes(search))) && (!q.get("status") || a.status === q.get("status")),
    );
    return ok({
      ambassadors: rows.slice((page - 1) * pageSize, page * pageSize),
      pagination: { page, pageSize, total: rows.length, totalPages: Math.ceil(rows.length / pageSize) },
      summary: { totalAmbassadors: ambassadors.length, totalReferrals: 13, totalSales: 123500, totalCommissionPayable: 8892 },
    });
  }
  if (path === "/admin/ambassadors/a1/status" && method === "PATCH") {
    if (statusFails) return err(409, "AMBASSADOR_STATUS_UNCHANGED", "The status changed meanwhile; reload and try again");
    const status = (body as { status: Ambassador["status"] }).status;
    ambassadors = ambassadors.map((a) => (a.id === "a1" ? { ...a, status } : a));
    return ok({ ambassador: { ...DETAIL, status } });
  }
  if (path === "/admin/ambassadors/a1/commission" && method === "PATCH") {
    const pct = (body as { commissionPercent: number }).commissionPercent;
    if (pct < 5 || pct > 10) return err(400, "VALIDATION_ERROR", "commissionPercent must be a whole number from 5 to 10");
    rate = pct;
    return ok({ ambassador: { ...DETAIL, commissionPercent: rate } });
  }
  if (path === "/admin/ambassadors/a1/payouts" && method === "POST") {
    const input = body as { amount: number };
    if (input.amount !== 1281) return err(400, "VALIDATION_ERROR", "The amount must equal the net payable for 2026-10: ₹1281");
    octoberPaid = true;
    return ok({ payouts: payouts() });
  }
  if (path === "/admin/ambassadors/a1") {
    return ok({
      ambassador: {
        ...DETAIL,
        commissionPercent: rate,
        status: ambassadors.find((a) => a.id === "a1")!.status,
      },
    });
  }
  if (path === "/admin/ambassadors/a1/referrals") {
    const rows = q.get("referralStatus") === "Pending" ? [referral({ id: "r2", customerName: "Neha Sharma", referralStatus: "Pending" })] : [referral()];
    return ok({ referrals: rows, pagination: { page: 1, pageSize: 10, total: rows.length, totalPages: 1 }, plans: [{ id: "p1", name: "12 WEEKS GOGETFIT PLAN" }] });
  }
  if (path === "/admin/ambassadors/a1/payouts") return ok({ payouts: payouts() });
  if (path === "/admin/ambassadors/a1/activity") {
    return ok({
      activity: [
        { id: "e2", at: "2026-11-07T09:00:00.000Z", action: "Referral successful", detail: "Order o1 · 12 WEEKS GOGETFIT PLAN", actor: "System" },
        { id: "e1", at: "2026-10-19T06:30:00.000Z", action: "Ambassador registered", detail: "Joined the programme", actor: "Chinmay K T" },
      ],
    });
  }
  return err(404, "AMBASSADOR_NOT_FOUND", "Ambassador not found");
};

const payouts = () => [
  { id: "2026-11", periodKey: "2026-11", period: "Nov 2026", eligibleOrderValue: 9500, commissionPercent: 8, grossCommission: 760, tdsPercent: 10, tds: 76, netPayable: 684, status: "Pending", amountPaid: null, transactionReference: null, paidAt: null, canRecord: false },
  octoberPaid
    ? { id: "2026-10", periodKey: "2026-10", period: "Oct 2026", eligibleOrderValue: 28500, commissionPercent: 5, grossCommission: 1425, tdsPercent: 10, tds: 144, netPayable: 1281, status: "Paid", amountPaid: 1281, transactionReference: "UTR123456", paidAt: "2026-11-07T00:00:00.000Z", canRecord: false }
    : { id: "2026-10", periodKey: "2026-10", period: "Oct 2026", eligibleOrderValue: 28500, commissionPercent: 5, grossCommission: 1425, tdsPercent: 10, tds: 144, netPayable: 1281, status: "Pending", amountPaid: null, transactionReference: null, paidAt: null, canRecord: true },
];

const renderAt = (path: string) => {
  const router = createMemoryRouter(
    [
      { path: "/ambassadors", element: <AmbassadorListPage /> },
      { path: "/ambassadors/:id", element: <AmbassadorDetailPage /> },
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

const rowOf = (text: string) => screen.getByText(text).closest("tr")!;

beforeEach(() => {
  ambassadors = [CHINMAY, ...Array.from({ length: 11 }, (_, i) => ambassador(i + 2))];
  statusFails = false;
  rate = 8;
  octoberPaid = false;
  requests.length = 0;
  tokenStore.set("t");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input, "http://localhost");
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      requests.push({ method: init?.method ?? "GET", url, body });
      return backend(init?.method ?? "GET", url, body);
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  tokenStore.clear();
});

describe("Brand Ambassadors list", () => {
  it("shows the server's rows and summary", async () => {
    renderAt("/ambassadors");
    expect(await screen.findByText("Chinmay K T")).toBeTruthy();
    expect(screen.getByText("CHI0001")).toBeTruthy();
    expect(screen.getByText("Total Ambassadors")).toBeTruthy();
    expect(await screen.findByText("12")).toBeTruthy();
    // The summary card and Chinmay's row both show the server's figure.
    expect(screen.getAllByText("₹1,23,500").length).toBe(2);
  });

  it("sends search, status, registration and sort to the API", async () => {
    renderAt("/ambassadors");
    await screen.findByText("Chinmay K T");

    fireEvent.change(screen.getByLabelText(/Search by name/), { target: { value: "CHI0001" } });
    await waitFor(() => expect(lastQuery("/api/admin/ambassadors")?.get("query")).toBe("CHI0001"));
    await waitFor(() => expect(screen.queryByText("Ambassador 2")).toBeNull());

    fireEvent.change(screen.getByLabelText(/Search by name/), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "Inactive" } });
    await waitFor(() => expect(lastQuery("/api/admin/ambassadors")?.get("status")).toBe("Inactive"));

    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "successfulReferrals:desc" } });
    await waitFor(() => {
      const q = lastQuery("/api/admin/ambassadors");
      expect(q?.get("sortKey")).toBe("successfulReferrals");
      expect(q?.get("sortDir")).toBe("desc");
    });
  });

  it("pages through the server's total", async () => {
    renderAt("/ambassadors");
    await screen.findByText(/1–10 of 12/);
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(await screen.findByText(/11–12 of 12/)).toBeTruthy();
    expect(lastQuery("/api/admin/ambassadors")?.get("page")).toBe("2");
  });

  it("deactivating asks first, then PATCHes the status", async () => {
    renderAt("/ambassadors");
    await screen.findByText("Chinmay K T");
    fireEvent.click(within(rowOf("Chinmay K T")).getByLabelText("Deactivate"));
    expect(await screen.findByText("Deactivate Chinmay K T?")).toBeTruthy();
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Deactivate" }));
    await waitFor(() => expect(within(rowOf("Chinmay K T")).getByText("Inactive")).toBeTruthy());
    const patch = requests.find((r) => r.method === "PATCH")!;
    expect(patch.url.pathname).toBe("/api/admin/ambassadors/a1/status");
    expect(patch.body).toEqual({ status: "Inactive" });
  });

  it("a refused status change shows the server's reason and changes nothing", async () => {
    statusFails = true;
    renderAt("/ambassadors");
    await screen.findByText("Chinmay K T");
    fireEvent.click(within(rowOf("Chinmay K T")).getByLabelText("Deactivate"));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Deactivate" }));
    expect(await screen.findByText("The status changed meanwhile; reload and try again")).toBeTruthy();
    expect(within(rowOf("Chinmay K T")).getByText("Active")).toBeTruthy();
  });

  it("a row opens the ambassador's details", async () => {
    const router = renderAt("/ambassadors");
    await screen.findByText("Chinmay K T");
    fireEvent.click(screen.getByText("Chinmay K T"));
    await waitFor(() => expect(router.state.location.pathname).toBe("/ambassadors/a1"));
  });
});

describe("Ambassador details", () => {
  it("shows the profile, the summaries and the full referral transaction", async () => {
    renderAt("/ambassadors/a1");
    expect(await screen.findByText("chinmay@example.com")).toBeTruthy();
    expect(screen.getByText("Commission Earned")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Commission 8%" })).toBeTruthy();
    expect(screen.getByText("₹1,23,500")).toBeTruthy();
    expect(screen.getByText("₹6,500")).toBeTruthy();
    expect(await screen.findByText("Rahul Verma")).toBeTruthy();
    const row = rowOf("Rahul Verma");
    for (const text of ["rahul@example.com", "+919000000002", "12 WEEKS GOGETFIT PLAN", "pay_rahul_1", "Success", "Successful"]) {
      expect(within(row).getByText(text)).toBeTruthy();
    }
  });

  it("sends referral filters to the API; the plan filter lists the server's plans", async () => {
    renderAt("/ambassadors/a1");
    await screen.findByText("Rahul Verma");
    fireEvent.change(screen.getByLabelText("Referral status"), { target: { value: "Pending" } });
    expect(await screen.findByText("Neha Sharma")).toBeTruthy();
    expect(lastQuery("/api/admin/ambassadors/a1/referrals")?.get("referralStatus")).toBe("Pending");

    await waitFor(() => expect(within(screen.getByLabelText("Plan")).getByText("12 WEEKS GOGETFIT PLAN")).toBeTruthy());
    fireEvent.change(screen.getByLabelText("Plan"), { target: { value: "p1" } });
    await waitFor(() => expect(lastQuery("/api/admin/ambassadors/a1/referrals")?.get("planId")).toBe("p1"));
  });

  it("a referral row opens its complete details", async () => {
    renderAt("/ambassadors/a1");
    fireEvent.click((await screen.findByText("Rahul Verma")).closest("tr")!);
    expect(await screen.findByText("Referral Details")).toBeTruthy();
    expect(screen.getByText("Gateway reference")).toBeTruthy();
    expect(screen.getByText("Ambassador user ID")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Close"));
    await waitFor(() => expect(screen.queryByText("Referral Details")).toBeNull());
  });

  it("the commission tab shows the ledger's TDS; the activity tab the audit trail", async () => {
    renderAt("/ambassadors/a1?tab=payouts");
    expect(await screen.findByText("Nov 2026")).toBeTruthy();
    expect(screen.getAllByText("TDS (10%)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("tab", { name: "Activity Log" }));
    expect(await screen.findByText("Ambassador registered")).toBeTruthy();
    expect(screen.getByText("Referral successful")).toBeTruthy();
  });

  it("commission rate: saved for future referrals; an out-of-range value shows the server's message", async () => {
    renderAt("/ambassadors/a1");
    fireEvent.click(await screen.findByRole("button", { name: "Commission 8%" }));
    const dialog = await screen.findByRole("dialog", { name: "Commission rate" });
    const input = within(dialog).getByLabelText(/Commission \(%\)/);

    fireEvent.change(input, { target: { value: "12" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save rate" }));
    expect(await within(dialog).findByText(/from 5 to 10/)).toBeTruthy();

    fireEvent.change(input, { target: { value: "10" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save rate" }));
    expect(await screen.findByRole("button", { name: "Commission 10%" })).toBeTruthy();
    expect(requests.filter((r) => r.method === "PATCH").at(-1)!.body).toEqual({ commissionPercent: 10 });
  });

  it("record payout: prefilled with the net payable, needs a reference, updates the period", async () => {
    renderAt("/ambassadors/a1?tab=payouts");
    expect(await screen.findByText("Oct 2026")).toBeTruthy();
    // Only the finished month can be recorded.
    expect(screen.getAllByRole("button", { name: "Record payout" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Record payout" }));
    const dialog = await screen.findByRole("dialog", { name: /Record payout · Oct 2026/ });
    expect((within(dialog).getByLabelText(/Amount/) as HTMLInputElement).value).toBe("1281");

    fireEvent.click(within(dialog).getByRole("button", { name: "Record payout" }));
    expect(await within(dialog).findByText("A payment reference is required")).toBeTruthy();

    fireEvent.change(within(dialog).getByLabelText(/Payment reference/), { target: { value: "UTR123456" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Record payout" }));
    expect(await screen.findByText("UTR123456")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Record payout" })).toBeNull();
    const post = requests.find((r) => r.method === "POST" && r.url.pathname.endsWith("/payouts"))!;
    expect(post.body).toMatchObject({ period: "2026-10", amount: 1281, reference: "UTR123456", status: "Paid" });
  });

  it("an unknown ambassador says so", async () => {
    renderAt("/ambassadors/nope");
    expect(await screen.findByText("Ambassador not found")).toBeTruthy();
  });
});
