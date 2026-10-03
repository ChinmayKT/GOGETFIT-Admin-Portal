import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, setUnauthorizedHandler, tokenStore } from "./client";

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("apiRequest", () => {
  beforeEach(() => {
    tokenStore.clear();
    setUnauthorizedHandler(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("attaches the bearer token to authenticated requests", async () => {
    tokenStore.set("tok-123");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: { ok: true } }));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/admin/me");

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer tok-123");
  });

  it("omits the bearer token on anonymous requests such as login", async () => {
    tokenStore.set("tok-123");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: { token: "t" } }));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/auth/admin/login", { method: "POST", body: {}, anonymous: true });

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it("unwraps the data envelope", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { data: { user: { id: "u1" } } })));

    const result = await apiRequest<{ user: { id: string } }>("/admin/me");
    expect(result.user.id).toBe("u1");
  });

  it("invokes the unauthorized handler exactly once on a 401", async () => {
    tokenStore.set("expired");
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(401, { error: { code: "TOKEN_INVALID", message: "bad" } })),
    );

    await expect(apiRequest("/admin/users")).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("does NOT log the operator out on a 403 - the session is still valid", async () => {
    tokenStore.set("valid");
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(403, { error: { code: "FORBIDDEN", message: "nope" } })),
    );

    await expect(apiRequest("/admin/users")).rejects.toMatchObject({ status: 403, isForbidden: true });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("surfaces the backend error code", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(jsonResponse(401, { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } })),
    );

    await expect(apiRequest("/auth/admin/login", { anonymous: true })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password",
    });
  });

  it("reports a network failure as NETWORK_ERROR rather than throwing raw", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(apiRequest("/admin/me")).rejects.toMatchObject({ code: "NETWORK_ERROR", status: 0 });
  });
});
