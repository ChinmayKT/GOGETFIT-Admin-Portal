import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UserListPage } from "./UserListPage";
import { ToastProvider } from "../../components/feedback/ToastProvider";
import { tokenStore } from "../../api/client";
import type { AdminUser, Role } from "../../types/admin";

const makeUser = (id: string, overrides: Partial<AdminUser> = {}): AdminUser => ({
  id,
  phone: { raw: `9190000000${id}`, normalized: `9190000000${id}` },
  profile: {
    name: `User ${id}`,
    email: `user${id}@example.com`,
    isEmailVerified: true,
    dateOfBirth: "1990-01-01",
    age: 36,
    gender: "male",
    city: "Bengaluru",
    profilePicture: null,
    freeDietPlanId: null,
    fitnessProfile: {
      height: 175,
      weight: 70,
      bodyFatPercentage: 18,
      activityLevel: "active",
      foodType: "vegetarian",
      goal: "fatLoss",
      bmr: 1600,
      tdee: 1900,
    },
  },
  profileCompleted: true,
  roles: ["user"],
  status: "active",
  legacy: null,
  createdAt: "2026-01-15T00:00:00.000Z",
  updatedAt: "2026-01-15T00:00:00.000Z",
  ...overrides,
});

const listResponse = (users: AdminUser[], total = users.length, page = 1, pageSize = 25) =>
  new Response(
    JSON.stringify({
      success: true,
      data: { users, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );

const renderPage = () =>
  render(
    <MemoryRouter>
      <ToastProvider>
        <UserListPage />
      </ToastProvider>
    </MemoryRouter>,
  );

/** Captures the URL of each /admin/users request the page makes. */
const capturedUrls: string[] = [];

beforeEach(() => {
  capturedUrls.length = 0;
  tokenStore.set("test-token");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  tokenStore.clear();
});

describe("UserListPage", () => {
  it("loads users from the backend and renders them", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        capturedUrls.push(String(url));
        return Promise.resolve(listResponse([makeUser("1"), makeUser("2")]));
      }),
    );

    renderPage();

    await waitFor(() => expect(screen.getByText("User 1")).toBeTruthy());
    expect(screen.getByText("user2@example.com")).toBeTruthy();
    expect(capturedUrls[0]).toContain("/admin/users");
  });

  it("shows Verified / Not verified under the email from isEmailVerified", async () => {
    const unverified = makeUser("2");
    unverified.profile = { ...unverified.profile, isEmailVerified: false };
    const noEmail = makeUser("3");
    noEmail.profile = { ...noEmail.profile, email: null, isEmailVerified: false };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(listResponse([makeUser("1"), unverified, noEmail]))));

    renderPage();

    await waitFor(() => expect(screen.getByText("User 1")).toBeTruthy());
    expect(screen.getAllByText("Verified")).toHaveLength(1);
    expect(screen.getAllByText("Not verified")).toHaveLength(1);
  });

  it("requests a bounded page size - never the whole collection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        capturedUrls.push(String(url));
        return Promise.resolve(listResponse([makeUser("1")]));
      }),
    );

    renderPage();

    await waitFor(() => expect(capturedUrls.length).toBeGreaterThan(0));
    expect(capturedUrls[0]).toContain("pageSize=25");
    expect(capturedUrls[0]).toContain("page=1");
  });

  it("renders EVERY role a user holds, not just one", async () => {
    const multiRole = makeUser("9", { roles: ["user", "client", "coach", "admin"] as Role[] });
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(listResponse([multiRole]))));

    renderPage();

    await waitFor(() => expect(screen.getByText("User 9")).toBeTruthy());
    // All four badges must be present simultaneously.
    for (const label of ["User", "Client", "Coach", "Admin"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it("shows an error state when the request fails, with a retry", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "boom" } }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }),
        ),
      ),
    );

    renderPage();

    await waitFor(() => expect(screen.getByText(/try again/i)).toBeTruthy());
  });

  it("shows an empty state when there are no users", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(listResponse([], 0))));

    renderPage();

    await waitFor(() => expect(screen.getByText("No users found")).toBeTruthy());
  });

  it("sends the search term to the server rather than filtering locally", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        capturedUrls.push(String(url));
        return Promise.resolve(listResponse([makeUser("1")]));
      }),
    );

    const { container } = renderPage();
    await waitFor(() => expect(capturedUrls.length).toBeGreaterThan(0));

    const input = container.querySelector("input");
    expect(input).toBeTruthy();

    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(input!, { target: { value: "prajwal" } });

    await waitFor(() => expect(capturedUrls.some((u) => u.includes("search=prajwal"))).toBe(true));
  });

  it("sends the role filter to the server", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        capturedUrls.push(String(url));
        return Promise.resolve(listResponse([makeUser("1")]));
      }),
    );

    const { container } = renderPage();
    await waitFor(() => expect(capturedUrls.length).toBeGreaterThan(0));

    const selects = container.querySelectorAll("select");
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(selects[0], { target: { value: "admin" } });

    await waitFor(() => expect(capturedUrls.some((u) => u.includes("role=admin"))).toBe(true));
  });

  it("paginates by asking the server for the next page", async () => {
    const page1 = Array.from({ length: 25 }, (_, i) => makeUser(String(i)));
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        capturedUrls.push(String(url));
        return Promise.resolve(listResponse(page1, 60));
      }),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText("User 0")).toBeTruthy());

    // 1-25 of 60 implies more pages exist.
    expect(screen.getByText(/of 60/)).toBeTruthy();

    const next = screen.getByLabelText(/next page/i);
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.click(next);

    await waitFor(() => expect(capturedUrls.some((u) => u.includes("page=2"))).toBe(true));
  });
});
