import { describe, expect, it } from "vitest";
import { formatCalendarDay, formatDate, formatDateTime } from "./format";

describe("dates are shown as DD/MM/YYYY", () => {
  it("formatDate", () => {
    expect(formatDate(new Date(2026, 9, 1, 10, 30).toISOString())).toBe("01/10/2026");
    expect(formatDate(new Date(1998, 8, 20).toISOString())).toBe("20/09/1998");
    expect(formatDate(null)).toBe("—");
    expect(formatDate("not a date")).toBe("—");
  });

  it("calendar days stored at UTC midnight keep their day in every timezone", () => {
    expect(formatDate("2026-10-31T00:00:00.000Z", { timeZone: "UTC" })).toBe("31/10/2026");
  });

  it("formatDateTime adds a 24-hour time", () => {
    expect(formatDateTime(new Date(2026, 9, 1, 14, 5).toISOString())).toBe("01/10/2026, 14:05");
  });

  it("formatCalendarDay reads yyyy-mm-dd without any timezone shift", () => {
    expect(formatCalendarDay("2026-12-25")).toBe("25/12/2026");
    expect(formatCalendarDay("")).toBe("—");
  });
});
