import { describe, expect, it } from "vitest";

import { NAV_GROUPS } from "./navigation";

/** The modules that actually exist; everything else is dimmed in the sidebar. */
const BUILT = [
  "/users",
  "/users/clients",
  "/coaches",
  "/nutrition/freediets",
  "/nutrition/foods",
  "/fitness/workouts",
  "/content/gogetfit-plans",
  "/commerce/coupons",
  "/commerce/in-cart",
];

const allItems = NAV_GROUPS.flatMap((group) => group.items);

describe("sidebar navigation", () => {
  it("marks exactly the modules that are built", () => {
    const built = allItems.filter((item) => item.built).map((item) => item.path);
    expect(built.sort()).toEqual([...BUILT].sort());
  });

  it("leaves every other module unmarked, so the sidebar dims it", () => {
    const unbuilt = allItems.filter((item) => !item.built);
    // The portal is mostly placeholders: a nav where everything looks finished
    // says nothing about where the work actually is.
    expect(unbuilt.length).toBeGreaterThan(BUILT.length);
    for (const item of unbuilt) {
      expect(BUILT).not.toContain(item.path);
    }
  });

  it("keeps every item reachable — dimmed is not removed", () => {
    for (const item of allItems) {
      expect(item.path.startsWith("/")).toBe(true);
      expect(item.label.trim()).not.toBe("");
    }
    expect(new Set(allItems.map((i) => i.path)).size).toBe(allItems.length);
  });
});
