import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load environment variables from .env files
  const env = loadEnv(mode, process.cwd(), '');

  return {
    test: {
      globals: true,
      environment: 'node',
    },
    build: {
      outDir: 'dist',
      lib: {
        entry: 'src/index.ts',
        formats: ['es'],
      },
      rollupOptions: {
        external: ['hono'],
      },
    },
    // Inject environment variables at build time
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_ENVIRONMENT': JSON.stringify(
        env.VITE_ENVIRONMENT,
      ),
    },
  };
});
