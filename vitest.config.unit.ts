import { defineConfig } from 'vitest/config';

// Standard Node.js test config for unit tests that don't need Workers runtime
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['src/**/*.test.ts'], // Exclude Workers-specific tests
    globals: true,
  },
});
