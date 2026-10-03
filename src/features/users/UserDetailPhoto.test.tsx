import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { UserDetailPage } from "./UserDetailPage";
import { tokenStore } from "../../api/client";

const user = (profilePicture: string | null) => ({
  id: "u1",
  phone: { raw: "9876543210", normalized: "919876543210" },
  profile: {
    name: "Prajwal",
    email: "prajwal@gogetfitonline.com",
    isEmailVerified: true,
    dateOfBirth: "2001-09-22",
    age: 25,
    gender: "male",
    city: "Davangere",
    profilePicture,
    freeDietPlanId: null,
    fitnessProfile: { height: 176.8, weight: 66.3, bodyFatPercentage: 15, activityLevel: "sedentary", foodType: "nonVegetarian", goal: "maintainPhysique", bmr: 1648, tdee: 1977.6 },
  },
  profileCompleted: true,
  roles: ["user", "admin"],
  status: "active",
  legacy: null,
  createdAt: null,
  updatedAt: null,
});

const renderWith = (picture: string | null) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ success: true, data: { user: user(picture) } }), { status: 200, headers: { "Content-Type": "application/json" } })),
  );
  render(<RouterProvider router={createMemoryRouter([{ path: "/users/:id", element: <UserDetailPage /> }], { initialEntries: ["/users/u1"] })} />);
};

beforeEach(() => tokenStore.set("t"));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  tokenStore.clear();
});

describe("User details - profile photo", () => {
  it("clicking the photo opens it full screen; Esc, the close button and the backdrop close it", async () => {
    renderWith("http://10.0.2.2:3000/uploads/profile/abc.png");
    const open = await screen.findByRole("button", { name: "View Prajwal's profile photo" });

    fireEvent.click(open);
    const dialog = screen.getByRole("dialog", { name: "Prajwal - profile photo" });
    // Loaded from the portal's own origin, not the emulator host.
    expect(dialog.querySelector("img")!.getAttribute("src")).toBe("/uploads/profile/abc.png");

    // Clicking the image itself keeps it open.
    fireEvent.click(dialog.querySelector("img")!);
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(open);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(open);
    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("without a photo there is nothing to open", async () => {
    renderWith(null);
    await screen.findByRole("heading", { name: "Prajwal" });
    expect(screen.queryByRole("button", { name: /profile photo/ })).toBeNull();
  });
});
