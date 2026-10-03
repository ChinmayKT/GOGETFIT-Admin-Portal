import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CoachLevelPlans } from "./CoachLevelPlans";
import { tokenStore } from "../../api/client";

const row = (id: string, name: string) => ({
  id,
  name,
  planType: "Enrollment",
  coachLevel: "LEVEL 2",
  durationWeeks: 12,
  personsAllowed: 1,
  pricing: { basePrice: 4999, reward: 0, currency: "INR" },
  status: "active",
  legacyPackageId: null,
  createdAt: null,
  updatedAt: null,
});

const urls: string[] = [];
const stub = (plans: unknown[]) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return new Response(
        JSON.stringify({ success: true, data: { plans, pagination: { page: 1, pageSize: 100, total: plans.length, totalPages: 1 } } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }),
  );

beforeEach(() => {
  urls.length = 0;
  tokenStore.set("t");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  tokenStore.clear();
});

describe("CoachLevelPlans", () => {
  it("lists the active plans of the coach's level, read-only", async () => {
    stub([row("p1", "12 WEEKS PLAN"), row("p2", "24 WEEKS PLAN")]);
    render(<MemoryRouter><CoachLevelPlans level="LEVEL 2" /></MemoryRouter>);

    expect((await screen.findByTestId("coach-plan-count")).textContent).toBe("2 active LEVEL 2 plans");
    expect(screen.getByText("12 WEEKS PLAN").closest("a")?.getAttribute("href")).toBe("/content/gogetfit-plans/p1");
    expect(urls[0]).toContain("coachLevel=LEVEL+2");
    expect(urls[0]).toContain("status=active");
    // No assignment controls: the level decides.
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("says when a level has no active plans", async () => {
    stub([]);
    render(<MemoryRouter><CoachLevelPlans level="LEVEL 5" /></MemoryRouter>);
    expect((await screen.findByTestId("coach-plan-count")).textContent).toBe("0 active LEVEL 5 plans");
    expect(screen.getByText(/members see no plans for this coach/)).toBeTruthy();
  });
});
