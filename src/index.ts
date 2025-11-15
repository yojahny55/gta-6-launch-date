import { Hono } from 'hono';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => {
  return c.text('GTA 6 Launch Date Prediction Tracker - API');
});

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
