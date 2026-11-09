/// <reference types="vite/client" />

/** Public build-time settings; see src/api/config.ts. Never put secrets in VITE_* variables. */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_MEDIA_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
