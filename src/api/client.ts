/**
 * The portal's single HTTP client. Every request to the new Node backend goes
 * through here so that token attachment and 401 handling exist in exactly one
 * place.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

const TOKEN_KEY = "ggf-admin-token";

/** Raised for any non-2xx response, carrying the backend's error code. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  /** Authenticated but not permitted - a role the account does not hold. */
  get isForbidden() {
    return this.status === 403;
  }

  get isUnauthenticated() {
    return this.status === 401;
  }
}

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      // Private mode or blocked site data: the session just will not persist.
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

/**
 * Invoked whenever the backend rejects our token. The AuthProvider registers a
 * handler that clears the session and sends the operator back to /login.
 *
 * A 403 is NOT routed here: it means the session is valid but this account is
 * not an administrator, which the page should surface rather than silently
 * logging the person out.
 */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler = () => {};
export const setUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  onUnauthorized = handler;
};

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /**
   * A file sent as the raw request body with its own Content-Type - the shape the
   * backend's image endpoints take (no multipart). Mutually exclusive with body.
   */
  file?: Blob;
  /** Skip the Authorization header - used by the login call itself. */
  anonymous?: boolean;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, file, anonymous = false, signal } = options;

  const headers: Record<string, string> = {};
  if (file) headers["Content-Type"] = file.type || "application/octet-stream";
  else if (body !== undefined) headers["Content-Type"] = "application/json";

  if (!anonymous) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: file ?? (body === undefined ? undefined : JSON.stringify(body)),
      signal,
    });
  } catch (cause) {
    if ((cause as Error)?.name === "AbortError") throw cause;
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the server");
  }

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = (payload as { error?: { code?: string; message?: string } } | null)?.error;

    // An expired or revoked token invalidates the whole session.
    if (response.status === 401 && !anonymous) onUnauthorized();

    throw new ApiError(
      response.status,
      error?.code ?? "UNKNOWN_ERROR",
      error?.message ?? `Request failed with status ${response.status}`,
    );
  }

  return (payload as { data: T }).data;
}
