/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API origin in production, e.g. https://spendly-api.onrender.com. Empty in dev (Vite proxy). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
