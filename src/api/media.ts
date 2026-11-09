import { apiConfig } from "./config";

/**
 * Where the portal loads a stored image from.
 *
 * The backend prefixes stored-file URLs with STORAGE_PUBLIC_BASE_URL, which is set
 * for the mobile app (on the Android emulator that is http://10.0.2.2:3000 - a
 * host a desktop browser cannot reach). The portal therefore keeps only the
 * /uploads/... path and loads it from the backend this build talks to (see
 * apiConfig.mediaBaseUrl: VITE_MEDIA_BASE_URL, else the API server's origin, else
 * the portal's own origin when the API is proxied same-origin).
 */
const MEDIA_BASE = apiConfig.mediaBaseUrl;

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const { pathname } = new URL(url, window.location.origin);
    return pathname.startsWith("/uploads/") ? `${MEDIA_BASE}${pathname}` : url;
  } catch {
    return url;
  }
}
