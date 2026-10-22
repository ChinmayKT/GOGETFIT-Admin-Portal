import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup, fireEvent, within, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { ClientDetailPage } from "./ClientDetailPage";
import { tokenStore } from "../../api/client";
import type { AdminUser } from "../../types/admin";
import type { ClientWorkoutPlan, ClientWorkoutPlans, WorkoutPlanExercise } from "../../api/adminUsers";

const member = (id: string, name: string): AdminUser => ({
  id,
  phone: { raw: "6366192524", normalized: "916366192524" },
  profile: {
    name,
    email: null,
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
  roles: ["user", "client"],
  status: "active",
  legacy: { source: "gogetfit", userId: 187 },
  createdAt: "2026-09-22T07:50:01.000Z",
  updatedAt: null,
});

const exercise = (overrides: Partial<WorkoutPlanExercise> = {}): WorkoutPlanExercise => ({
  workoutId: "w1",
  name: "Squat",
  missingWorkout: false,
  archived: false,
  type: "General",
  equipment: "Body Weight",
  primaryMuscle: "Legs",
  thumbnail: null,
  video: null,
  setsRaw: "3",
  repsRaw: "12-15",
  sets: 3,
  measure: "reps",
  amount: 12,
  amountMax: 15,
  note: null,
  ...overrides,
});

const plan = (overrides: Partial<ClientWorkoutPlan> = {}): ClientWorkoutPlan => ({
  id: "p69",
  planId: "gogetfit:69",
  name: "Push day",
  assignedAt: "2023-03-08T15:35:10.000Z",
  fromDate: "2023-03-16",
  toDate: "2023-03-30",
  days: ["2023-03-16", "2023-03-23", "2023-03-30"],
  shownDays: ["2023-03-16", "2023-03-23", "2023-03-30"],
  status: "active",
  period: "past",
  coach: { id: "c1", name: "Prajwal", level: "LEVEL 1" },
  legacy: { workoutPlanId: 69, createdBy: 332, coachSource: "creator" },
  counts: { blocks: 2, exercises: 3, days: 3 },
  blocks: [
    { blockId: "b1", name: "Warm up", order: 0, exercises: [exercise({ workoutId: "w2", name: "Jumping Jacks", setsRaw: "1", repsRaw: "15sec", measure: "time", amount: 15, amountMax: null })] },
    {
      blockId: "b2",
      name: "Resistance",
      order: 1,
      exercises: [
        exercise({ workoutId: "w3", name: "Plank", archived: true, setsRaw: "3", repsRaw: "I ", amount: null, amountMax: null, measure: null, note: "Keep hips level" }),
        exercise({ workoutId: null, name: null, missingWorkout: true, type: null, equipment: null, primaryMuscle: null, setsRaw: "3", repsRaw: "12-15" }),
      ],
    },
  ],
  ...overrides,
});

/** Older empty plan 60 shares 23-03 and 30-03 with newer plan 69 - the staging case. */
const older = plan({
  id: "p60",
  planId: "gogetfit:60",
  name: "Legacy plan 60",
  assignedAt: "2023-03-03T14:44:02.000Z",
  fromDate: "2023-03-14",
  toDate: "2023-03-31",
  days: ["2023-03-14", "2023-03-21", "2023-03-23", "2023-03-30", "2023-03-31"],
  shownDays: ["2023-03-14", "2023-03-21", "2023-03-31"],
  coach: null,
  legacy: { workoutPlanId: 60, createdBy: 332, coachSource: null },
  counts: { blocks: 1, exercises: 0, days: 5 },
  blocks: [{ blockId: "b9", name: "Warm up", order: 0, exercises: [] }],
});

const data = (overrides: Partial<ClientWorkoutPlans> = {}): ClientWorkoutPlans => ({
  client: { id: "u1", name: "Jeevika" },
  today: "2026-10-20",
  timezone: "Asia/Kolkata",
  workoutPlans: [plan(), older],
  ...overrides,
});

const ok = (payload: unknown) =>
  new Response(JSON.stringify({ success: true, data: payload }), { status: 200, headers: { "Content-Type": "application/json" } });
const fail = () =>
  new Response(JSON.stringify({ success: false, error: { code: "INTERNAL_ERROR", message: "boom" } }), { status: 500, headers: { "Content-Type": "application/json" } });

const requests: string[] = [];
const stub = (workoutPlans: (url: string) => Response | Promise<Response>) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      requests.push(url);
      if (url.includes("/workout-plans")) return workoutPlans(url);
      if (url.includes("/diet-plans")) return ok({ client: { id: "u1", name: null }, today: "2026-10-20", dietPlans: [], schedule: [], missingFoodIds: [] });
      if (url.includes("/questionnaires")) return ok({ questionnaires: [], total: 0 });
      if (url.includes("/body-metrics")) return ok({ bodyMetrics: [], total: 0 });
      if (url.includes("/admin/users/u2")) return ok({ user: member("u2", "Ravi") });
      if (url.includes("/admin/users/")) return ok({ user: member("u1", "Jeevika") });
      return ok({ enrolledClients: [], pagination: { page: 1, pageSize: 100, total: 0, totalPages: 1 } });
    }),
  );

const renderPage = (path = "/users/clients/u1") => {
  const router = createMemoryRouter([{ path: "/users/clients/:userId", element: <ClientDetailPage /> }], { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
};
const openTab = async () => fireEvent.click(await screen.findByRole("tab", { name: /Workout Plans/ }));

beforeEach(() => {
  requests.length = 0;
  tokenStore.set("t");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  tokenStore.clear();
});

describe("Client detail → Workout Plans", () => {
  it("adds the tab beside the existing ones and loads the selected client's plans from the admin API", async () => {
    stub(() => ok(data()));
    renderPage();
    const tab = await screen.findByRole("tab", { name: /Workout Plans/ });
    for (const name of ["Overview", "Plans", "Diet Plans", "Free Diet Plan"]) expect(screen.getByRole("tab", { name: new RegExp(`^${name}`) })).toBeTruthy();
    await waitFor(() => expect(tab.textContent).toBe("Workout Plans2"));
    expect(requests.filter((u) => u.includes("/workout-plans"))).toEqual([expect.stringMatching(/\/admin\/users\/u1\/workout-plans$/)]);
  });

  it("opens on the latest day a plan is shown, with that plan's summary and blocks; the dropdown lists every plan in the server's order", async () => {
    stub(() => ok(data()));
    renderPage();
    await openTab();
    await screen.findByLabelText("Plan summary");
    expect((screen.getByLabelText("Day") as HTMLInputElement).value).toBe("2023-03-31");
    expect((screen.getByLabelText("Workout plan") as HTMLSelectElement).value).toBe("p60");
    const options = within(screen.getByLabelText("Workout plan")).getAllByRole("option").filter((o) => !(o as HTMLOptionElement).disabled);
    expect(options.map((o) => o.textContent)).toEqual([
      "Push day · 16/03/2023 → 30/03/2023 · 3 days · Past · Prajwal",
      "Legacy plan 60 · 14/03/2023 → 31/03/2023 · 5 days · Past",
    ]);
    expect(screen.getByText("Legacy plan 60")).toBeTruthy();
    expect(screen.getByText(/Coach Not linked \(legacy creator #332\) · .*Legacy plan #60/)).toBeTruthy();
    expect(within(screen.getByLabelText("Plan summary")).getByText("Days Member Sees It").nextSibling?.textContent).toBe("3");
    // Competing plans are explained, not hidden.
    expect(screen.getByText("On 2 days a newer plan is assigned too, and the member sees that one instead.")).toBeTruthy();
    // The empty dated plan: its block, empty - nothing invented.
    expect(screen.getByLabelText("Block 1: Warm up").textContent).toContain("No exercises in this block");
  });

  it("moving the day shows the plan the member sees on it, with blocks and exercises as written; a day without one is empty", async () => {
    stub(() => ok(data()));
    renderPage();
    await openTab();
    await screen.findByLabelText("Plan summary");
    fireEvent.change(screen.getByLabelText("Day"), { target: { value: "2023-03-30" } });
    expect((screen.getByLabelText("Workout plan") as HTMLSelectElement).value).toBe("p69");
    expect(screen.getByText(/16\/03\/2023 → 30\/03\/2023 · 3 assigned days · Coach Prajwal · Assigned .* · Legacy plan #69/)).toBeTruthy();
    const blocks = screen.getAllByRole("region").filter((r) => /^Block/.test(r.getAttribute("aria-label") ?? ""));
    expect(blocks.map((b) => b.getAttribute("aria-label"))).toEqual(["Block 1: Warm up", "Block 2: Resistance"]);
    const jacks = screen.getByRole("article", { name: "Jumping Jacks" });
    expect(within(jacks).getByLabelText("Sets 1, reps or time 15sec")).toBeTruthy();
    const plank = screen.getByRole("article", { name: "Plank" });
    expect(within(plank).getByText("I")).toBeTruthy(); // unusual legacy value, as written
    expect(within(plank).getByText("Archived in the exercise library")).toBeTruthy();
    expect(within(plank).getByText("Note: Keep hips level")).toBeTruthy();
    const missing = screen.getByRole("article", { name: "Unknown exercise" });
    expect(within(missing).getByText("No longer in the exercise library")).toBeTruthy();
    expect(within(missing).getByText("12-15")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
    expect((screen.getByLabelText("Day") as HTMLInputElement).value).toBe("2023-03-29");
    expect(screen.getByText("No workout plan on 29/03/2023")).toBeTruthy();
    expect((screen.getByLabelText("Workout plan") as HTMLSelectElement).value).toBe("");
    expect(screen.queryByLabelText("Plan summary")).toBeNull();
  });

  it("choosing a plan opens it on its first shown day; its assigned dates open that day and flag where a newer plan wins", async () => {
    stub(() => ok(data()));
    renderPage();
    await openTab();
    await screen.findByLabelText("Plan summary");
    fireEvent.change(screen.getByLabelText("Workout plan"), { target: { value: "p69" } });
    expect((screen.getByLabelText("Day") as HTMLInputElement).value).toBe("2023-03-16");
    fireEvent.change(screen.getByLabelText("Workout plan"), { target: { value: "p60" } });
    expect((screen.getByLabelText("Day") as HTMLInputElement).value).toBe("2023-03-14");

    const dates = within(screen.getByLabelText("Assigned dates")).getAllByRole("button");
    expect(dates.map((d) => [d.textContent, d.getAttribute("title")])).toEqual([
      ["14/03/2023", "The member sees this plan"],
      ["21/03/2023", "The member sees this plan"],
      ["23/03/2023", "The member sees a newer plan on this day"],
      ["30/03/2023", "The member sees a newer plan on this day"],
      ["31/03/2023", "The member sees this plan"],
    ]);
    expect(dates[0].getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(dates[2]);
    expect((screen.getByLabelText("Day") as HTMLInputElement).value).toBe("2023-03-23");
    expect((screen.getByLabelText("Workout plan") as HTMLSelectElement).value).toBe("p60");
    expect(screen.getByText("On 23/03/2023 the member sees “Push day”, a newer assignment, instead of this plan.")).toBeTruthy();
  });

  it("opens on today when a plan is shown today, and an archived plan says the member no longer sees it", async () => {
    const archived = plan({ id: "p70", planId: "gogetfit:70", name: "Old split", status: "archived", period: "past", days: ["2023-03-01"], shownDays: [], fromDate: "2023-03-01", toDate: "2023-03-01" });
    stub(() => ok(data({ today: "2023-03-23", workoutPlans: [plan(), older, archived] })));
    renderPage();
    await openTab();
    await screen.findByLabelText("Plan summary");
    expect((screen.getByLabelText("Day") as HTMLInputElement).value).toBe("2023-03-23");
    expect((screen.getByLabelText("Workout plan") as HTMLSelectElement).value).toBe("p69");
    fireEvent.change(screen.getByLabelText("Workout plan"), { target: { value: "p70" } });
    expect((screen.getByLabelText("Day") as HTMLInputElement).value).toBe("2023-03-01");
    expect(screen.getByText("This plan is archived; the member no longer sees it.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    expect((screen.getByLabelText("Workout plan") as HTMLSelectElement).value).toBe("p69");
  });

  it("loading, then an error with retry, then the plans; empty only when the server says none", async () => {
    let calls = 0;
    stub(() => (++calls === 1 ? fail() : ok(data({ workoutPlans: [] }))));
    renderPage();
    await openTab();
    expect(await screen.findByRole("button", { name: "Try Again" })).toBeTruthy();
    expect(screen.queryByText("No workout plans assigned to this client.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(await screen.findByText("No workout plans assigned to this client.")).toBeTruthy();
    expect(calls).toBe(2);
  });

  it("switching to another client shows only that client's plans, never the previous one's", async () => {
    let releaseU2: (r: Response) => void = () => {};
    stub((url) =>
      url.includes("/u2/") ? new Promise<Response>((resolve) => (releaseU2 = resolve)) : ok(data()),
    );
    const router = renderPage();
    await openTab();
    await screen.findByLabelText("Plan summary");
    await router.navigate("/users/clients/u2");
    await openTab();
    // While u2 is loading, nothing of u1 is shown.
    await waitFor(() => expect(requests.some((u) => u.includes("/u2/workout-plans"))).toBe(true));
    await waitFor(() => expect(screen.queryByText("Legacy plan 60")).toBeNull());
    releaseU2(ok(data({ client: { id: "u2", name: "Ravi" }, workoutPlans: [plan({ id: "q1", planId: "gogetfit:300", name: "Ravi legs" })] })));
    expect(await screen.findByText("Ravi legs")).toBeTruthy();
    expect(screen.queryByText("Legacy plan 60")).toBeNull();
    expect(requests.filter((u) => u.includes("/workout-plans")).map((u) => u.replace(/.*\/admin/, ""))).toEqual(["/users/u1/workout-plans", "/users/u2/workout-plans"]);
  });

  it("does not refetch when switching tabs", async () => {
    stub(() => ok(data()));
    renderPage();
    await openTab();
    await screen.findByLabelText("Plan summary");
    fireEvent.click(screen.getByRole("tab", { name: /^Overview/ }));
    await openTab();
    await screen.findByLabelText("Plan summary");
    expect(requests.filter((u) => u.includes("/workout-plans"))).toHaveLength(1);
  });
});
