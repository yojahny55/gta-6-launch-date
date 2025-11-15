import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

// Cloudflare Workers test config for tests that need Workers runtime
export default defineWorkersConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['tests/**'], // Exclude non-Workers tests
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          compatibilityDate: '2025-11-09',
          compatibilityFlags: ['nodejs_compat'],
        },
      },
    },
  },
});
