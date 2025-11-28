import { Hono } from 'hono';
import type { Env } from './types';
import { rateLimitMiddleware } from './middleware/rate-limiter';
import { securityHeadersMiddleware } from './middleware/security-headers';
import { metaInjectionMiddleware } from './middleware/meta-injection';
import { createPredictRoutes } from './routes/predict';
import { createStatsRoutes } from './routes/stats';
import { createSentimentRoutes } from './routes/sentiment';
import { createPredictionsRoutes } from './routes/predictions';
import { createDegradationRoutes } from './routes/degradation';
import { createDeleteRoutes } from './routes/delete';
import { runDailyCleanup, generateCleanupReportSummary } from './services/cleanup.service';

const app = new Hono<{ Bindings: Env }>();

// Apply meta injection middleware to all routes (Story 5.3)
// Must be applied BEFORE other middleware to intercept HTML responses
app.use('*', metaInjectionMiddleware);

// Apply security headers middleware to all routes (Story 3.5 follow-up)
app.use('*', securityHeadersMiddleware);

// Apply rate limiting middleware to all API routes
app.use('/api/*', rateLimitMiddleware);

// Register prediction routes (Story 2.7, 2.8)
app.route('/', createPredictRoutes());

// Register statistics routes (Story 2.10)
app.route('/', createStatsRoutes());

// Register sentiment routes (Story 10.1)
app.route('/', createSentimentRoutes());

// Register predictions data routes (Story 3.4b)
app.route('/', createPredictionsRoutes());

// Register degradation status routes (Story 3.7)
app.route('/', createDegradationRoutes());

// Register delete routes (Story 4.6)
app.route('/', createDeleteRoutes());

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve HTML files with meta injection (Story 5.3)
// Handle index.html requests to inject dynamic meta tags
// Note: html_handling = "none" in wrangler.toml ensures HTML goes through this handler
app.get('/', async (c) => {
  try {
    // Fetch index.html from Assets binding
    // Use the request URL to maintain proper context
    const assetUrl = new URL(c.req.url);
    assetUrl.pathname = '/index.html';

    const response = await c.env.ASSETS.fetch(assetUrl.toString());

    if (!response.ok) {
      return c.notFound();
    }

    // Get HTML content
    const html = await response.text();

    // Return HTML response (meta injection middleware will process it)
    return c.html(html);
  } catch (error) {
    console.error('Error serving index.html:', error);
    return c.text('Error loading page', 500);
  }
});

// Serve other HTML pages with meta injection (privacy, terms, about, delete)
app.get('/:page.html', async (c) => {
  try {
    const page = c.req.param('page');
    const assetUrl = new URL(c.req.url);
    assetUrl.pathname = `/${page}.html`;

    const response = await c.env.ASSETS.fetch(assetUrl.toString());

    if (!response.ok) {
      return c.notFound();
    }

    const html = await response.text();
    return c.html(html);
  } catch (error) {
    console.error('Error serving HTML page:', error);
    return c.text('Error loading page', 500);
  }
});

// Database connection test endpoint (Story 1.2 - Task 5)
app.get('/api/db-test', async (c) => {
  try {
    // Test database connection by querying the predictions table
    const result = await c.env.DB.prepare('SELECT COUNT(*) as count FROM predictions').first();

    return c.json({
      success: true,
      message: 'Database connection successful',
      data: {
        predictions_count: result?.count || 0,
        database_connected: true,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    return c.json(
      {
        success: false,
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

// Export Hono app as default fetch handler
export default {
  fetch: app.fetch,

  /**
   * Scheduled event handler for Cloudflare Cron Triggers
   * Story 4.8: Data Retention Policy - Daily cleanup at 2 AM UTC
   *
   * To enable: Uncomment the [triggers] section in wrangler.toml
   *
   * @param event ScheduledEvent from Cloudflare Workers
   * @param env Environment bindings (DB, KV namespaces, etc.)
   * @param ctx ExecutionContext for extending worker lifetime
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Starting scheduled data retention cleanup',
        context: {
          scheduledTime: event.scheduledTime,
          cron: event.cron,
        },
      })
    );

    try {
      // Run daily cleanup and wait for completion
      ctx.waitUntil(
        (async () => {
          const report = await runDailyCleanup(env.DB);
          const summary = generateCleanupReportSummary(report);

          console.log(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              level: 'INFO',
              message: 'Scheduled cleanup completed successfully',
              context: {
                report,
                summary,
              },
            })
          );

          // Log any errors that occurred during cleanup
          if (report.errors.length > 0) {
            console.error(
              JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'ERROR',
                message: 'Cleanup completed with errors',
                context: {
                  errorCount: report.errors.length,
                  errors: report.errors,
                },
              })
            );
          }
        })()
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          message: 'Scheduled cleanup failed',
          context: {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
        })
      );
    }
  },
};
