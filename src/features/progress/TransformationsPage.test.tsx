import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TransformationsPage } from "./TransformationsPage";
import { setUnauthorizedHandler, tokenStore } from "../../api/client";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const item = (id: string, title: string) => ({
  id,
  title,
  imageUrl: `http://10.0.2.2:3000/uploads/coach-transformations/c1/${id}.png`,
  submittedAt: "2026-11-04T10:00:00.000Z",
  coach: { id: "c1", name: "Asha" },
  clientId: "u1",
});

const urls: string[] = [];
const stubFetch = (...answers: Response[]) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return answers.shift() ?? json(500, { success: false });
    }),
  );
};

describe("TransformationsPage", () => {
  beforeEach(() => {
    urls.length = 0;
    tokenStore.set("test-admin-token");
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    tokenStore.clear();
    setUnauthorizedHandler(() => {});
  });

  it("shows each coach-submitted image with its title, from the API - nothing else", async () => {
    stubFetch(
      json(200, {
        success: true,
        data: { items: [item("t2", "12 weeks, 8 kg down"), item("t1", "Lost 2 kg")], pagination: { total: 2 } },
      }),
    );
    render(<TransformationsPage />);
    expect(await screen.findByText("12 weeks, 8 kg down")).toBeTruthy();
    expect(screen.getByText("Lost 2 kg")).toBeTruthy();
    expect(urls[0]).toContain("/admin/transformations?page=1&pageSize=24");
    const img = screen.getByAltText("12 weeks, 8 kg down") as HTMLImageElement;
    // Loaded from the portal's own origin, not the app's emulator host.
    expect(img.getAttribute("src")).toBe("/uploads/coach-transformations/c1/t2.png");
    // No review workflow, filters, tabs or seed data.
    expect(screen.queryByRole("button", { name: /add transformation/i })).toBeNull();
    expect(screen.queryByPlaceholderText(/search/i)).toBeNull();
    expect(screen.queryByText(/pending review/i)).toBeNull();
  });

  it("a broken image shows 'Image unavailable', keeping its title", async () => {
    stubFetch(json(200, { success: true, data: { items: [item("t1", "Lost 2 kg")], pagination: { total: 1 } } }));
    render(<TransformationsPage />);
    fireEvent.error(await screen.findByAltText("Lost 2 kg"));
    expect(screen.getByRole("img", { name: "Image unavailable" })).toBeTruthy();
    expect(screen.getByText("Lost 2 kg")).toBeTruthy();
  });

  it("empty: says no coach has submitted yet", async () => {
    stubFetch(json(200, { success: true, data: { items: [], pagination: { total: 0 } } }));
    render(<TransformationsPage />);
    expect(await screen.findByText("No transformations yet")).toBeTruthy();
  });

  it("an error offers retry, which loads them", async () => {
    stubFetch(
      json(500, { success: false, error: { code: "INTERNAL", message: "boom" } }),
      json(200, { success: true, data: { items: [item("t1", "Lost 2 kg")], pagination: { total: 1 } } }),
    );
    render(<TransformationsPage />);
    fireEvent.click(await screen.findByRole("button", { name: /retry|try again/i }));
    await waitFor(() => expect(screen.getByText("Lost 2 kg")).toBeTruthy());
    expect(urls).toHaveLength(2);
  });
});
