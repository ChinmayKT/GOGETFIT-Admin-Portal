import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, cleanup, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthProvider";
import { RequireAuth } from "../router/RequireAuth";
import { tokenStore } from "../../api/client";
import type { AdminUser } from "../../types/admin";

const ADMIN: AdminUser = {
  id: "6ab233294116332146bf2174",
  phone: { raw: "918123260930", normalized: "918123260930" },
  profile: {
    name: "Prajwal",
    email: "prajwal@gogetfitonline.com",
    isEmailVerified: true,
    dateOfBirth: "1991-07-16",
    age: 35,
    gender: "male",
    city: "Davangere",
    profilePicture: null,
    freeDietPlanId: null,
    fitnessProfile: {
      height: 174,
      weight: 65,
      bodyFatPercentage: 17.61,
      activityLevel: "active",
      foodType: "nonVegetarian",
      goal: "fatLoss",
      bmr: 1613,
      tdee: 1936,
    },
  },
  profileCompleted: true,
  roles: ["user", "admin"],
  status: "active",
  legacy: { source: "gogetfit", userId: 187 },
  createdAt: "2026-09-22T07:50:01.662Z",
  updatedAt: "2026-09-26T09:34:03.055Z",
};

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const fail = (status: number, code: string, message = "nope") =>
  new Response(JSON.stringify({ success: false, error: { code, message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Exposes the auth context so tests can drive login/logout directly. */
function Probe() {
  const { admin, isAuthenticated, initializing, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="state">
        {initializing ? "initializing" : isAuthenticated ? "authenticated" : "anonymous"}
      </span>
      <span data-testid="name">{admin?.name ?? ""}</span>
      <span data-testid="roles">{admin?.roles.join(",") ?? ""}</span>
      <button onClick={() => void login("admin@example.test", "not-a-real-password")}>login</button>
      <button onClick={logout}>logout</button>
      <button
        onClick={() => {
          void login("wrong@example.com", "bad");
        }}
      >
        login-bad
      </button>
    </div>
  );
}

beforeEach(() => tokenStore.clear());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  tokenStore.clear();
});

describe("AuthProvider login state", () => {
  it("starts anonymous when there is no stored token, without calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("anonymous"));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("logs in, stores the token and exposes the admin from /admin/me", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve(
          String(url).includes("/auth/admin/login")
            ? ok({ token: "tok-abc", user: ADMIN })
            : ok({ user: ADMIN }),
        ),
      ),
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await act(async () => {
      screen.getByText("login").click();
    });

    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("authenticated"));
    expect(screen.getByTestId("name").textContent).toBe("Prajwal");
    // Additive roles survive into the session.
    expect(screen.getByTestId("roles").textContent).toBe("user,admin");
    expect(tokenStore.get()).toBe("tok-abc");
  });

  it("keeps no session when the credentials are rejected", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(fail(401, "INVALID_CREDENTIALS", "Invalid email or password"))));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await act(async () => {
      screen.getByText("login-bad").click();
    });

    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("anonymous"));
    expect(tokenStore.get()).toBeNull();
  });

  it("refuses the session when the account authenticates but is not an admin (403 from /me)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve(
          String(url).includes("/auth/admin/login")
            ? ok({ token: "tok-abc", user: ADMIN })
            : fail(403, "FORBIDDEN", "Insufficient permissions"),
        ),
      ),
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await act(async () => {
      screen.getByText("login").click();
    });

    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("anonymous"));
    expect(tokenStore.get()).toBeNull();
  });

  it("re-validates a stored token against the backend on reload", async () => {
    tokenStore.set("stored-token");
    const fetchMock = vi.fn((url: string) => Promise.resolve(ok({ user: ADMIN, _url: url })));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("authenticated"));
    expect(String(fetchMock.mock.calls[0][0])).toContain("/admin/me");
  });

  it("discards a stored token the backend rejects (401) instead of trusting it", async () => {
    tokenStore.set("revoked-token");
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(fail(401, "TOKEN_INVALID"))));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("anonymous"));
    expect(tokenStore.get()).toBeNull();
  });

  it("discards a stored token whose account lost the admin role (403)", async () => {
    tokenStore.set("demoted-token");
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(fail(403, "FORBIDDEN"))));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("anonymous"));
  });

  it("logout clears the stored token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        Promise.resolve(
          String(url).includes("/auth/admin/login") ? ok({ token: "tok-abc", user: ADMIN }) : ok({ user: ADMIN }),
        ),
      ),
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await act(async () => {
      screen.getByText("login").click();
    });
    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("authenticated"));

    await act(async () => {
      screen.getByText("logout").click();
    });

    expect(screen.getByTestId("state").textContent).toBe("anonymous");
    expect(tokenStore.get()).toBeNull();
  });

  it("a tampered localStorage token cannot manufacture a session", async () => {
    tokenStore.set("i-made-this-up");
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(fail(401, "TOKEN_INVALID"))));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("anonymous"));
  });
});

describe("RequireAuth route guard", () => {
  const renderGuarded = () =>
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/login" element={<p>login screen</p>} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <p>secret dashboard</p>
                </RequireAuth>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

  it("redirects an anonymous visitor to /login", async () => {
    vi.stubGlobal("fetch", vi.fn());

    renderGuarded();

    await waitFor(() => expect(screen.getByText("login screen")).toBeTruthy());
  });

  it("admits an authenticated admin", async () => {
    tokenStore.set("stored-token");
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(ok({ user: ADMIN }))));

    renderGuarded();

    await waitFor(() => expect(screen.getByText("secret dashboard")).toBeTruthy());
  });

  it("does not flash /login while a stored token is being re-validated", async () => {
    tokenStore.set("stored-token");
    let resolve: ((r: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>((r) => {
        resolve = r;
      })),
    );

    renderGuarded();

    // Still in flight: neither screen may be shown.
    expect(screen.queryByText("login screen")).toBeNull();
    expect(screen.queryByText("secret dashboard")).toBeNull();

    await act(async () => {
      resolve?.(ok({ user: ADMIN }));
    });

    await waitFor(() => expect(screen.getByText("secret dashboard")).toBeTruthy());
  });
});
