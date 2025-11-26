import { Hono } from 'hono';
import type { Env } from './types';
import { rateLimitMiddleware } from './middleware/rate-limiter';
import { createPredictRoutes } from './routes/predict';
import { createStatsRoutes } from './routes/stats';
import { createPredictionsRoutes } from './routes/predictions';

const app = new Hono<{ Bindings: Env }>();

// Apply rate limiting middleware to all API routes
app.use('/api/*', rateLimitMiddleware);

// Register prediction routes (Story 2.7, 2.8)
app.route('/', createPredictRoutes());

// Register statistics routes (Story 2.10)
app.route('/', createStatsRoutes());

// Register predictions data routes (Story 3.4b)
app.route('/', createPredictionsRoutes());

app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
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

export default app;
