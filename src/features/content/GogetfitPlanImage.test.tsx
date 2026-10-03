import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { GogetfitPlansPage } from "./GogetfitPlansPage";
import { GogetfitPlanFormPage } from "./GogetfitPlanFormPage";
import { GogetfitPlanViewPage } from "./GogetfitPlanViewPage";
import { ToastProvider } from "../../components/feedback/ToastProvider";
import { tokenStore, setUnauthorizedHandler } from "../../api/client";
import { cropToBlob, loadImage } from "../../components/media/cropImage";

// jsdom cannot decode images or draw on a canvas; the crop passes the bytes through.
vi.mock("../../components/media/cropImage", () => ({ loadImage: vi.fn(), cropToBlob: vi.fn() }));
let lastPicked: File | null = null;

const img = (name: string) => ({
  url: `http://10.0.2.2:3000/uploads/gogetfit-plans/p1/cover/${name}`,
  storageKey: `gogetfit-plans/p1/cover/${name}`,
});

const plan = (overrides: Record<string, unknown> = {}) => ({
  id: "p1",
  name: "12 WEEKS GOGETFIT PLAN",
  planType: "Enrollment",
  coachLevel: "LEVEL 1",
  durationWeeks: 12,
  personsAllowed: 1,
  pricing: { basePrice: 4999, reward: 0, currency: "INR" },
  image: null,
  status: "active",
  legacyPackageId: 15,
  createdAt: null,
  updatedAt: null,
  content: { description: "d", inclusions: null, whatNext: null, termsAndConditions: null, eligibility: null },
  deletedAt: null,
  legacy: null,
  ...overrides,
});

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
const ok = (data: unknown, status = 200) => json(status, { success: true, data });
const fail = (status: number, code: string, message: string) => json(status, { success: false, error: { code, message } });

interface Captured {
  url: string;
  method: string;
  body: unknown;
  file: Blob | null;
}
const captured: Captured[] = [];
const stubFetch = (handler: (url: string, method: string) => Response | Promise<Response>) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      captured.push({
        url: String(input),
        method,
        body: typeof init?.body === "string" ? JSON.parse(init.body) : null,
        file: init?.body instanceof Blob ? init.body : null,
      });
      return handler(String(input), method);
    }),
  );

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

const pick = async (file: File) => {
  lastPicked = file;
  fireEvent.change(screen.getByLabelText("Plan Cover Image file"), { target: { files: [file] } });
  const dialog = await screen.findByRole("dialog");
  await within(dialog).findByAltText("Image being cropped");
  fireEvent.click(within(dialog).getByRole("button", { name: "Apply" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
};

const jpeg = (name = "cover.jpg") => new File([new Uint8Array([0xff, 0xd8, 0xff, 1])], name, { type: "image/jpeg" });
const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const imageWrites = () => captured.filter((c) => c.url.endsWith("/image"));

beforeEach(() => {
  captured.length = 0;
  tokenStore.set("t");
  URL.createObjectURL = () => "blob:preview";
  URL.revokeObjectURL = () => {};
  vi.mocked(loadImage).mockResolvedValue({ element: {} as HTMLImageElement, width: 1500, height: 500 });
  vi.mocked(cropToBlob).mockImplementation(async () => lastPicked!);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  tokenStore.clear();
  setUnauthorizedHandler(() => {});
});

describe("Plan cover image — Add", () => {
  it("1-2. Add Plan offers a 3:1 cover upload with the recommended size", () => {
    stubFetch(() => ok({}));
    renderAt("/content/gogetfit-plans/new");
    expect(screen.getAllByText("Plan Cover Image")).toHaveLength(1);
    expect(screen.getByText(/Recommended size 1500 × 500 px · 3:1 ratio/)).toBeTruthy();
    const empty = screen.getByRole("img", { name: "No plan cover image" });
    expect((empty.parentElement as HTMLElement).style.aspectRatio).toBe("3 / 1");
  });

  it("3. creates the plan first, then uploads the image under its id", async () => {
    stubFetch((url, method) =>
      method === "POST" ? ok({ plan: plan({ id: "new1" }) }, 201) : url.endsWith("/image") ? ok({ plan: plan({ id: "new1", image: img("a.jpg") }) }) : ok({ plan: plan({ id: "new1" }) }),
    );
    const router = renderAt("/content/gogetfit-plans/new");
    await pick(jpeg());
    expect(screen.getByAltText("Plan Cover Image preview").getAttribute("src")).toBe("blob:preview");
    expect(captured).toHaveLength(0); // nothing uploads before the plan exists

    fill(/Plan Name/, "12 WEEKS GOGETFIT PLAN");
    fill(/Duration/, "12");
    fill(/Persons Allowed/, "1");
    fill(/Base Price/, "4999");
    fireEvent.click(screen.getByRole("button", { name: "Add Plan" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/content/gogetfit-plans/new1"));
    const order = captured.filter((c) => c.method !== "GET").map((c) => `${c.method} ${c.url.replace(/^.*\/api/, "")}`);
    expect(order).toEqual(["POST /admin/gogetfit-plans", "PUT /admin/gogetfit-plans/new1/image"]);
    // The plan write never carries the image.
    expect(captured[0].body).not.toHaveProperty("image");
    expect(imageWrites()[0].file?.type).toBe("image/jpeg");
  });

  it("9. an image failure after creation keeps the plan and sends the admin to edit", async () => {
    stubFetch((url, method) =>
      method === "POST" ? ok({ plan: plan({ id: "new1" }) }, 201) : url.endsWith("/image") ? fail(500, "INTERNAL_ERROR", "disk") : ok({ plan: plan({ id: "new1" }) }),
    );
    const router = renderAt("/content/gogetfit-plans/new");
    await pick(jpeg());
    fill(/Plan Name/, "P");
    fill(/Duration/, "12");
    fill(/Persons Allowed/, "1");
    fill(/Base Price/, "1");
    fireEvent.click(screen.getByRole("button", { name: "Add Plan" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/content/gogetfit-plans/new1/edit"));
    expect(await screen.findByText("Plan added, but the cover image could not be uploaded. Try again here.")).toBeTruthy();
    expect(captured.some((c) => c.method === "DELETE")).toBe(false);
  });
});

describe("Plan cover image — Edit", () => {
  it("4-5. shows the current image and replaces it through the image endpoint", async () => {
    stubFetch((_url, method) =>
      method === "PUT" ? ok({ plan: plan({ image: img("new.jpg") }) }) : ok({ plan: plan({ image: img("old.jpg") }) }),
    );
    renderAt("/content/gogetfit-plans/p1/edit");
    const preview = await screen.findByAltText("Plan Cover Image preview");
    expect(preview.getAttribute("src")).toBe("/uploads/gogetfit-plans/p1/cover/old.jpg");

    await pick(jpeg("replacement.jpg"));
    await waitFor(() =>
      expect(screen.getByAltText("Plan Cover Image preview").getAttribute("src")).toBe("/uploads/gogetfit-plans/p1/cover/new.jpg"),
    );
    expect(imageWrites()[0]).toMatchObject({ method: "PUT" });
    expect(imageWrites()[0].url).toContain("/admin/gogetfit-plans/p1/image");
    // No plan PATCH happened for an image change.
    expect(captured.some((c) => c.method === "PATCH")).toBe(false);
  });

  it("6. removes the image", async () => {
    stubFetch((_url, method) => (method === "DELETE" ? ok({ plan: plan({ image: null }) }) : ok({ plan: plan({ image: img("old.jpg") }) })));
    renderAt("/content/gogetfit-plans/p1/edit");
    fireEvent.click(await screen.findByRole("button", { name: "Remove Plan Cover Image" }));
    expect(await screen.findByRole("img", { name: "No plan cover image" })).toBeTruthy();
    expect(imageWrites()[0]).toMatchObject({ method: "DELETE" });
  });

  it("9. an upload error is shown under the control", async () => {
    stubFetch((_url, method) =>
      method === "PUT" ? fail(400, "UNSUPPORTED_IMAGE_TYPE", "Unsupported image. Accepted formats: image/jpeg, image/png, image/webp") : ok({ plan: plan() }),
    );
    renderAt("/content/gogetfit-plans/p1/edit");
    await screen.findByDisplayValue("12 WEEKS GOGETFIT PLAN");
    await pick(jpeg());
    expect(await screen.findByText(/Unsupported image/)).toBeTruthy();
    expect(screen.getByRole("img", { name: "No plan cover image" })).toBeTruthy();
  });
});

describe("Plan cover image — list and view", () => {
  const page = (plans: unknown[]) => ok({ plans, pagination: { page: 1, pageSize: 10, total: plans.length, totalPages: 1 } });

  it("7, 10. the list shows each plan's own thumbnail, and a placeholder for plans without one", async () => {
    stubFetch(() =>
      page([plan({ id: "a", name: "WITH IMAGE", image: img("a.jpg") }), plan({ id: "b", name: "NO IMAGE", image: null })]),
    );
    renderAt("/content/gogetfit-plans");
    const thumb = await screen.findByAltText("WITH IMAGE cover");
    expect(thumb.getAttribute("src")).toBe("/uploads/gogetfit-plans/p1/cover/a.jpg");
    expect((thumb.parentElement as HTMLElement).style.aspectRatio).toBe("3 / 1");
    expect(screen.getByRole("img", { name: "NO IMAGE: no cover image" })).toBeTruthy();
    expect(screen.queryByAltText("NO IMAGE cover")).toBeNull();
  });

  it("8. the view page shows the cover at 3:1, and falls back on a load error", async () => {
    stubFetch(() => ok({ plan: plan({ image: img("hero.jpg") }) }));
    renderAt("/content/gogetfit-plans/p1");
    const cover = await screen.findByAltText("12 WEEKS GOGETFIT PLAN cover");
    expect((cover.parentElement as HTMLElement).style.aspectRatio).toBe("3 / 1");
    fireEvent.error(cover);
    expect(await screen.findByRole("img", { name: "12 WEEKS GOGETFIT PLAN: no cover image" })).toBeTruthy();
  });
});
