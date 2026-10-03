import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ClientListPage } from "./ClientListPage";
import { tokenStore } from "../../api/client";
import type { EnrolledClientRow } from "../../api/enrolledClients";

/** One row of GET /api/admin/enrolled-clients, in the shape the backend returns. */
const makeRow = (id: string, overrides: Partial<EnrolledClientRow> = {}): EnrolledClientRow => ({
  id,
  status: "active",
  client: {
    id: `user-${id}`,
    name: "Chethan Kumar",
    phone: "918867507983",
    email: "chethan@example.com",
    legacyUserId: 298,
  },
  coach: { id: "coach-1", name: "Coach Prajwal", level: "LEVEL 1" },
  legacyCoachId: 13,
  legacyCoachName: "Prajwal A T",
  plan: { id: "plan-1", name: "12 WEEKS GOGETFIT PLAN", planType: "Enrollment", durationWeeks: 12 },
  coupon: { id: "coupon-1", code: "GGFLAUNCH10" },
  legacyCouponCode: "GGFLAUNCH10",
  transactionId: "pay_MjDojgzHsdsJeb",
  amount: 4999,
  currency: "INR",
  paymentStatus: "Success",
  enrollDate: "2023-10-01T18:30:00.000Z",
  startDate: "2023-10-08T18:30:00.000Z",
  endDate: "2024-01-01T18:30:00.000Z",
  hasStarted: true,
  legacyEnrollmentId: 63,
  ...overrides,
});

const listResponse = (rows: EnrolledClientRow[], total = rows.length, page = 1, pageSize = 10) =>
  new Response(
    JSON.stringify({
      success: true,
      data: {
        enrolledClients: rows,
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

const requests: string[] = [];

const renderPage = () =>
  render(
    <MemoryRouter>
      <ClientListPage />
    </MemoryRouter>,
  );

const stubFetch = (handler: (url: string) => Response) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      requests.push(url);
      return handler(url);
    }),
  );
};

describe("ClientListPage", () => {
  beforeEach(() => {
    requests.length = 0;
    tokenStore.set("test-admin-token");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    tokenStore.clear();
  });

  it("loads enrollments from the backend, not mock data", async () => {
    stubFetch(() => listResponse([makeRow("a")]));

    renderPage();

    await waitFor(() => expect(screen.getByText("Chethan Kumar")).toBeTruthy());
    expect(requests[0]).toContain("/admin/enrolled-clients");
    expect(screen.getByText("Coach Prajwal")).toBeTruthy();
    expect(screen.getByText("12 WEEKS GOGETFIT PLAN")).toBeTruthy();
    expect(screen.getByText("GGFLAUNCH10")).toBeTruthy();
    expect(screen.getByText("pay_MjDojgzHsdsJeb")).toBeTruthy();
    expect(screen.getByText("₹4,999")).toBeTruthy();
    // The real member identifier, not a generated GGF id.
    expect(screen.getByText("298")).toBeTruthy();
  });

  it("shows the member's photo, as the Users list does, and initials without one", async () => {
    const withPhoto = makeRow("a");
    withPhoto.client = { ...withPhoto.client!, profilePicture: "http://10.0.2.2:3000/uploads/profile/chethan.png" };
    const withoutPhoto = makeRow("b", { client: { id: "user-b", name: "Asha Rao", phone: "919900000000", email: null, legacyUserId: null, profilePicture: null } });
    stubFetch(() => listResponse([withPhoto, withoutPhoto]));
    renderPage();
    const img = (await screen.findByAltText("Chethan Kumar")) as HTMLImageElement;
    // Loaded from the portal's own origin, not the emulator host.
    expect(img.getAttribute("src")).toBe("/uploads/profile/chethan.png");
    expect(screen.getByText("AR")).toBeTruthy();
    expect(screen.getByText("919900000000")).toBeTruthy();
  });

  it("sends the Authorization header", async () => {
    let seenAuth: string | null = null;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        seenAuth = (init?.headers as Record<string, string>)?.Authorization ?? null;
        return listResponse([makeRow("a")]);
      }),
    );

    renderPage();

    await waitFor(() => expect(seenAuth).toBe("Bearer test-admin-token"));
  });

  it("shows the legacy coach's name when no Coach document is linked", async () => {
    // Every migrated row is in exactly this state today: no Coach document, but
    // m_coach's own name was preserved by the migration.
    stubFetch(() =>
      listResponse([
        makeRow("a", { coach: null, legacyCoachId: 17, legacyCoachName: "Karthik M" }),
      ]),
    );

    renderPage();

    await waitFor(() => expect(screen.getByText("Karthik M")).toBeTruthy());
    expect(screen.queryByText("Legacy #17")).toBeNull();
  });

  it("falls back to the legacy id only when even the name is missing", async () => {
    stubFetch(() =>
      listResponse([makeRow("a", { coach: null, legacyCoachId: 17, legacyCoachName: null })]),
    );

    renderPage();

    await waitFor(() => expect(screen.getByText("Legacy #17")).toBeTruthy());
  });

  it("falls back to the typed coupon code when none resolved", async () => {
    stubFetch(() =>
      listResponse([makeRow("a", { coupon: null, legacyCouponCode: "GOGETFIT10" })]),
    );

    renderPage();

    await waitFor(() => expect(screen.getByText("GOGETFIT10")).toBeTruthy());
  });

  it("shows a dash where the legacy data has nothing", async () => {
    stubFetch(() =>
      listResponse([
        makeRow("a", {
          coupon: null,
          legacyCouponCode: null,
          startDate: null,
          endDate: null,
          hasStarted: false,
          status: "not_started",
        }),
      ]),
    );

    renderPage();

    await waitFor(() => expect(screen.getByText("Not Started")).toBeTruthy());
    // Coupon, start and end are all empty for this row.
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });

  it("renders each of the four real statuses", async () => {
    stubFetch(() =>
      listResponse([
        makeRow("a", { status: "active" }),
        makeRow("b", { status: "inactive" }),
        makeRow("c", { status: "not_started" }),
        makeRow("d", { status: "deleted" }),
      ]),
    );

    renderPage();

    // Each label also exists as a filter option, so both occurrences are expected.
    await waitFor(() => expect(screen.getAllByText("Active").length).toBeGreaterThan(1));
    expect(screen.getAllByText("Expired").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Not Started").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Deleted").length).toBeGreaterThan(1);
    // Statuses the legacy system never recorded are not offered.
    expect(screen.queryByText("Pending Renewal")).toBeNull();
    expect(screen.queryByText("Cancelled")).toBeNull();
  });

  it("asks the server to filter by status", async () => {
    stubFetch(() => listResponse([makeRow("a")]));

    renderPage();
    await waitFor(() => expect(screen.getByText("Chethan Kumar")).toBeTruthy());

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "not_started" } });

    await waitFor(() =>
      expect(requests.some((url) => url.includes("status=not_started"))).toBe(true),
    );
  });

  it("pages on the server rather than in the browser", async () => {
    stubFetch(() => listResponse([makeRow("a")], 25));

    renderPage();
    await waitFor(() => expect(screen.getByText("Chethan Kumar")).toBeTruthy());

    fireEvent.click(screen.getByLabelText(/next/i));

    await waitFor(() => expect(requests.some((url) => url.includes("page=2"))).toBe(true));
    expect(requests[0]).toContain("pageSize=10");
  });

  it("shows the empty state when there are no enrollments", async () => {
    stubFetch(() => listResponse([], 0));

    renderPage();

    await waitFor(() => expect(screen.getByText("No enrollments found")).toBeTruthy());
  });

  it("shows an error state when the request fails", async () => {
    stubFetch(() => errorResponse(500, "INTERNAL_ERROR", "Something broke"));

    renderPage();

    await waitFor(() => expect(screen.getByText("Something went wrong")).toBeTruthy());
  });
});
