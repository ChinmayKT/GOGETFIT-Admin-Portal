import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { CoachFormPage } from "./CoachFormPage";
import { CoachDetailPage } from "./CoachDetailPage";
import { ToastProvider } from "../../components/feedback/ToastProvider";
import { tokenStore, setUnauthorizedHandler } from "../../api/client";
import { cropToBlob, loadImage } from "../../components/media/cropImage";

// jsdom cannot decode images or draw on a canvas. The crop passes the picked
// bytes through, so the upload assertions can still check what was sent.
vi.mock("../../components/media/cropImage", () => ({ loadImage: vi.fn(), cropToBlob: vi.fn() }));
let lastPicked: File | null = null;

const USER_AVATAR = "http://10.0.2.2:3000/uploads/profile/user.jpg";
const image = (slot: "profile" | "cover", name: string) => ({
  url: `http://10.0.2.2:3000/uploads/coaches/c1/${slot}/${name}`,
  storageKey: `coaches/c1/${slot}/${name}`,
});

const coachRecord = (pictures: { profilePicture?: unknown; coverPicture?: unknown } = {}) => ({
  id: "c1",
  userId: "u1",
  user: {
    id: "u1",
    name: "Asha Rao",
    phone: "919876543210",
    email: "asha@example.com",
    gender: "female",
    city: "Bengaluru",
    profilePicture: USER_AVATAR,
    roles: ["user", "coach"],
    status: "active",
  },
  profile: {
    profilePicture: null,
    coverPicture: null,
    level: "LEVEL 3",
    specialization: "Fat loss",
    description: null,
    languages: [],
    facebook: null,
    instagram: null,
    linkedin: null,
    transformations: 0,
    availableSlots: 0,
    ...pictures,
  },
  status: "active",
  createdBy: "a1",
  updatedBy: "a1",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
});

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
const ok = (data: unknown) => json(200, { success: true, data });
const fail = (status: number, code: string, message: string) =>
  json(status, { success: false, error: { code, message } });

interface Captured {
  url: string;
  method: string;
  contentType: string | null;
  file: Blob | null;
}
const captured: Captured[] = [];

const stubFetch = (handler: (url: string, method: string) => Response | Promise<Response>) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const headers = (init?.headers ?? {}) as Record<string, string>;
      captured.push({
        url: String(input),
        method,
        contentType: headers["Content-Type"] ?? null,
        file: init?.body instanceof Blob ? init.body : null,
      });
      return handler(String(input), method);
    }),
  );
};

const renderAt = (path: string) => {
  const router = createMemoryRouter(
    [
      { path: "/coaches/:id/edit", element: <CoachFormPage /> },
      { path: "/coaches/:id", element: <CoachDetailPage /> },
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

const jpegFile = (name = "coach.jpg") => new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2])], name, { type: "image/jpeg" });

/** Picks a file; the crop dialog opens, and is applied as-is. */
const pick = async (label: string, file: File) => {
  lastPicked = file;
  fireEvent.change(screen.getByLabelText(`${label} file`), { target: { files: [file] } });
  const dialog = await screen.findByRole("dialog");
  await within(dialog).findByAltText("Image being cropped");
  fireEvent.click(within(dialog).getByRole("button", { name: "Apply" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
};

/** For a file the field rejects before any dialog opens. */
const pickRejected = (label: string, file: File) =>
  fireEvent.change(screen.getByLabelText(`${label} file`), { target: { files: [file] } });

const writes = () => captured.filter((c) => c.method === "PUT" || c.method === "DELETE");

beforeEach(() => {
  captured.length = 0;
  tokenStore.set("test-admin-token");
  URL.createObjectURL = () => "blob:source";
  URL.revokeObjectURL = () => {};
  vi.mocked(loadImage).mockResolvedValue({ element: {} as HTMLImageElement, width: 1200, height: 800 });
  vi.mocked(cropToBlob).mockImplementation(async () => lastPicked!);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  tokenStore.clear();
  setUnauthorizedHandler(() => {});
});

describe("Coach details - Coach Profile tab pictures", () => {
  it("1-2. shows the coach cover and the COACH profile picture, not the user avatar", async () => {
    stubFetch(() =>
      ok({ coach: coachRecord({ profilePicture: image("profile", "p.jpg"), coverPicture: image("cover", "c.jpg") }) }),
    );
    renderAt("/coaches/c1");
    fireEvent.click(await screen.findByRole("tab", { name: "Coach Profile" }));

    const cover = await screen.findByAltText("Asha Rao cover picture");
    const avatar = screen.getByAltText("Asha Rao profile picture");
    // Loaded from the portal's own origin, not the emulator host.
    expect(cover.getAttribute("src")).toBe("/uploads/coaches/c1/cover/c.jpg");
    expect(avatar.getAttribute("src")).toBe("/uploads/coaches/c1/profile/p.jpg");
    expect(avatar.getAttribute("src")).not.toContain("/uploads/profile/user.jpg");
  });

  it("3-4. falls back to placeholders, even though the user has an avatar", async () => {
    stubFetch(() => ok({ coach: coachRecord() }));
    renderAt("/coaches/c1");
    fireEvent.click(await screen.findByRole("tab", { name: "Coach Profile" }));

    expect(await screen.findByRole("img", { name: "No cover picture" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "No profile picture" })).toBeTruthy();
    expect(screen.queryByAltText("Asha Rao profile picture")).toBeNull();
  });
});

describe("Edit Coach pictures", () => {
  it("5, 12. uploads the profile picture as raw bytes with a loading state", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    stubFetch(async (_url, method) => {
      if (method === "PUT") {
        await gate;
        return ok({ coach: coachRecord({ profilePicture: image("profile", "new.jpg") }) });
      }
      return ok({ coach: coachRecord() });
    });
    renderAt("/coaches/c1/edit");
    await screen.findByText("Coach Pictures");

    const file = jpegFile();
    await pick("Coach Profile Picture", file);

    expect(await screen.findByText("Uploading...")).toBeTruthy();
    release();

    const preview = await screen.findByAltText("Coach Profile Picture preview");
    expect(preview.getAttribute("src")).toBe("/uploads/coaches/c1/profile/new.jpg");
    const put = writes()[0];
    expect(put.url).toContain("/admin/coaches/c1/profile-picture");
    expect(put.contentType).toBe("image/jpeg");
    // What is uploaded is the crop, not the original picked file.
    expect(put.file).not.toBe(file);
    expect((put.file as File).name).toBe("coach-cropped.jpg");
    // The cover was not touched.
    expect(screen.getByRole("img", { name: "No coach cover picture" })).toBeTruthy();
  });

  it("6. uploads the cover through its own endpoint", async () => {
    stubFetch((_url, method) =>
      method === "PUT" ? ok({ coach: coachRecord({ coverPicture: image("cover", "c.jpg") }) }) : ok({ coach: coachRecord() }),
    );
    renderAt("/coaches/c1/edit");
    await screen.findByText("Coach Pictures");

    await pick("Coach Cover Picture", jpegFile("cover.jpg"));

    const preview = await screen.findByAltText("Coach Cover Picture preview");
    expect(preview.getAttribute("src")).toBe("/uploads/coaches/c1/cover/c.jpg");
    expect(writes()[0].url).toContain("/admin/coaches/c1/cover-picture");
    expect(screen.getByRole("img", { name: "No coach profile picture" })).toBeTruthy();
  });

  it("7-8. replaces existing pictures and shows Change", async () => {
    const start = coachRecord({ profilePicture: image("profile", "old.jpg"), coverPicture: image("cover", "old.jpg") });
    stubFetch((url, method) => {
      if (method !== "PUT") return ok({ coach: start });
      return url.includes("cover")
        ? ok({ coach: coachRecord({ profilePicture: image("profile", "old.jpg"), coverPicture: image("cover", "new.jpg") }) })
        : ok({ coach: coachRecord({ profilePicture: image("profile", "new.jpg"), coverPicture: image("cover", "old.jpg") }) });
    });
    renderAt("/coaches/c1/edit");

    expect(await screen.findByRole("button", { name: "Change Coach Profile Picture" })).toBeTruthy();
    await pick("Coach Profile Picture", jpegFile());
    await waitFor(() =>
      expect(screen.getByAltText("Coach Profile Picture preview").getAttribute("src")).toContain("/profile/new.jpg"),
    );
    // The cover kept its own image.
    expect(screen.getByAltText("Coach Cover Picture preview").getAttribute("src")).toContain("/cover/old.jpg");

    await pick("Coach Cover Picture", jpegFile());
    await waitFor(() =>
      expect(screen.getByAltText("Coach Cover Picture preview").getAttribute("src")).toContain("/cover/new.jpg"),
    );
    expect(screen.getByAltText("Coach Profile Picture preview").getAttribute("src")).toContain("/profile/new.jpg");
  });

  it("9. removes only the profile picture", async () => {
    const start = coachRecord({ profilePicture: image("profile", "p.jpg"), coverPicture: image("cover", "c.jpg") });
    stubFetch((_url, method) =>
      method === "DELETE" ? ok({ coach: coachRecord({ coverPicture: image("cover", "c.jpg") }) }) : ok({ coach: start }),
    );
    renderAt("/coaches/c1/edit");

    fireEvent.click(await screen.findByRole("button", { name: "Remove Coach Profile Picture" }));

    expect(await screen.findByRole("img", { name: "No coach profile picture" })).toBeTruthy();
    expect(writes()[0]).toMatchObject({ method: "DELETE" });
    expect(writes()[0].url).toContain("/admin/coaches/c1/profile-picture");
    expect(screen.getByAltText("Coach Cover Picture preview")).toBeTruthy();
  });

  it("10. removes only the cover picture", async () => {
    const start = coachRecord({ profilePicture: image("profile", "p.jpg"), coverPicture: image("cover", "c.jpg") });
    stubFetch((_url, method) =>
      method === "DELETE" ? ok({ coach: coachRecord({ profilePicture: image("profile", "p.jpg") }) }) : ok({ coach: start }),
    );
    renderAt("/coaches/c1/edit");

    fireEvent.click(await screen.findByRole("button", { name: "Remove Coach Cover Picture" }));

    expect(await screen.findByRole("img", { name: "No coach cover picture" })).toBeTruthy();
    expect(writes()[0].url).toContain("/admin/coaches/c1/cover-picture");
    expect(screen.getByAltText("Coach Profile Picture preview")).toBeTruthy();
  });

  it("11. shows server upload errors and rejects bad files before uploading", async () => {
    stubFetch((_url, method) =>
      method === "PUT"
        ? fail(400, "UNSUPPORTED_IMAGE_TYPE", "Unsupported image. Accepted formats: image/jpeg, image/png, image/webp")
        : ok({ coach: coachRecord() }),
    );
    renderAt("/coaches/c1/edit");
    await screen.findByText("Coach Pictures");

    pickRejected("Coach Profile Picture", new File(["<svg/>"], "x.svg", { type: "image/svg+xml" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("alert").textContent).toBe("Use a JPEG, PNG or WEBP image.");
    expect(writes()).toHaveLength(0);

    await pick("Coach Profile Picture", jpegFile());
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toMatch(/Unsupported image/),
    );
    expect(screen.getByRole("img", { name: "No coach profile picture" })).toBeTruthy();
  });

  it("does not send pictures with the profile save, and keeps unsaved field edits", async () => {
    stubFetch((_url, method) =>
      method === "PUT"
        ? ok({ coach: coachRecord({ coverPicture: image("cover", "c.jpg") }) })
        : ok({ coach: coachRecord() }),
    );
    renderAt("/coaches/c1/edit");
    const specialization = await screen.findByDisplayValue("Fat loss");
    fireEvent.change(specialization, { target: { value: "Strength" } });

    await pick("Coach Cover Picture", jpegFile());
    await screen.findByAltText("Coach Cover Picture preview");

    // The unsaved text edit survived the picture upload.
    expect(screen.getByDisplayValue("Strength")).toBeTruthy();
    expect(within(document.body).queryByText(/Coach updated successfully/)).toBeNull();
  });
});
