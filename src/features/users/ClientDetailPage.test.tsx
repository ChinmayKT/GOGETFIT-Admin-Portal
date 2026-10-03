import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { ClientListPage } from "./ClientListPage";
import { ClientDetailPage } from "./ClientDetailPage";
import { UserDetailPage } from "./UserDetailPage";
import { tokenStore } from "../../api/client";
import type { EnrolledClientRow } from "../../api/enrolledClients";
import type { AdminUser } from "../../types/admin";

const user: AdminUser = {
  id: "u1",
  phone: { raw: "8867507983", normalized: "918867507983" },
  profile: {
    name: "Chethan Kumar",
    email: "chethan@example.com",
    isEmailVerified: true,
    dateOfBirth: null,
    age: 31,
    gender: "male",
    city: "Bengaluru",
    profilePicture: null,
    freeDietPlanId: null,
    fitnessProfile: { height: 175, weight: 80, bodyFatPercentage: null, activityLevel: null, foodType: null, goal: "Fat loss", bmr: null, tdee: null },
  },
  profileCompleted: true,
  roles: ["user", "client"],
  status: "active",
  legacy: { source: "gogetfit", userId: 298 },
  createdAt: "2026-09-22T07:50:01.000Z",
  updatedAt: null,
};

const row = (id: string, overrides: Partial<EnrolledClientRow> = {}): EnrolledClientRow => ({
  id,
  status: "inactive",
  client: { id: "u1", name: "Chethan Kumar", phone: "918867507983", email: null, legacyUserId: 298 },
  coach: null,
  legacyCoachId: 13,
  legacyCoachName: "Prajwal A T",
  plan: { id: "p1", name: "12 WEEKS GOGETFIT PLAN", planType: "Enrollment", durationWeeks: 12 },
  coupon: null,
  legacyCouponCode: "GGFLAUNCH10",
  transactionId: `pay_${id}`,
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

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { "Content-Type": "application/json" } });
const page = (rows: EnrolledClientRow[]) =>
  ok({ enrolledClients: rows, pagination: { page: 1, pageSize: 100, total: rows.length, totalPages: 1 } });

/** The purchase card around an element (not its header: both class names contain "purchase"). */
const cardOf = (el: HTMLElement) => {
  let node: HTMLElement | null = el;
  while (node && !Array.from(node.classList).some((c) => /(^|_)purchase(_|$)/.test(c))) node = node.parentElement;
  return node as HTMLElement;
};

const requests: string[] = [];
const stubFetch = (handler: (url: string) => Response) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      requests.push(String(input));
      return handler(String(input));
    }),
  );

const renderAt = (path: string) => {
  const router = createMemoryRouter(
    [
      { path: "/users/clients", element: <ClientListPage /> },
      { path: "/users/clients/:userId", element: <ClientDetailPage /> },
      { path: "/users/:id", element: <UserDetailPage /> },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
  return router;
};

const rows = [
  row("e2", {
    status: "active",
    coach: { id: "c1", name: "Siri Shankar C", level: "LEVEL 1", profilePicture: "http://10.0.2.2:3000/uploads/coaches/c1/profile/siri.jpg" },
    plan: { id: "p2", name: "24 WEEKS GOGETFIT PLAN", planType: "Renewal", durationWeeks: 24 },
    amount: 8999,
    enrollDate: "2024-05-26T00:00:00.000Z",
    startDate: "2024-06-01T00:00:00.000Z",
    endDate: "2026-12-01T00:00:00.000Z",
  }),
  row("e1"),
];

beforeEach(() => {
  requests.length = 0;
  tokenStore.set("t");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  tokenStore.clear();
});

describe("Clients → Client detail", () => {
  it("clicking a client row opens the client detail screen, not the user record", async () => {
    stubFetch((url) => (url.includes("/admin/users/") ? ok({ user }) : page(rows)));
    const router = renderAt("/users/clients");
    fireEvent.click((await screen.findAllByText("Chethan Kumar"))[0]);
    await waitFor(() => expect(router.state.location.pathname).toBe("/users/clients/u1"));
    expect(await screen.findByRole("tab", { name: /Overview/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Back to Clients/ })).toBeTruthy();
    expect(screen.queryByText(/Back to Users/)).toBeNull();
  });

  it("the member's photo shows in the header and opens full screen, as on User details", async () => {
    const withPhoto = { ...user, profile: { ...user.profile, profilePicture: "http://10.0.2.2:3000/uploads/profile/u1.png" } };
    stubFetch((url) => (url.includes("/admin/users/") ? ok({ user: withPhoto }) : page(rows)));
    renderAt("/users/clients/u1");
    fireEvent.click(await screen.findByRole("button", { name: "View Chethan Kumar's profile photo" }));
    const dialog = screen.getByRole("dialog", { name: "Chethan Kumar - profile photo" });
    expect(dialog.querySelector("img")!.getAttribute("src")).toBe("/uploads/profile/u1.png");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("loads the member and only their enrollments, newest first", async () => {
    stubFetch((url) => (url.includes("/admin/users/") ? ok({ user }) : page(rows)));
    renderAt("/users/clients/u1");
    await screen.findByRole("tab", { name: /Overview/ });
    expect(requests.some((u) => u.endsWith("/admin/users/u1"))).toBe(true);
    const list = requests.find((u) => u.includes("/admin/enrolled-clients"))!;
    expect(list).toContain("userId=u1");
    expect(list).toContain("sortKey=enrollDate");
    expect(list).toContain("sortDir=desc");
  });

  it("has the same tab layout as user details, with counts", async () => {
    stubFetch((url) =>
      url.includes("/questionnaires")
        ? ok({ questionnaires: [{ questionnaireId: "q1", status: "submitted", questions: [] }], total: 1 })
        : url.includes("/body-metrics")
          ? ok({ bodyMetrics: [], total: 0 })
          : url.includes("/admin/users/")
          ? ok({ user })
          : page(rows),
    );
    renderAt("/users/clients/u1");
    await screen.findByRole("tab", { name: /Overview/ });
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["Overview", "Profile", "Plans2", "Payments2", "Coaches2", "Questionnaires1", "Body Metrics0"]);
    expect(screen.getByRole("tab", { name: /Overview/ }).getAttribute("aria-selected")).toBe("true");
  });

  it("Overview: a summary of everything bought and the current plan", async () => {
    stubFetch((url) => (url.includes("/admin/users/") ? ok({ user }) : page(rows)));
    renderAt("/users/clients/u1");
    await screen.findByRole("tab", { name: /Overview/ });
    // Summary: 2 plans, ₹4,999 + ₹8,999, the active plan and its coach.
    const stat = (label: string) => screen.getAllByText(label)[0].nextElementSibling?.textContent;
    expect(await screen.findByText("Plans Bought")).toBeTruthy();
    expect(stat("Plans Bought")).toBe("2");
    expect(stat("Total Paid")).toBe("₹13,998");
    expect(stat("Current Plan")).toBe("24 WEEKS GOGETFIT PLAN");
    // The current plan's card, not the older one.
    expect(screen.getAllByText(/WEEKS GOGETFIT PLAN/, { selector: "p" }).map((p) => p.textContent)).toEqual(["24 WEEKS GOGETFIT PLAN"]);
  });

  it("Profile: the member's details", async () => {
    stubFetch((url) => (url.includes("/admin/users/") ? ok({ user }) : page(rows)));
    renderAt("/users/clients/u1");
    fireEvent.click(await screen.findByRole("tab", { name: /Profile/ }));
    expect(screen.getByText("chethan@example.com")).toBeTruthy();
    expect(screen.getByText("Bengaluru")).toBeTruthy();
    expect(screen.getByText("Fat loss")).toBeTruthy();
    expect(screen.getByText("175 cm")).toBeTruthy();
  });

  it("Payments: one row per payment with the total", async () => {
    stubFetch((url) => (url.includes("/admin/users/") ? ok({ user }) : page(rows)));
    renderAt("/users/clients/u1");
    fireEvent.click(await screen.findByRole("tab", { name: /Payments/ }));
    expect(screen.getByText("Total paid ₹13,998")).toBeTruthy();
    const table = screen.getByRole("table");
    expect(within(table).getByText("pay_e1")).toBeTruthy();
    expect(within(table).getByText("pay_e2")).toBeTruthy();
    expect(within(table).getByText("₹8,999")).toBeTruthy();
  });

  it("Payments and Plans: an admin-recorded manual payment shows its method and reference", async () => {
    const manual = row("e3", {
      transactionId: null,
      paymentMethod: "bank_transfer",
      paymentReference: "UTR123456",
      source: "admin_manual",
      enrollDate: "2026-09-30T18:30:00.000Z",
    });
    stubFetch((url) => (url.includes("/admin/users/") ? ok({ user }) : page([manual, ...rows])));
    renderAt("/users/clients/u1");
    fireEvent.click(await screen.findByRole("tab", { name: /Payments/ }));
    const table = within(screen.getByRole("table"));
    expect(table.getByText("Bank Transfer")).toBeTruthy();
    expect(table.getByText("UTR123456")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: /Plans/ }));
    expect(screen.getByText("Reference")).toBeTruthy();
    expect(screen.getAllByText("UTR123456").length).toBeGreaterThan(0);
  });

  it("Coaches: every coach the member has had, current one marked", async () => {
    stubFetch((url) => (url.includes("/admin/users/") ? ok({ user }) : page(rows)));
    renderAt("/users/clients/u1");
    fireEvent.click(await screen.findByRole("tab", { name: /Coaches/ }));
    expect(screen.getByText("Siri Shankar C")).toBeTruthy();
    expect(screen.getByText("Prajwal A T")).toBeTruthy();
    expect(screen.getByText("Current coach")).toBeTruthy();

    // Just coach, level and plan name - no plan details here.
    expect(within(screen.getByLabelText("Plans with Siri Shankar C")).getByText("24 WEEKS GOGETFIT PLAN")).toBeTruthy();
    expect(within(screen.getByLabelText("Plans with Prajwal A T")).getByText("12 WEEKS GOGETFIT PLAN")).toBeTruthy();
    expect(screen.getByText("LEVEL 1")).toBeTruthy();
    // The coach's own photo; the legacy coach falls back to initials.
    expect((screen.getByAltText("Siri Shankar C") as HTMLImageElement).getAttribute("src")).toBe("/uploads/coaches/c1/profile/siri.jpg");
    expect(screen.getByText("PA")).toBeTruthy();
    expect(screen.queryByText("Enrolled Date")).toBeNull();
    expect(screen.queryByText("Plans Coached")).toBeNull();
  });

  it("Plans: every purchase with amount, dates, coach and payment", async () => {
    stubFetch((url) => (url.includes("/admin/users/") ? ok({ user }) : page(rows)));
    renderAt("/users/clients/u1");
    fireEvent.click(await screen.findByRole("tab", { name: /Plans/ }));
    const cards = screen.getAllByText(/WEEKS GOGETFIT PLAN/, { selector: "p" });
    expect(cards.map((c) => c.textContent)).toEqual(["24 WEEKS GOGETFIT PLAN", "12 WEEKS GOGETFIT PLAN"]);

    const newest = within(cardOf(cards[0]));
    expect(newest.getByText("₹8,999")).toBeTruthy();
    expect(newest.getByText("Active")).toBeTruthy();
    expect(newest.getByText("Siri Shankar C")).toBeTruthy();

    const older = within(cardOf(cards[1]));
    expect(older.getByText("₹4,999")).toBeTruthy();
    expect(older.getByText("Expired")).toBeTruthy();
    // No Coach document: the legacy coach name, and the typed coupon code.
    expect(older.getByText("Prajwal A T")).toBeTruthy();
    expect(older.getByText("GGFLAUNCH10")).toBeTruthy();
    expect(older.getByText("pay_e1")).toBeTruthy();
  });

  it("a member with no enrollments shows an empty purchase list", async () => {
    stubFetch((url) => (url.includes("/admin/users/") ? ok({ user }) : page([])));
    renderAt("/users/clients/u1");
    expect(await screen.findByText("No plans bought")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: /Plans/ }));
    expect(screen.getByText("No plans bought")).toBeTruthy();
  });

  it("an unknown client is a not-found state with a way back", async () => {
    stubFetch(() => new Response(JSON.stringify({ success: false, error: { code: "NOT_FOUND", message: "x" } }), { status: 404 }));
    const router = renderAt("/users/clients/nope");
    expect(await screen.findByText("Client not found")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Back to Clients/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/users/clients"));
  });

  it("Questionnaires: every submitted questionnaire with each question and the member's answer", async () => {
    const questionnaire = {
      questionnaireId: "q1",
      enrollmentId: "e2",
      status: "submitted",
      submittedAt: "2024-05-27T10:00:00.000Z",
      updatedAt: "2024-05-27T10:00:00.000Z",
      plan: { id: "p2", name: "24 WEEKS GOGETFIT PLAN", planType: "Renewal", durationWeeks: 24 },
      coach: { id: "c1", name: "Siri Shankar C", level: "LEVEL 1" },
      enrollment: { id: "e2", enrollDate: "2024-05-26T00:00:00.000Z", startDate: null, endDate: null },
      questions: [
        { key: "goal", step: "basics", stepTitle: "Basic Information", question: "Goal", type: "singleChoice", answer: "Fat / Weight Loss" },
        { key: "profession", step: "basics", stepTitle: "Basic Information", question: "Profession", type: "shortText", answer: null },
        { key: "trainingLevel", step: "fitness", stepTitle: "Fitness & Lifestyle", question: "Rate your current training level (0-10)", type: "slider", answer: 6 },
      ],
    };
    stubFetch((url) =>
      url.includes("/questionnaires") ? ok({ questionnaires: [questionnaire], total: 1 }) : url.includes("/admin/users/") ? ok({ user }) : page(rows),
    );
    renderAt("/users/clients/u1");
    fireEvent.click(await screen.findByRole("tab", { name: /Questionnaires/ }));

    // The record's stored status, then its submission date.
    expect(await screen.findByText("Submitted")).toBeTruthy();
    expect(screen.getByText("27/05/2024")).toBeTruthy();
    expect(requests.some((r) => r.includes("/admin/users/u1/questionnaires"))).toBe(true);
    expect(screen.getByText("Plan 1: 24 WEEKS GOGETFIT PLAN · Coach Siri Shankar C · LEVEL 1 · Enrolled 26/05/2024")).toBeTruthy();
    expect(screen.getByText("Basic Information")).toBeTruthy();
    expect(screen.getByText("Fitness & Lifestyle")).toBeTruthy();
    expect(screen.getByText("Goal").nextElementSibling?.textContent).toBe("Fat / Weight Loss");
    expect(screen.getByText("Profession").nextElementSibling?.textContent).toBe("—");
    expect(screen.getByText("Rate your current training level (0-10)").nextElementSibling?.textContent).toBe("6 / 10");
  });

  it("Questionnaires: an accordion, latest on top, one open at a time", async () => {
    const make = (id: string, plan: string, submittedAt: string, answer: string) => ({
      questionnaireId: id,
      enrollmentId: `e-${id}`,
      status: "submitted",
      submittedAt,
      updatedAt: submittedAt,
      plan: { id: `p-${id}`, name: plan, planType: "Enrollment", durationWeeks: 12 },
      coach: { id: "c1", name: "Prajwal", level: "LEVEL 1" },
      questions: [{ key: "goal", step: "basics", stepTitle: "Basic Information", question: "Goal", type: "singleChoice", answer }],
    });
    // Newest first, as the API sends them.
    const list = [
      make("q2", "24 WEEKS GOGETFIT PLAN", "2025-06-02T10:00:00.000Z", "Maintain Weight"),
      make("q1", "12 WEEKS GOGETFIT PLAN", "2025-01-02T10:00:00.000Z", "Fat / Weight Loss"),
    ];
    stubFetch((url) =>
      url.includes("/questionnaires") ? ok({ questionnaires: list, total: 2 }) : url.includes("/admin/users/") ? ok({ user }) : page(rows),
    );
    renderAt("/users/clients/u1");
    fireEvent.click(await screen.findByRole("tab", { name: /Questionnaires/ }));

    const heads = await screen.findAllByRole("button", { name: /Questionnaire \d/ });
    expect(heads.map((h) => h.textContent?.match(/Questionnaire \d/)?.[0])).toEqual(["Questionnaire 2", "Questionnaire 1"]);
    expect(heads[0].textContent).toContain("Latest");
    expect(heads[1].textContent).toContain("Plan 1: 12 WEEKS GOGETFIT PLAN");
    // The latest is open; the older one is closed.
    expect(heads.map((h) => h.getAttribute("aria-expanded"))).toEqual(["true", "false"]);
    expect(screen.getByText("Goal").nextElementSibling?.textContent).toBe("Maintain Weight");

    // Opening the older one closes the latest.
    fireEvent.click(heads[1]);
    expect(heads.map((h) => h.getAttribute("aria-expanded"))).toEqual(["false", "true"]);
    expect(screen.getAllByText("Goal")).toHaveLength(1);
    expect(screen.getByText("Goal").nextElementSibling?.textContent).toBe("Fat / Weight Loss");

    // And it can be closed again.
    fireEvent.click(heads[1]);
    expect(screen.queryByText("Goal")).toBeNull();
  });

  it("Questionnaires: says so when none has been submitted", async () => {
    stubFetch((url) =>
      url.includes("/questionnaires") ? ok({ questionnaires: [], total: 0 }) : url.includes("/admin/users/") ? ok({ user }) : page(rows),
    );
    renderAt("/users/clients/u1");
    fireEvent.click(await screen.findByRole("tab", { name: /Questionnaires/ }));
    expect(await screen.findByText("No questionnaire submitted")).toBeTruthy();
  });

  describe("Body Metrics tab", () => {
    const media = (enrollment: string, slot: string, ext = "jpg") => ({
      url: `http://10.0.2.2:3000/uploads/body-metrics/${enrollment}/${slot}/x.${ext}`,
      storageKey: `body-metrics/${enrollment}/${slot}/x.${ext}`,
    });
    const measurements = {
      age: 32, height: 170.7, weight: 66, neck: 38, chest: 95.5, rightArm: 32, leftArm: 31.5,
      waist: 85, hips: 95, rightThigh: 55, leftThigh: 54.5,
    };
    const record = (id: string, enrollment: string, overrides: Record<string, unknown> = {}) => ({
      bodyMetricsId: id,
      enrollmentId: enrollment,
      status: "submitted",
      submittedAt: "2026-10-03T06:42:56.484Z",
      measurements,
      media: { front: media(enrollment, "front"), side: media(enrollment, "side"), back: media(enrollment, "back"), video: null },
      enrollment: { id: enrollment, enrollDate: "2026-09-01T00:00:00.000Z", startDate: null, endDate: null },
      plan: { id: "p1", name: "12 WEEKS GOGETFIT PLAN", planType: "Enrollment", durationWeeks: 12 },
      coach: { id: "c1", name: "Prajwal", level: "LEVEL 1" },
      ...overrides,
    });
    const open = async (list: unknown[]) => {
      stubFetch((url) =>
        url.includes("/body-metrics")
          ? ok({ bodyMetrics: list, total: list.length })
          : url.includes("/questionnaires")
            ? ok({ questionnaires: [], total: 0 })
            : url.includes("/admin/users/")
              ? ok({ user })
              : page(rows),
      );
      renderAt("/users/clients/u1");
      fireEvent.click(await screen.findByRole("tab", { name: /Body Metrics/ }));
    };

    it("shows the submitted record: enrollment, plan, coach, date, all 11 measurements, 3 photos", async () => {
      await open([record("bm1", "e1")]);
      expect(await screen.findByText("Submitted 03/10/2026")).toBeTruthy();
      expect(requests.some((r) => r.includes("/admin/users/u1/body-metrics"))).toBe(true);
      expect(screen.getByText("Plan 1: 12 WEEKS GOGETFIT PLAN · Coach Prajwal · LEVEL 1 · Enrolled 01/09/2026")).toBeTruthy();

      const grid = screen.getByLabelText("Measurements");
      expect(grid.querySelectorAll("dt")).toHaveLength(11);
      expect(within(grid).getByText("Height").nextElementSibling?.textContent).toBe("170.7 cm");
      expect(within(grid).getByText("Weight").nextElementSibling?.textContent).toBe("66 kg");
      expect(within(grid).getByText("Age").nextElementSibling?.textContent).toBe("32 yrs");
      expect(within(grid).getByText("Left Thigh").nextElementSibling?.textContent).toBe("54.5 cm");

      // Photos load from the portal's own /uploads path, and open full screen.
      for (const slot of ["Front", "Side", "Back"]) {
        expect(screen.getByAltText(`${slot} photo`).getAttribute("src")).toBe(`/uploads/body-metrics/e1/${slot.toLowerCase()}/x.jpg`);
      }
      fireEvent.click(screen.getByRole("button", { name: "View side photo" }));
      expect(screen.getByRole("dialog", { name: "Side photo" })).toBeTruthy();
      // The app's Body Report body: every body measurement labelled on it, in the app's format.
      const body = screen.getByRole("img", { name: "Body measurements on the body" });
      expect(body.querySelector("image")?.getAttribute("href")).toContain("pose_front");
      const label = (key: string) =>
        Array.from(body.querySelectorAll(`[data-measurement="${key}"] text`)).map((t) => t.textContent);
      expect(label("neck")).toEqual(["Neck", "38 cm"]);
      expect(label("chest")).toEqual(["Chest", "95.5 cm"]);
      expect(label("leftThigh")).toEqual(["Left Thigh", "54.5 cm"]);
      expect(body.querySelectorAll("[data-measurement]")).toHaveLength(8);
      expect(body.querySelectorAll("path")).toHaveLength(8);
      // No video was uploaded: no video section.
      expect(screen.queryByText("Progress Video")).toBeNull();
    });

    it("shows the optional video when there is one", async () => {
      await open([record("bm1", "e1", { media: { front: media("e1", "front"), side: media("e1", "side"), back: media("e1", "back"), video: media("e1", "video", "mp4") } })]);
      expect(await screen.findByText("Progress Video")).toBeTruthy();
      expect(screen.getByLabelText("Progress video").getAttribute("src")).toBe("/uploads/body-metrics/e1/video/x.mp4");
    });

    it("several enrollments stay separate, newest first, one open at a time", async () => {
      await open([
        record("bm2", "e2", { measurements: { ...measurements, weight: 66 }, coach: { id: "c2", name: "Siri", level: "LEVEL 2" } }),
        record("bm1", "e1", { measurements: { ...measurements, weight: 80 } }),
      ]);
      const heads = await screen.findAllByRole("button", { name: /Body Metrics \d/ });
      expect(heads.map((h) => h.textContent?.match(/Body Metrics \d/)?.[0])).toEqual(["Body Metrics 2", "Body Metrics 1"]);
      expect(heads[0].textContent).toContain("Coach Siri");
      expect(heads[1].textContent).toContain("Coach Prajwal");
      expect(screen.getByText("Weight").nextElementSibling?.textContent).toBe("66 kg");
      expect(screen.getByAltText("Front photo").getAttribute("src")).toContain("/body-metrics/e2/");

      fireEvent.click(heads[1]);
      expect(screen.getAllByText("Weight")).toHaveLength(1);
      expect(screen.getByText("Weight").nextElementSibling?.textContent).toBe("80 kg");
      expect(screen.getByAltText("Front photo").getAttribute("src")).toContain("/body-metrics/e1/");
    });

    it("says so when nothing has been submitted", async () => {
      await open([]);
      expect(await screen.findByText("No Body Metrics submitted")).toBeTruthy();
      expect(screen.getByRole("tab", { name: /Body Metrics/ }).textContent).toBe("Body Metrics0");
    });
  });
});
