import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { WorkoutListPage } from "./WorkoutListPage";
import { ToastProvider } from "../../components/feedback/ToastProvider";
import { tokenStore } from "../../api/client";
import type { WorkoutRow } from "../../types/workout";

const row = (id: string, name: string, hasVideo: boolean, overrides: Partial<WorkoutRow> = {}): WorkoutRow => ({
  id,
  name,
  type: "Gym",
  equipment: "Pair of Dumbells",
  primaryMuscle: "Biceps",
  secondaryMuscle: null,
  level: 2,
  thumbnail: { url: `http://10.0.2.2:3000/uploads/workouts/${id}/thumbnail/t.png`, storageKey: null },
  hasVideo,
  youtubeUrl: null,
  status: "active",
  legacyWorkoutId: null,
  createdBy: null,
  updatedBy: null,
  createdAt: null,
  updatedAt: null,
  ...overrides,
});

// Displayed order a, b, c, d - b has no video.
const A = row("a", "Floor Knee Raises", true);
const B = row("b", "Plank", false);
const C = row("c", "Lat Pull Down", true);
const D = row("d", "Hammer Curls", true);

/** The URL the backend stores (the mobile app's host), or an absolute URL elsewhere. */
const VIDEO_URLS: Record<string, string | null> = {
  a: "http://10.0.2.2:3000/uploads/workouts/a/video/a.mp4",
  b: null,
  c: "http://10.0.2.2:3000/uploads/workouts/c/video/c.mp4",
  d: "https://cdn.example.com/media/d.mp4?sig=abc",
};

const ok = (payload: unknown) =>
  new Response(JSON.stringify({ success: true, data: payload }), { status: 200, headers: { "Content-Type": "application/json" } });
const fail = () =>
  new Response(JSON.stringify({ success: false, error: { code: "INTERNAL_ERROR", message: "boom" } }), { status: 500, headers: { "Content-Type": "application/json" } });
const page = (rows: WorkoutRow[], total = rows.length) =>
  ok({ workouts: rows, pagination: { page: 1, pageSize: 10, total, totalPages: Math.max(1, Math.ceil(total / 10)) } });

const requests: string[] = [];
let detail: (id: string) => Response = (id) => ok({ workout: { ...row(id, id, true), video: VIDEO_URLS[id] ? { url: VIDEO_URLS[id], storageKey: null } : null } });
let list: (url: URL) => Response = () => page([A, B, C, D]);

beforeEach(() => {
  requests.length = 0;
  tokenStore.set("t");
  detail = (id) => ok({ workout: { ...row(id, id, true), video: VIDEO_URLS[id] ? { url: VIDEO_URLS[id], storageKey: null } : null } });
  list = () => page([A, B, C, D]);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input), "http://portal.test");
      requests.push(url.pathname + url.search);
      const match = url.pathname.match(/\/admin\/workouts\/([^/]+)$/);
      return match ? detail(match[1]) : list(url);
    }),
  );
  // jsdom does not implement media playback.
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  tokenStore.clear();
});

const renderPage = () => {
  const router = createMemoryRouter(
    [
      { path: "/fitness/workouts", element: <ToastProvider><WorkoutListPage /></ToastProvider> },
      { path: "/fitness/workouts/:id/edit", element: <p>Edit page</p> },
    ],
    { initialEntries: ["/fitness/workouts"] },
  );
  render(<RouterProvider router={router} />);
  return router;
};

const player = () => screen.getByRole("dialog");
const video = () => within(player()).getByLabelText(/ video$/) as HTMLVideoElement;
const playerTitle = () => within(player()).getByRole("heading").textContent;
const play = async (name: string) => fireEvent.click(await screen.findByRole("button", { name: `Play ${name} video` }));

describe("Workout list → video player", () => {
  it("shows Play on workouts with a video and a disabled control on those without; the row keeps opening Edit", async () => {
    const router = renderPage();
    for (const w of [A, C, D]) expect((await screen.findByRole("button", { name: `Play ${w.name} video` })).getAttribute("aria-disabled")).toBe("false");
    const none = screen.getByRole("button", { name: "No video for Plank" });
    expect(none.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(none);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(router.state.location.pathname).toBe("/fitness/workouts"); // nor does it open Edit
    expect(requests.some((u) => u.startsWith("/api/admin/workouts/b"))).toBe(false);
    // Existing behaviour: thumbnails, the MP4 badge and the row click to Edit.
    expect(screen.getByAltText("Plank thumbnail").getAttribute("src")).toBe("/uploads/workouts/b/thumbnail/t.png");
    expect(screen.getAllByLabelText("Has video")).toHaveLength(3);
    fireEvent.click(screen.getByText("Plank"));
    await waitFor(() => expect(router.state.location.pathname).toBe("/fitness/workouts/b/edit"));
  });

  it("Play opens that workout's stored video (loaded from the portal's origin), not the row's edit page", async () => {
    const router = renderPage();
    await play("Lat Pull Down");
    expect(playerTitle()).toBe("Lat Pull Down");
    expect(within(player()).getByRole("status").textContent).toContain("Loading video");
    await waitFor(() => expect(video().getAttribute("src")).toBe("/uploads/workouts/c/video/c.mp4"));
    expect(requests).toContain("/api/admin/workouts/c");
    expect(video().controls).toBe(true);
    fireEvent.loadedData(video());
    expect(within(player()).queryByRole("status")).toBeNull();
    expect(router.state.location.pathname).toBe("/fitness/workouts");
  });

  it("Next and Previous follow the displayed order, skip workouts without a video, and stop at the ends", async () => {
    renderPage();
    await play("Floor Knee Raises");
    const prev = within(player()).getByRole("button", { name: "Previous" }) as HTMLButtonElement;
    const next = within(player()).getByRole("button", { name: "Next" }) as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
    expect(within(player()).getByText(/Video 1 of 3/)).toBeTruthy();

    fireEvent.click(next); // skips Plank
    expect(playerTitle()).toBe("Lat Pull Down");
    await waitFor(() => expect(video().getAttribute("src")).toBe("/uploads/workouts/c/video/c.mp4"));
    fireEvent.click(next);
    expect(playerTitle()).toBe("Hammer Curls");
    // An absolute URL on another host is used exactly as returned.
    await waitFor(() => expect(video().getAttribute("src")).toBe("https://cdn.example.com/media/d.mp4?sig=abc"));
    expect(next.disabled).toBe(true);
    fireEvent.click(next); // no wrap to the first
    expect(playerTitle()).toBe("Hammer Curls");

    fireEvent.click(prev);
    fireEvent.click(prev);
    expect(playerTitle()).toBe("Floor Knee Raises");
    expect(prev.disabled).toBe(true);
  });

  it("a failed lookup or a failed video shows an error with Try Again, and Next still works", async () => {
    let calls = 0;
    detail = (id) => (id === "a" && ++calls === 1 ? fail() : ok({ workout: { ...row(id, id, true), video: { url: VIDEO_URLS[id], storageKey: null } } }));
    renderPage();
    await play("Floor Knee Raises");
    expect((await within(player()).findByRole("alert")).textContent).toContain("Could not fetch this video's details");
    fireEvent.click(within(player()).getByRole("button", { name: "Try Again" }));
    await waitFor(() => expect(video().getAttribute("src")).toBe("/uploads/workouts/a/video/a.mp4"));

    // The file itself fails (missing on the server, blocked, or unplayable).
    Object.defineProperty(video(), "error", { value: { code: 4 } });
    fireEvent.error(video());
    expect(within(player()).getByRole("alert").textContent).toContain("could not be loaded");
    expect(within(player()).queryByLabelText(/ video$/)).toBeNull();
    fireEvent.click(within(player()).getByRole("button", { name: "Try Again" }));
    await waitFor(() => expect(video().getAttribute("src")).toBe("/uploads/workouts/a/video/a.mp4"));
    expect(requests.filter((u) => u === "/api/admin/workouts/a")).toHaveLength(3);

    fireEvent.error(video());
    fireEvent.click(within(player()).getByRole("button", { name: "Next" }));
    expect(playerTitle()).toBe("Lat Pull Down");
    await waitFor(() => expect(video().getAttribute("src")).toBe("/uploads/workouts/c/video/c.mp4"));
  });

  it("a workout whose stored video has gone says so instead of opening a blank player", async () => {
    detail = (id) => ok({ workout: { ...row(id, id, true), video: null } });
    renderPage();
    await play("Floor Knee Raises");
    expect((await within(player()).findByRole("alert")).textContent).toContain("No video is stored for this workout.");
    expect(within(player()).queryByLabelText(/ video$/)).toBeNull();
  });

  it("navigation follows the searched list as displayed", async () => {
    list = (url) => (url.searchParams.get("search") === "curl" ? page([D, B, A]) : page([A, B, C, D]));
    renderPage();
    await screen.findByRole("button", { name: "Play Lat Pull Down video" });
    fireEvent.change(screen.getByPlaceholderText(/Search by workout name/), { target: { value: "curl" } });
    await waitFor(() => expect(screen.queryByRole("button", { name: "Play Lat Pull Down video" })).toBeNull(), { timeout: 2000 });
    await play("Hammer Curls");
    expect(within(player()).getByText(/Video 1 of 2/)).toBeTruthy();
    fireEvent.click(within(player()).getByRole("button", { name: "Next" }));
    expect(playerTitle()).toBe("Floor Knee Raises"); // Plank skipped, Lat Pull Down is not in the results
    expect((within(player()).getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("stops at the page boundary and says so instead of loading another page", async () => {
    list = () => page([A, B, C, D], 25);
    renderPage();
    await play("Hammer Curls");
    expect((within(player()).getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(true);
    expect(within(player()).getByText("Last video on this page. Go to the next page of the list for more.")).toBeTruthy();
  });

  it("closing stops playback and returns to the list (Close button and Esc)", async () => {
    renderPage();
    await play("Lat Pull Down");
    await waitFor(() => expect(video().getAttribute("src")).toBeTruthy());
    const el = video();
    const pause = vi.mocked(HTMLMediaElement.prototype.pause);
    pause.mockClear();
    fireEvent.click(within(player()).getByRole("button", { name: "Close player" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(pause).toHaveBeenCalled();
    expect(el.getAttribute("src")).toBeNull();
    expect(screen.getByRole("button", { name: "Play Lat Pull Down video" })).toBeTruthy();

    await play("Floor Knee Raises");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
