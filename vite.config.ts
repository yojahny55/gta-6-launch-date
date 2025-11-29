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
      // Story 5.6: Performance Optimization - Minification and bundle optimization
      minify: 'terser', // Use terser for better minification than esbuild
      terserOptions: {
        compress: {
          drop_console: mode === 'production', // Remove console.log in production
          drop_debugger: true,
          pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
        },
        mangle: {
          safari10: true, // Safari 10 compatibility
        },
        format: {
          comments: false, // Remove all comments
        },
      },
      // Code splitting and chunk optimization
      rollupOptions: {
        external: ['hono'],
        output: {
          // Manual chunks for better caching
          manualChunks: undefined, // Let Vite handle automatic chunking
          // Asset naming with content hash for cache busting
          entryFileNames: '[name].[hash].js',
          chunkFileNames: '[name].[hash].js',
          assetFileNames: '[name].[hash][extname]',
        },
      },
      // Target modern browsers for smaller bundles
      target: 'es2020',
      // Source maps for production debugging (external file)
      sourcemap: mode === 'production' ? 'hidden' : true,
      // Report compressed size (helps track bundle bloat)
      reportCompressedSize: true,
      // Set chunk size warning limit (30KB gzipped as per AC)
      chunkSizeWarningLimit: 30,
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
