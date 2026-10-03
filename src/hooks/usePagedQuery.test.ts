import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { usePagedQuery } from "./usePagedQuery";

describe("usePagedQuery", () => {
  it("never lets a slower, older response overwrite a newer one", async () => {
    const resolvers: Record<string, (rows: string[]) => void> = {};
    const fetcher = (params: { q: string }) =>
      new Promise<{ rows: string[]; total: number }>((resolve) => {
        resolvers[params.q] = (rows) => resolve({ rows, total: rows.length });
      });

    const { result, rerender } = renderHook(({ q }) => usePagedQuery(fetcher, { q }), { initialProps: { q: "a" } });
    rerender({ q: "ab" });

    // The newer query answers first, then the older one arrives late.
    await act(async () => resolvers.ab(["only-ab"]));
    await act(async () => resolvers.a(["stale-a-1", "stale-a-2"]));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rows).toEqual(["only-ab"]);
    expect(result.current.total).toBe(1);
  });
});
