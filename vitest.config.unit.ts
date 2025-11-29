import { defineConfig } from 'vitest/config';

// Standard Node.js test config for unit tests that don't need Workers runtime
export default defineConfig({
  test: {
    include: [
      'tests/**/*.test.ts',
      'src/utils/**/*.test.ts',
      'src/services/**/*.test.ts', // Story 2.10: Statistics service tests
      'src/routes/stats.test.ts', // Story 2.10: Stats route tests (unit testable)
      'src/routes/predictions.test.ts', // Story 3.4b: Predictions route tests (unit testable)
      'public/js/**/*.test.js', // Story 3.2: Frontend comparison tests
    ],
    exclude: [
      'src/index.test.ts',
      'src/db/**/*.test.ts',
      'src/routes/predict.test.ts', // Requires Workers runtime - run in test:workers
    ], // Exclude Workers-specific tests
    globals: true,
    environment: 'happy-dom', // Use happy-dom for DOM tests
    // Resource optimization (Test Performance Fix - Sprint Change 2025-11-26)
    maxConcurrency: 3, // Limit concurrent test execution to prevent RAM exhaustion
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4, // Max 4 threads to prevent 32GB+ RAM consumption
        minThreads: 1,
      },
    },
    // Run heavy tests sequentially (DOM manipulation + fake timers)
    sequence: {
      concurrent: false, // Sequential execution for Stories 3.4 & 3.5 tests
    },
  },
});
