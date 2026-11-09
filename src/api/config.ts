/**
 * Where the portal finds the GOGETFIT backend. The single source of truth for
 * every backend URL: the API client and stored-media links both read from here.
 *
 * VITE_API_BASE_URL is set per Vite mode:
 *   .env.development  -> http://localhost:3000        (npm run dev)
 *   .env.staging      -> http://13.233.157.200:3000   (npm run build -- --mode staging)
 * A personal override goes in .env.development.local / .env.staging.local.
 *
 * Only public URLs belong in VITE_* variables - Vite inlines them into the
 * shipped JavaScript, so a secret placed there is readable by anyone.
 */

/** The backend mounts every API route under this prefix (see backend src/app.js). */
const API_PREFIX = "/api";

export interface ApiConfig {
  /** Joined with endpoint paths such as "/admin/users". */
  apiBaseUrl: string;
  /** Prefix for /uploads/... media paths; "" means the portal's own origin. */
  mediaBaseUrl: string;
}

const stripTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

/**
 * Normalizes VITE_API_BASE_URL into the API base.
 *
 * - unset/blank           -> "/api" (same-origin; the Vite dev proxy or a reverse proxy forwards it)
 * - a bare server origin  -> origin + "/api"  (http://localhost:3000 -> http://localhost:3000/api)
 * - a URL or path that already names its API path is kept (http://host:3000/api, /api)
 */
export function resolveApiBaseUrl(raw: string | undefined): string {
  const value = stripTrailingSlashes((raw ?? "").trim());
  if (!value) return API_PREFIX;

  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    return url.pathname === "/" ? `${value}${API_PREFIX}` : value;
  }
  return value;
}

/**
 * Where /uploads/... media is loaded from: VITE_MEDIA_BASE_URL when set, else the
 * origin of an absolute API URL (the backend serves both), else the portal's own
 * origin (same-origin proxying).
 */
export function resolveMediaBaseUrl(rawMedia: string | undefined, apiBaseUrl: string): string {
  const media = stripTrailingSlashes((rawMedia ?? "").trim());
  if (media) return media;
  return /^https?:\/\//i.test(apiBaseUrl) ? new URL(apiBaseUrl).origin : "";
}

export function resolveApiConfig(env: { VITE_API_BASE_URL?: string; VITE_MEDIA_BASE_URL?: string }): ApiConfig {
  const apiBaseUrl = resolveApiBaseUrl(env.VITE_API_BASE_URL);
  return { apiBaseUrl, mediaBaseUrl: resolveMediaBaseUrl(env.VITE_MEDIA_BASE_URL, apiBaseUrl) };
}

export const apiConfig: ApiConfig = resolveApiConfig(import.meta.env);
