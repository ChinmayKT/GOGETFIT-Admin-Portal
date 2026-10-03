import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup, fireEvent, within, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { CoachDetailPage } from "./CoachDetailPage";
import { ToastProvider } from "../../components/feedback/ToastProvider";
import { tokenStore } from "../../api/client";

const coachRecord = {
  id: "c1",
  userId: "u-coach",
  user: { id: "u-coach", name: "Prajwal", phone: "918123260930", email: "prajwal@gogetfitonline.com", gender: "male", city: "Davangere", profilePicture: null, roles: ["user", "coach"], status: "active" },
  profile: { profilePicture: null, coverPicture: null, level: "LEVEL 1", specialization: null, description: null, languages: [], facebook: null, instagram: null, linkedin: null, transformations: 0, availableSlots: 0 },
  status: "active",
  createdBy: null,
  updatedBy: null,
  createdAt: null,
  updatedAt: null,
};

const row = (id: string, user: { id: string; name: string; phone: string; legacyUserId: number | null }, overrides: Record<string, unknown> = {}) => ({
  enrollmentId: id,
  legacyEnrollmentId: null,
  coachId: "c1",
  status: "active",
  hasStarted: true,
  enrollDate: "2026-09-01T00:00:00.000Z",
  startDate: "2026-09-02T00:00:00.000Z",
  endDate: "2026-11-25T00:00:00.000Z",
  user: { email: null, ...user },
  plan: { id: "p1", name: "12 WEEKS GOGETFIT PLAN", legacyPackageId: 15 },
  ...overrides,
});

const asha = { id: "u1", name: "Asha Rao", phone: "919900000001", legacyUserId: 227 };
const ravi = { id: "u2", name: "Ravi Kumar", phone: "919900000002", legacyUserId: null };

const CLIENTS = {
  coachId: "c1",
  summary: { totalEnrollments: 3, uniqueClients: 2, activeClients: 1, pendingClients: 1, endedClients: 1, attention: 0 },
  enrollments: [
    row("e3", asha),
    row("e2", ravi, { status: "not_started", hasStarted: false, startDate: null, endDate: null }),
    row("e1", asha, { status: "inactive", legacyEnrollmentId: 140, enrollDate: "2024-02-26T00:00:00.000Z" }),
  ],
};

const json = (status: number, payload: unknown) => new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
const ok = (data: unknown) => json(200, { success: true, data });
const requests: string[] = [];
let clientsResponse: () => Response;

const renderAt = (coach: object = coachRecord) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      requests.push(url);
      if (url.includes("/admin/coaches/c1/clients")) return clientsResponse();
      if (url.includes("/admin/gogetfit-plans")) return ok({ plans: [], pagination: { page: 1, pageSize: 100, total: 0, totalPages: 1 } });
      return ok({ coach });
    }),
  );
  const router = createMemoryRouter(
    [
      { path: "/coaches/:id", element: <CoachDetailPage /> },
      { path: "/users/clients/:userId", element: <p>Client details</p> },
    ],
    { initialEntries: ["/coaches/c1"] },
  );
  render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
  return router;
};

/** The clients live in the Clients tab of the coach details. */
const openClientsTab = async () => fireEvent.click(await screen.findByRole("tab", { name: "Clients" }));

beforeEach(() => {
  requests.length = 0;
  clientsResponse = () => ok(CLIENTS);
  tokenStore.set("t");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  tokenStore.clear();
});

describe("Coach details - clients", () => {
  it("Coach Profile shows the coach's own cover and profile pictures, full screen on click", async () => {
    renderAt({
      ...coachRecord,
      profile: {
        ...coachRecord.profile,
        coverPicture: { url: "http://10.0.2.2:3000/uploads/coaches/c1/cover/cover.jpg", storageKey: "c" },
        profilePicture: { url: "http://10.0.2.2:3000/uploads/coaches/c1/profile/me.jpg", storageKey: "p" },
      },
    });
    // Not above the tabs: only once Coach Profile is opened.
    await screen.findByRole("tab", { name: "Coach Profile" });
    expect(screen.queryByAltText("Prajwal cover picture")).toBeNull();
    expect(screen.queryByAltText("Prajwal profile picture")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Coach Profile" }));
    expect(screen.getByAltText("Prajwal cover picture").getAttribute("src")).toBe("/uploads/coaches/c1/cover/cover.jpg");
    expect(screen.getByAltText("Prajwal profile picture").getAttribute("src")).toBe("/uploads/coaches/c1/profile/me.jpg");

    fireEvent.click(screen.getByAltText("Prajwal cover picture"));
    expect(screen.getByRole("dialog", { name: "Prajwal cover picture" })).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Coach Profile shows placeholders when no picture has been uploaded", async () => {
    renderAt();
    await screen.findByRole("tab", { name: "Coach Profile" });
    expect(screen.queryByRole("img", { name: "No cover picture" })).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Coach Profile" }));
    expect(screen.getByRole("img", { name: "No cover picture" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "No profile picture" })).toBeTruthy();
  });

  it("coach details are tabbed like User and Client details: User Profile, Coach Profile, Plans, Clients", async () => {
    renderAt();
    const tabs = await screen.findAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["User Profile", "Coach Profile", "Plans", "Clients"]);
    // User Profile first; the other sections load only when opened.
    expect(screen.getByRole("tab", { name: "User Profile" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("User Profile", { selector: "p" })).toBeTruthy();
    expect(requests.some((u) => u.includes("/clients"))).toBe(false);

    fireEvent.click(screen.getByRole("tab", { name: "Coach Profile" }));
    expect(screen.getByText("Coach Profile", { selector: "p" })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Plans" }));
    expect(await screen.findByText("Available GoGetFit Plans")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Clients" }));
    expect(await screen.findByLabelText("Client statistics")).toBeTruthy();
  });

  it("loads the client statistics from the coach's own enrollments", async () => {
    renderAt();
    await openClientsTab();
    const stats = await screen.findByLabelText("Client statistics");
    expect(requests.some((u) => u.endsWith("/admin/coaches/c1/clients"))).toBe(true);
    const card = (label: string) => within(stats).getByLabelText(label).lastElementChild?.textContent;
    expect(card("Total Enrollments")).toBe("3");
    expect(card("Unique Clients")).toBe("2");
    expect(card("Active Clients")).toBe("1");
    expect(card("Pending Clients")).toBe("1");
  });

  it("renders one row per enrollment with name, phone, plan, dates and status", async () => {
    renderAt();
    await openClientsTab();
    await screen.findByLabelText("Client statistics");
    const table = screen.getByRole("table");
    const body = within(table).getAllByRole("row").slice(1);
    expect(body).toHaveLength(3);
    const first = within(body[0]);
    expect(first.getByText("Asha Rao")).toBeTruthy();
    expect(first.getByText("919900000001")).toBeTruthy();
    expect(first.getByText("12 WEEKS GOGETFIT PLAN")).toBeTruthy();
    expect(first.getByText("Active")).toBeTruthy();
    expect(within(body[1]).getByText("Not Started")).toBeTruthy();
    expect(within(body[2]).getByText("Expired")).toBeTruthy();
  });

  it("keeps every enrollment of a member who enrolled more than once", async () => {
    renderAt();
    await openClientsTab();
    await screen.findByLabelText("Client statistics");
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows.filter((r) => within(r).queryByText("Asha Rao"))).toHaveLength(2);
  });

  it("shows the legacy user id, and the enrollment's legacy id when there is one", async () => {
    renderAt();
    await openClientsTab();
    await screen.findByLabelText("Client statistics");
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("227")).toBeTruthy();
    expect(within(rows[2]).getByText("Enrollment 140")).toBeTruthy();
    // No legacy id: a dash, not a blank.
    expect(within(rows[1]).getAllByText("—").length).toBeGreaterThan(0);
  });

  it("a row opens that member's client details", async () => {
    const router = renderAt();
    await openClientsTab();
    await screen.findByLabelText("Client statistics");
    fireEvent.click(within(screen.getByRole("table")).getAllByRole("row")[1]);
    await waitFor(() => expect(router.state.location.pathname).toBe("/users/clients/u1"));
  });

  it("a failed load shows an error with a retry, never a crash", async () => {
    clientsResponse = () => json(500, { success: false, error: { code: "INTERNAL_ERROR", message: "x" } });
    renderAt();
    await openClientsTab();
    expect(await screen.findByText(/Could not load this coach's clients/)).toBeTruthy();
    clientsResponse = () => ok(CLIENTS);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByLabelText("Client statistics")).toBeTruthy();
  });
});
