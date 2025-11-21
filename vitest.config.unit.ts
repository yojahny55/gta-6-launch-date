import { defineConfig } from 'vitest/config';

// Standard Node.js test config for unit tests that don't need Workers runtime
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'src/utils/**/*.test.ts'], // Include utility tests and integration tests
    exclude: ['src/index.test.ts', 'src/db/**/*.test.ts'], // Exclude Workers-specific tests
    globals: true,
    environment: 'happy-dom', // Use happy-dom for DOM tests
  },
});
