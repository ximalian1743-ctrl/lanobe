/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Build-time git SHA injected by the Azure deploy workflow. */
  readonly VITE_COMMIT_SHA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
