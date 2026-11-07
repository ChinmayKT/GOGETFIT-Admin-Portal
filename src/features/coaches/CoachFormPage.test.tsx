import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { CoachFormPage } from "./CoachFormPage";
import { ToastProvider } from "../../components/feedback/ToastProvider";
import { tokenStore, setUnauthorizedHandler } from "../../api/client";
import { cropToBlob, loadImage } from "../../components/media/cropImage";

vi.mock("../../components/media/cropImage", () => ({ loadImage: vi.fn(), cropToBlob: vi.fn() }));

/** GET /api/admin/users/search, in the backend's shape. */
const searchResult = (coach: { id: string; status: string } | null = null) => ({
  user: {
    id: "u1",
    phone: { raw: "9876543210", normalized: "919876543210" },
    profile: {
      name: "Asha Rao",
      email: "asha@example.com",
      isEmailVerified: true,
      dateOfBirth: null,
      age: null,
      gender: "female",
      city: "Bengaluru",
      profilePicture: null,
      fitnessProfile: {},
    },
    profileCompleted: true,
    roles: coach ? ["user", "coach"] : ["user", "client"],
    status: "active",
    legacy: null,
    createdAt: null,
    updatedAt: null,
  },
  coach,
});

const coachRecord = (overrides: Record<string, unknown> = {}) => ({
  id: "c1",
  userId: "u1",
  user: {
    id: "u1",
    name: "Asha Rao",
    phone: "919876543210",
    email: "asha@example.com",
    gender: "female",
    city: "Bengaluru",
    profilePicture: null,
    roles: ["user", "coach"],
    status: "active",
  },
  profile: {
    level: "LEVEL 3",
    specialization: "Fat loss",
    description: "Strength coach.",
    languages: ["English", "Kannada"],
    facebook: null,
    instagram: "https://instagram.com/asha",
    linkedin: null,
    transformations: 12,
    monthlySlots: 8,
  },
  status: "active",
  createdBy: "a1",
  updatedBy: "a1",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  ...overrides,
});

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
const ok = (data: unknown, status = 200) => json(status, { success: true, data });
const fail = (status: number, code: string, message: string) =>
  json(status, { success: false, error: { code, message } });

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
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : null;
      captured.push({ url: String(input), method, body });
      return handler(String(input), method);
    }),
  );
};

const renderAt = (path: string) => {
  const router = createMemoryRouter(
    [
      { path: "/coaches/new", element: <CoachFormPage /> },
      { path: "/coaches/:id/edit", element: <CoachFormPage /> },
      { path: "/coaches/:id", element: <p>coach detail page</p> },
      { path: "/coaches", element: <p>coach list</p> },
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

const searchPhone = (phone = "9876543210") => {
  fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: phone } });
  fireEvent.click(screen.getByRole("button", { name: /search user/i }));
};

const writes = () => captured.filter((c) => c.method === "POST" || c.method === "PATCH");

describe("CoachFormPage — Add Coach", () => {
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

  it("1. loads with only a phone search", () => {
    stubFetch(() => ok({}));
    renderAt("/coaches/new");
    expect(screen.getByText("Add New Coach")).toBeTruthy();
    expect(screen.getByLabelText(/phone number/i)).toBeTruthy();
    expect(screen.queryByLabelText(/email/i)).toBeNull();
    expect(screen.queryByLabelText(/coach level/i)).toBeNull();
  });

  it("2-3. searches by phone and shows the existing user's details", async () => {
    stubFetch(() => ok(searchResult()));
    renderAt("/coaches/new");
    searchPhone("+91 98765 43210");

    expect(await screen.findByText("User Found")).toBeTruthy();
    expect(captured[0].url).toContain("/admin/users/search?phone=%2B91+98765+43210");
    expect(screen.getByText("asha@example.com")).toBeTruthy();
    expect(screen.getByText("+91 98765 43210")).toBeTruthy();
    expect(screen.getByText("Bengaluru")).toBeTruthy();
  });

  it("requires a phone before searching", () => {
    stubFetch(() => ok({}));
    renderAt("/coaches/new");
    fireEvent.click(screen.getByRole("button", { name: /search user/i }));
    expect(screen.getByText("Phone number is required")).toBeTruthy();
    expect(captured).toHaveLength(0);
  });

  it("4. shows User not found and does not allow continuing", async () => {
    stubFetch(() => fail(404, "USER_NOT_FOUND", "User not found"));
    renderAt("/coaches/new");
    searchPhone();

    expect(await screen.findByText("User not found")).toBeTruthy();
    expect(screen.getByText("Only existing users can be added as coaches.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /continue/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /try another number/i }));
    expect((screen.getByLabelText(/phone number/i) as HTMLInputElement).value).toBe("");
  });

  it("5. shows Already a Coach with View/Edit and no Continue", async () => {
    stubFetch(() => ok(searchResult({ id: "c9", status: "active" })));
    const router = renderAt("/coaches/new");
    searchPhone();

    expect(await screen.findByText("This user is already a coach.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /continue/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /edit coach/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/coaches/c9/edit"));
  });

  it("shows a retryable error when the search fails", async () => {
    let calls = 0;
    stubFetch(() => (++calls === 1 ? fail(500, "INTERNAL_ERROR", "boom") : ok(searchResult())));
    renderAt("/coaches/new");
    searchPhone();

    expect(await screen.findByText("Unable to search user.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(await screen.findByText("User Found")).toBeTruthy();
  });

  it("6-7. continues to the coach profile and validates it", async () => {
    stubFetch(() => ok(searchResult()));
    renderAt("/coaches/new");
    searchPhone();
    fireEvent.click(await screen.findByRole("button", { name: /continue/i }));

    expect(screen.getByText("Create Coach", { selector: "h1, h2, h3, [class*=title]" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/instagram/i), { target: { value: "not a url" } });
    fireEvent.click(screen.getByRole("button", { name: /create coach/i }));

    expect(screen.getByText("Coach level is required")).toBeTruthy();
    expect(screen.getByText("Enter a full link starting with https://")).toBeTruthy();
    // Monthly Slots is required: a blank, negative or fractional value never reaches the API.
    expect(screen.getByText("Enter a whole number from 0 to 100000")).toBeTruthy();
    for (const bad of ["-1", "1.5"]) {
      fireEvent.change(screen.getByLabelText(/monthly slots/i), { target: { value: bad } });
      fireEvent.click(screen.getByRole("button", { name: /create coach/i }));
      expect(screen.getByText("Enter a whole number from 0 to 100000")).toBeTruthy();
    }
    expect(writes()).toHaveLength(0);
  });

  it("8-9. creates the coach with only coach fields, then opens the detail page", async () => {
    stubFetch((_url, method) => (method === "POST" ? ok({ coach: coachRecord() }, 201) : ok(searchResult())));
    const router = renderAt("/coaches/new");
    searchPhone();
    fireEvent.click(await screen.findByRole("button", { name: /continue/i }));

    fireEvent.change(screen.getByLabelText(/coach level/i), { target: { value: "LEVEL 3" } });
    fireEvent.change(screen.getByLabelText(/specialization/i), { target: { value: "Fat loss" } });
    fireEvent.change(screen.getByLabelText(/known languages/i), { target: { value: "English, Kannada, english" } });
    fireEvent.change(screen.getByLabelText(/monthly slots/i), { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: /create coach/i }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/coaches/c1"));
    const post = writes()[0];
    expect(post.body?.profile).toMatchObject({ monthlySlots: 50 });
    expect(post.url).toContain("/admin/coaches");
    expect(post.body?.userId).toBe("u1");
    expect(post.body?.profile).toMatchObject({ level: "LEVEL 3", specialization: "Fat loss" });
    // User data is never copied onto the coach, and audit/role fields are never sent.
    expect(post.body?.profile).not.toHaveProperty("name");
    expect(post.body?.profile).not.toHaveProperty("email");
    expect(post.body).not.toHaveProperty("roles");
    expect(post.body).not.toHaveProperty("createdBy");
    expect(await screen.findByText("Coach created successfully.")).toBeTruthy();
  });

  it("uploads pictures chosen on the create form right after the coach exists", async () => {
    // jsdom has no object URLs; the form uses them for local previews.
    const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };
    URL.createObjectURL = () => "blob:preview";
    URL.revokeObjectURL = () => {};
    onTestFinished(() => {
      URL.createObjectURL = original.create;
      URL.revokeObjectURL = original.revoke;
    });
    stubFetch((_url, method) => {
      if (method === "POST") return ok({ coach: coachRecord() }, 201);
      if (method === "PUT") return ok({ coach: coachRecord() });
      return ok(searchResult());
    });
    const router = renderAt("/coaches/new");
    searchPhone();
    fireEvent.click(await screen.findByRole("button", { name: /continue/i }));

    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "c.jpg", { type: "image/jpeg" });
    vi.mocked(loadImage).mockResolvedValue({ element: {} as HTMLImageElement, width: 1500, height: 500 });
    vi.mocked(cropToBlob).mockResolvedValue(new Blob(["cropped"], { type: "image/jpeg" }));
    fireEvent.change(screen.getByLabelText("Coach Cover Picture file"), { target: { files: [file] } });
    // Positioned in the crop dialog first; the crop is what is kept.
    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByAltText("Image being cropped");
    fireEvent.click(within(dialog).getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByAltText("Coach Cover Picture preview").getAttribute("src")).toBe("blob:preview");
    fireEvent.change(screen.getByLabelText(/coach level/i), { target: { value: "LEVEL 1" } });
    fireEvent.change(screen.getByLabelText(/monthly slots/i), { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: /create coach/i }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/coaches/c1"));
    const order = captured.filter((c) => c.method !== "GET").map((c) => `${c.method} ${c.url.replace(/^.*\/api/, "")}`);
    expect(order).toEqual(["POST /admin/coaches", "PUT /admin/coaches/c1/cover-picture"]);
    const upload = captured.find((c) => c.method === "PUT");
    expect(upload?.url).toContain("cover-picture");
  });

  it("10. shows the API error when creation fails", async () => {
    stubFetch((_url, method) =>
      method === "POST"
        ? fail(409, "COACH_ALREADY_EXISTS", "This user is already a coach")
        : ok(searchResult()),
    );
    renderAt("/coaches/new");
    searchPhone();
    fireEvent.click(await screen.findByRole("button", { name: /continue/i }));
    fireEvent.change(screen.getByLabelText(/coach level/i), { target: { value: "LEVEL 1" } });
    fireEvent.change(screen.getByLabelText(/monthly slots/i), { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: /create coach/i }));

    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "This user is already a coach");
  });
});

describe("CoachFormPage — Edit Coach", () => {
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

  it("11, 13. loads stored values; user information is read-only", async () => {
    stubFetch(() => ok({ coach: coachRecord() }));
    renderAt("/coaches/c1/edit");

    expect(await screen.findByDisplayValue("Fat loss")).toBeTruthy();
    expect((screen.getByLabelText(/coach level/i) as HTMLSelectElement).value).toBe("LEVEL 3");
    expect(screen.getByDisplayValue("English, Kannada")).toBeTruthy();
    expect(screen.getByDisplayValue("12")).toBeTruthy();

    // Name/phone/email are shown as text, never as editable inputs.
    expect(screen.getAllByText("Asha Rao").length).toBeGreaterThan(0);
    expect(screen.getByText("asha@example.com")).toBeTruthy();
    expect(screen.queryByDisplayValue("Asha Rao")).toBeNull();
    expect(screen.queryByDisplayValue("asha@example.com")).toBeNull();
    expect(screen.queryByLabelText(/^email/i)).toBeNull();
  });

  it("12. saves through PATCH without userId", async () => {
    stubFetch((_url, method) =>
      method === "PATCH"
        ? ok({ coach: coachRecord({ profile: { ...coachRecord().profile, level: "LEVEL 5" } }) })
        : ok({ coach: coachRecord() }),
    );
    const router = renderAt("/coaches/c1/edit");
    await screen.findByDisplayValue("Fat loss");

    fireEvent.change(screen.getByLabelText(/coach level/i), { target: { value: "LEVEL 5" } });
    fireEvent.change(screen.getByLabelText(/coach status/i), { target: { value: "inactive" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/coaches/c1"));
    const patch = writes()[0];
    expect(patch.url).toContain("/admin/coaches/c1");
    expect(patch.body).toMatchObject({ profile: { level: "LEVEL 5" }, status: "inactive" });
    expect(patch.body).not.toHaveProperty("userId");
    expect(await screen.findByText("Coach updated successfully.")).toBeTruthy();
  });

  const capacity = (overrides: Record<string, unknown> = {}) => ({
    month: "2026-11", date: "2026-11-05", timezone: "Asia/Kolkata", monthlyCapacity: 50, confirmedBookings: 30, bookedToday: 9,
    firstBatchSize: 9, nextBatchSize: 3, status: "available", remainingCapacity: 20, currentBatch: 2, releasedToday: 12, availableSlots: 3,
    history: [{ month: "2026-11", capacity: 50, confirmedBookings: 30, changes: [{ from: 40, to: 50, by: "a1", at: "2026-11-02T10:00:00.000Z" }] }],
    ...overrides,
  });
  const stubCapacity = (summary: unknown) =>
    stubFetch((url, method) =>
      url.endsWith("/capacity")
        ? ok({ capacity: summary })
        : method === "PATCH"
          ? ok({ coach: coachRecord() })
          : ok({ coach: coachRecord() }),
    );

  it("shows the backend's capacity summary and saves a raised or lowered allocation", async () => {
    stubCapacity(capacity());
    const router = renderAt("/coaches/c1/edit");
    await screen.findByDisplayValue("Fat loss");

    expect(await screen.findByText("Accepting bookings")).toBeTruthy();
    expect(screen.getByText("Remaining This Month")).toBeTruthy();
    expect(screen.getByText("Changed from 40 to 50", { exact: false })).toBeTruthy();
    expect((screen.getByLabelText(/monthly slots/i) as HTMLInputElement).value).toBe("8");

    fireEvent.change(screen.getByLabelText(/monthly slots/i), { target: { value: "25" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/coaches/c1"));
    expect(writes()[0].body).toMatchObject({ profile: { monthlySlots: 25 } });
  });

  it("shows an exhausted coach as fully booked, with no remaining slots", async () => {
    stubCapacity(capacity({ monthlyCapacity: 25, status: "fully_booked", remainingCapacity: 0, availableSlots: 0, history: [] }));
    renderAt("/coaches/c1/edit");
    expect(await screen.findByText("Fully booked")).toBeTruthy();
    expect(screen.queryByText("History")).toBeNull();
  });

  it("shows a coach with no allocation as unlimited, not as zero", async () => {
    stubCapacity(capacity({ monthlyCapacity: null, status: "not_configured", remainingCapacity: null, currentBatch: null, releasedToday: 0, availableSlots: 0, confirmedBookings: 4, history: [] }));
    renderAt("/coaches/c1/edit");
    expect(await screen.findByText("Monthly slots not set")).toBeTruthy();
    expect(screen.getByText("Not set")).toBeTruthy();
    expect(screen.getByText("No limit")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
  });

  it("a coach with no allocation can be saved unlimited, or given a limit", async () => {
    const unlimited = coachRecord({ profile: { ...coachRecord().profile, monthlySlots: null } });
    stubFetch(() => ok({ coach: unlimited }));
    const router = renderAt("/coaches/c1/edit");
    await screen.findByDisplayValue("Fat loss");
    expect((screen.getByLabelText(/monthly slots/i) as HTMLInputElement).value).toBe("");

    // Bad values are still refused; blank is not a bad value here.
    fireEvent.change(screen.getByLabelText(/monthly slots/i), { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(screen.getByText("Enter a whole number from 0 to 100000")).toBeTruthy();
    expect(writes()).toHaveLength(0);

    fireEvent.change(screen.getByLabelText(/monthly slots/i), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/coaches/c1"));
    expect(writes()[0].body?.profile).not.toHaveProperty("monthlySlots");
  });

  it("a configured coach cannot have Monthly Slots blanked", async () => {
    stubFetch(() => ok({ coach: coachRecord() }));
    renderAt("/coaches/c1/edit");
    await screen.findByDisplayValue("Fat loss");
    fireEvent.change(screen.getByLabelText(/monthly slots/i), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(screen.getByText("Enter a whole number from 0 to 100000")).toBeTruthy();
    expect(writes()).toHaveLength(0);
  });

  it("shows not found for an unknown coach", async () => {
    stubFetch(() => fail(404, "COACH_NOT_FOUND", "Coach not found"));
    renderAt("/coaches/missing/edit");
    expect(await screen.findByText("Coach not found")).toBeTruthy();
  });
});
