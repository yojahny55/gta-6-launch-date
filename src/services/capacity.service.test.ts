/**
 * Capacity Service Tests (Story 3.7)
 * Tests capacity level calculation, request counting, and queue operations
 * Target: 90%+ coverage per ADR-011
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getCapacityLevel,
  incrementRequestCount,
  hasAlertBeenSent,
  markAlertSent,
  queueSubmission,
  processQueue,
  getHoursUntilReset,
  DAILY_REQUEST_LIMIT,
  CAPACITY_THRESHOLDS,
} from './capacity.service';
import type { QueuedSubmission } from '../types';

/**
 * Mock KV namespace for testing
 */
class MockKVNamespace implements KVNamespace {
  private store: Map<string, string> = new Map();
  private metadata: Map<string, KVNamespaceListResult<unknown, string>> = new Map();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async put(key: string, value: string, options?: KVNamespacePutOptions): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult<unknown, string>> {
    const keys: { name: string }[] = [];
    const prefix = options?.prefix || '';
    const limit = options?.limit || 1000;

    for (const [key] of this.store) {
      if (key.startsWith(prefix)) {
        keys.push({ name: key });
      }
    }

    return {
      keys: keys.slice(0, limit),
      list_complete: keys.length <= limit,
      cacheStatus: null,
    };
  }

  getWithMetadata<Metadata = unknown>(
    key: string,
    options?: Partial<KVNamespaceGetOptions<'text'>>
  ): Promise<{ value: string | null; metadata: Metadata | null; cacheStatus: string | null }> {
    throw new Error('Not implemented');
  }

  // Clear all keys (test helper)
  clear() {
    this.store.clear();
  }
}

/**
 * Mock D1 database for testing
 */
class MockD1Database implements D1Database {
  private predictions: Array<Record<string, unknown>> = [];

  prepare(query: string): D1PreparedStatement {
    const self = this;
    return {
      bind(...values: unknown[]): D1PreparedStatement {
        return this;
      },
      async run(): Promise<D1Result> {
        if (query.includes('INSERT INTO predictions')) {
          const id = self.predictions.length + 1;
          self.predictions.push({ id });
          return {
            success: true,
            meta: {
              last_row_id: id,
              changes: 1,
              duration: 0,
              size_after: 0,
              rows_read: 0,
              rows_written: 1,
            },
            results: [],
          };
        }
        return {
          success: true,
          meta: {
            changes: 0,
            duration: 0,
            size_after: 0,
            rows_read: 0,
            rows_written: 0,
          },
          results: [],
        };
      },
      async first<T = unknown>(): Promise<T | null> {
        return null;
      },
      async all<T = unknown>(): Promise<D1Result<T>> {
        return {
          success: true,
          meta: {
            changes: 0,
            duration: 0,
            size_after: 0,
            rows_read: 0,
            rows_written: 0,
          },
          results: [] as T[],
        };
      },
      async raw<T = unknown>(): Promise<T[]> {
        return [];
      },
    };
  }

  async dump(): Promise<ArrayBuffer> {
    throw new Error('Not implemented');
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    throw new Error('Not implemented');
  }

  async exec(query: string): Promise<D1ExecResult> {
    throw new Error('Not implemented');
  }
}

describe('Capacity Service', () => {
  let mockKV: MockKVNamespace;
  let mockDB: MockD1Database;

  beforeEach(() => {
    mockKV = new MockKVNamespace();
    mockDB = new MockD1Database();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('getCapacityLevel', () => {
    it('should return normal capacity when no requests', async () => {
      const result = await getCapacityLevel(mockKV);

      expect(result.level).toBe('normal');
      expect(result.requestsToday).toBe(0);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should return elevated at exactly 80% (80K requests)', async () => {
      const requestCount = Math.floor(DAILY_REQUEST_LIMIT * CAPACITY_THRESHOLDS.ELEVATED);
      await mockKV.put('capacity:requests:today', requestCount.toString());

      const result = await getCapacityLevel(mockKV);

      expect(result.level).toBe('elevated');
      expect(result.requestsToday).toBe(80000);
    });

    it('should return high at 90% (90K requests)', async () => {
      const requestCount = Math.floor(DAILY_REQUEST_LIMIT * CAPACITY_THRESHOLDS.HIGH);
      await mockKV.put('capacity:requests:today', requestCount.toString());

      const result = await getCapacityLevel(mockKV);

      expect(result.level).toBe('high');
      expect(result.requestsToday).toBe(90000);
    });

    it('should return critical at 95% (95K requests)', async () => {
      const requestCount = Math.floor(DAILY_REQUEST_LIMIT * CAPACITY_THRESHOLDS.CRITICAL);
      await mockKV.put('capacity:requests:today', requestCount.toString());

      const result = await getCapacityLevel(mockKV);

      expect(result.level).toBe('critical');
      expect(result.requestsToday).toBe(95000);
    });

    it('should return exceeded at 100% (100K requests)', async () => {
      await mockKV.put('capacity:requests:today', DAILY_REQUEST_LIMIT.toString());

      const result = await getCapacityLevel(mockKV);

      expect(result.level).toBe('exceeded');
      expect(result.requestsToday).toBe(100000);
    });

    it('should return normal at 79K requests (just below threshold)', async () => {
      await mockKV.put('capacity:requests:today', '79000');

      const result = await getCapacityLevel(mockKV);

      expect(result.level).toBe('normal');
      expect(result.requestsToday).toBe(79000);
    });

    it('should fail-open to normal when KV unavailable', async () => {
      const result = await getCapacityLevel(undefined);

      expect(result.level).toBe('normal');
      expect(result.requestsToday).toBe(0);
    });

    it('should return resetAt as next midnight UTC', async () => {
      const now = new Date('2025-11-26T14:30:00Z');
      vi.setSystemTime(now);

      const result = await getCapacityLevel(mockKV);

      const expectedReset = new Date('2025-11-27T00:00:00Z');
      expect(result.resetAt.getTime()).toBe(expectedReset.getTime());
    });
  });

  describe('incrementRequestCount', () => {
    it('should initialize counter to 1 when no requests exist', async () => {
      const count = await incrementRequestCount(mockKV);

      expect(count).toBe(1);

      const stored = await mockKV.get('capacity:requests:today');
      expect(stored).toBe('1');
    });

    it('should increment existing counter', async () => {
      await mockKV.put('capacity:requests:today', '42');

      const count = await incrementRequestCount(mockKV);

      expect(count).toBe(43);

      const stored = await mockKV.get('capacity:requests:today');
      expect(stored).toBe('43');
    });

    it('should return 0 when KV unavailable', async () => {
      const count = await incrementRequestCount(undefined);

      expect(count).toBe(0);
    });
  });

  describe('hasAlertBeenSent and markAlertSent', () => {
    it('should return false when no alert sent', async () => {
      const sent = await hasAlertBeenSent(mockKV);

      expect(sent).toBe(false);
    });

    it('should return true when alert has been sent', async () => {
      await markAlertSent(mockKV);

      const sent = await hasAlertBeenSent(mockKV);

      expect(sent).toBe(true);
    });

    it('should handle undefined KV gracefully', async () => {
      const sent = await hasAlertBeenSent(undefined);
      expect(sent).toBe(false);

      await markAlertSent(undefined);
      // Should not throw
    });
  });

  describe('queueSubmission', () => {
    it('should queue submission with timestamp-based key', async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const submission: QueuedSubmission = {
        predicted_date: '2027-03-15',
        cookie_id: 'test-cookie-id',
        ip_hash: 'test-ip-hash',
        user_agent: 'Test Agent',
        queued_at: new Date().toISOString(),
      };

      const { position } = await queueSubmission(mockKV, submission);

      expect(position).toBeGreaterThan(0);

      // Verify submission stored in KV
      const keys = await mockKV.list({ prefix: 'queue:' });
      expect(keys.keys.length).toBe(1);
      expect(keys.keys[0].name).toContain('queue:');
    });

    it('should return approximate queue position', async () => {
      // Queue 3 submissions
      const submission: QueuedSubmission = {
        predicted_date: '2027-03-15',
        cookie_id: 'test-cookie',
        ip_hash: 'test-hash',
        user_agent: null,
        queued_at: new Date().toISOString(),
      };

      await queueSubmission(mockKV, submission);
      await queueSubmission(mockKV, submission);
      const { position } = await queueSubmission(mockKV, submission);

      expect(position).toBe(3);
    });

    it('should throw when KV unavailable', async () => {
      const submission: QueuedSubmission = {
        predicted_date: '2027-03-15',
        cookie_id: 'test-cookie',
        ip_hash: 'test-hash',
        user_agent: null,
        queued_at: new Date().toISOString(),
      };

      await expect(queueSubmission(undefined, submission)).rejects.toThrow(
        'KV namespace unavailable'
      );
    });
  });

  describe('processQueue', () => {
    it('should process queued submissions in FIFO order', async () => {
      // Queue 3 submissions with different timestamps
      const baseTime = Date.now();

      for (let i = 0; i < 3; i++) {
        vi.setSystemTime(baseTime + i * 1000);
        const submission: QueuedSubmission = {
          predicted_date: '2027-03-15',
          cookie_id: `cookie-${i}`,
          ip_hash: `hash-${i}`,
          user_agent: null,
          queued_at: new Date().toISOString(),
        };
        await queueSubmission(mockKV, submission);
      }

      // Process queue
      const { processed } = await processQueue(mockKV, mockDB, 10);

      expect(processed).toBe(3);

      // Verify queue is empty
      const keys = await mockKV.list({ prefix: 'queue:' });
      expect(keys.keys.length).toBe(0);
    });

    it('should respect batch size limit', async () => {
      // Queue 5 submissions
      for (let i = 0; i < 5; i++) {
        const submission: QueuedSubmission = {
          predicted_date: '2027-03-15',
          cookie_id: `cookie-${i}`,
          ip_hash: `hash-${i}`,
          user_agent: null,
          queued_at: new Date().toISOString(),
        };
        await queueSubmission(mockKV, submission);
      }

      // Process only 2 at a time
      const { processed } = await processQueue(mockKV, mockDB, 2);

      expect(processed).toBe(2);

      // Verify 3 remain in queue
      const keys = await mockKV.list({ prefix: 'queue:' });
      expect(keys.keys.length).toBe(3);
    });

    it('should return 0 when KV unavailable', async () => {
      const { processed } = await processQueue(undefined, mockDB, 10);

      expect(processed).toBe(0);
    });

    it('should delete queue item after successful processing', async () => {
      const submission: QueuedSubmission = {
        predicted_date: '2027-03-15',
        cookie_id: 'test-cookie',
        ip_hash: 'test-hash',
        user_agent: null,
        queued_at: new Date().toISOString(),
      };
      await queueSubmission(mockKV, submission);

      await processQueue(mockKV, mockDB, 10);

      const keys = await mockKV.list({ prefix: 'queue:' });
      expect(keys.keys.length).toBe(0);
    });
  });

  describe('getHoursUntilReset', () => {
    it('should calculate hours until midnight UTC', () => {
      const now = new Date('2025-11-26T14:30:00Z'); // 2:30 PM UTC
      vi.setSystemTime(now);

      const hours = getHoursUntilReset();

      expect(hours).toBe(10); // 9.5 hours rounded up = 10
    });

    it('should return 24 hours when just past midnight', () => {
      const now = new Date('2025-11-26T00:01:00Z'); // 1 minute past midnight
      vi.setSystemTime(now);

      const hours = getHoursUntilReset();

      expect(hours).toBe(24); // Almost full day remaining
    });

    it('should return 1 hour when 30 minutes before midnight', () => {
      const now = new Date('2025-11-26T23:30:00Z');
      vi.setSystemTime(now);

      const hours = getHoursUntilReset();

      expect(hours).toBe(1); // 0.5 hours rounded up = 1
    });
  });
});
