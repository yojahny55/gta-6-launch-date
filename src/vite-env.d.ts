/// <reference types="vite/client" />

/**
 * TypeScript type definitions for Vite environment variables
 * Provides type safety when accessing import.meta.env
 */
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_ENVIRONMENT: 'local' | 'dev' | 'production' | 'preview';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
