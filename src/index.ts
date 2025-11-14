import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.text('GTA 6 Launch Date Prediction Tracker - API');
});

app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

export default app;
