/**
 * Where the portal loads a stored image from.
 *
 * The backend prefixes stored-file URLs with STORAGE_PUBLIC_BASE_URL, which is set
 * for the mobile app (on the Android emulator that is http://10.0.2.2:3000 - a
 * host a desktop browser cannot reach). The portal therefore keeps only the
 * /uploads/... path and loads it from its own origin (proxied to the backend in
 * development) or from VITE_MEDIA_BASE_URL when that is set.
 */
const MEDIA_BASE = (import.meta.env.VITE_MEDIA_BASE_URL ?? "").replace(/\/$/, "");

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const { pathname } = new URL(url, window.location.origin);
    return pathname.startsWith("/uploads/") ? `${MEDIA_BASE}${pathname}` : url;
  } catch {
    return url;
  }
}
