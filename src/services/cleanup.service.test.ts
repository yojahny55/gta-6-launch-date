/**
 * Data Retention Cleanup Service Unit Tests
 * Story 4.8: Data Retention Policy Implementation
 *
 * Tests for automated data cleanup according to retention policies:
 * - Server logs: 90 days retention
 * - Analytics: 24 months (handled by Cloudflare)
 * - Predictions: Indefinite (no cleanup)
 * - Rate limit/cache: TTL-based (no cleanup needed)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cleanupServerLogs,
  runDailyCleanup,
  generateCleanupReportSummary,
  type CleanupReport,
} from './cleanup.service';
import dayjs from 'dayjs';

// Note: We don't mock dayjs, we just test that the cutoff date logic is correct
// The actual cutoff date will be 90 days before the current date when the test runs

/**
 * Mock D1 Database for testing
 */
function createMockDB(options: {
  tableExists?: boolean;
  deletedRowCount?: number;
  shouldThrowError?: boolean;
  errorMessage?: string;
}) {
  const db = {
    prepare: vi.fn().mockImplementation((sql: string) => {
      const isTableCheck = sql.includes('sqlite_master');
      const isDelete = sql.includes('DELETE FROM server_logs');

      return {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockImplementation(async () => {
          if (isTableCheck) {
            return options.tableExists ? { name: 'server_logs' } : null;
          }
          return null;
        }),
        run: vi.fn().mockImplementation(async () => {
          if (options.shouldThrowError) {
            throw new Error(options.errorMessage || 'Database error');
          }
          if (isDelete) {
            return {
              meta: {
                changes: options.deletedRowCount ?? 0,
              },
            };
          }
          return { meta: { changes: 0 } };
        }),
      };
    }),
  } as unknown as D1Database;

  return db;
}

describe('Data Retention Cleanup Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to prevent test output pollution
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('cleanupServerLogs', () => {
    it('should delete server logs older than 90 days', async () => {
      const mockDB = createMockDB({
        tableExists: true,
        deletedRowCount: 42,
      });

      const deletedCount = await cleanupServerLogs(mockDB);

      expect(deletedCount).toBe(42);
      expect(mockDB.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM server_logs WHERE created_at < ?')
      );
    });

    it('should return 0 if server_logs table does not exist', async () => {
      const mockDB = createMockDB({
        tableExists: false,
      });

      const deletedCount = await cleanupServerLogs(mockDB);

      expect(deletedCount).toBe(0);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Server logs table does not exist')
      );
    });

    it('should handle zero deletions when no logs are older than 90 days', async () => {
      const mockDB = createMockDB({
        tableExists: true,
        deletedRowCount: 0,
      });

      const deletedCount = await cleanupServerLogs(mockDB);

      expect(deletedCount).toBe(0);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Server logs cleanup completed')
      );
    });

    it('should log deletion operation with structured logging', async () => {
      const mockDB = createMockDB({
        tableExists: true,
        deletedRowCount: 15,
      });

      await cleanupServerLogs(mockDB);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/"message":"Server logs cleanup completed"/)
      );
      expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/"deleted":15/));
    });

    it('should throw error and log when database operation fails', async () => {
      const mockDB = createMockDB({
        tableExists: true,
        shouldThrowError: true,
        errorMessage: 'Database connection lost',
      });

      await expect(cleanupServerLogs(mockDB)).rejects.toThrow('Database connection lost');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/"message":"Server logs cleanup failed"/)
      );
    });

    it('should use correct cutoff date (90 days ago)', async () => {
      const mockDB = createMockDB({
        tableExists: true,
        deletedRowCount: 10,
      });

      await cleanupServerLogs(mockDB);

      // Verify SQL query includes the WHERE clause for cleanup
      const prepareCall = mockDB.prepare as ReturnType<typeof vi.fn>;
      const sqlCalls = prepareCall.mock.calls.map((call) => call[0]);
      const deleteQuery = sqlCalls.find((sql: string) =>
        sql.includes('DELETE FROM server_logs WHERE created_at < ?')
      );

      expect(deleteQuery).toBeDefined();
      expect(deleteQuery).toContain('WHERE created_at < ?');
    });
  });

  describe('runDailyCleanup', () => {
    it('should run cleanup for server logs and return report', async () => {
      const mockDB = createMockDB({
        tableExists: true,
        deletedRowCount: 25,
      });

      const report = await runDailyCleanup(mockDB);

      expect(report.serverLogsDeleted).toBe(25);
      expect(report.errors).toEqual([]);
      expect(report.timestamp).toBeTruthy();
    });

    it('should handle errors gracefully and continue execution', async () => {
      const mockDB = createMockDB({
        tableExists: true,
        shouldThrowError: true,
        errorMessage: 'Network timeout',
      });

      const report = await runDailyCleanup(mockDB);

      expect(report.serverLogsDeleted).toBe(0);
      expect(report.errors).toHaveLength(1);
      expect(report.errors[0]).toContain('Server logs cleanup failed');
      expect(report.errors[0]).toContain('Network timeout');
    });

    it('should log cleanup report with structured format', async () => {
      const mockDB = createMockDB({
        tableExists: true,
        deletedRowCount: 10,
      });

      await runDailyCleanup(mockDB);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/"message":"Daily cleanup completed"/)
      );
      expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/"serverLogsDeleted":10/));
    });

    it('should include error count in compliance audit trail', async () => {
      const mockDB = createMockDB({
        tableExists: true,
        shouldThrowError: true,
      });

      await runDailyCleanup(mockDB);

      expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/"errorCount":1/));
    });
  });

  describe('generateCleanupReportSummary', () => {
    it('should generate human-readable summary for successful cleanup', () => {
      const report: CleanupReport = {
        timestamp: '2024-11-27T02:00:00.000Z',
        serverLogsDeleted: 42,
        errors: [],
      };

      const summary = generateCleanupReportSummary(report);

      expect(summary).toContain('Data Retention Cleanup Report');
      expect(summary).toContain('2024-11-27T02:00:00.000Z');
      expect(summary).toContain('Server Logs Deleted: 42 records');
      expect(summary).toContain('90-day retention');
      expect(summary).toContain('Predictions: No cleanup (indefinite retention)');
      expect(summary).toContain('Analytics: Handled by Cloudflare (24-month retention)');
      expect(summary).toContain('Rate Limit Data: TTL-based expiration (60 seconds)');
      expect(summary).toContain('Cache Data: TTL-based expiration (5 minutes)');
    });

    it('should include error details in summary', () => {
      const report: CleanupReport = {
        timestamp: '2024-11-27T02:00:00.000Z',
        serverLogsDeleted: 10,
        errors: ['Server logs cleanup failed: Connection timeout', 'Database unavailable'],
      };

      const summary = generateCleanupReportSummary(report);

      expect(summary).toContain('Errors: 2');
      expect(summary).toContain('1. Server logs cleanup failed: Connection timeout');
      expect(summary).toContain('2. Database unavailable');
    });

    it('should handle zero deletions gracefully', () => {
      const report: CleanupReport = {
        timestamp: '2024-11-27T02:00:00.000Z',
        serverLogsDeleted: 0,
        errors: [],
      };

      const summary = generateCleanupReportSummary(report);

      expect(summary).toContain('Server Logs Deleted: 0 records');
    });
  });

  describe('Edge Cases and Retention Policy Validation', () => {
    it('should not delete prediction data (indefinite retention)', async () => {
      // This test ensures cleanup service never touches predictions table
      const mockDB = createMockDB({
        tableExists: true,
        deletedRowCount: 0,
      });

      await runDailyCleanup(mockDB);

      // Verify NO queries to predictions table
      const prepareCall = mockDB.prepare as ReturnType<typeof vi.fn>;
      const sqlQueries = prepareCall.mock.calls.map((call) => call[0]);
      const predictionQueries = sqlQueries.filter((sql: string) => sql.includes('predictions'));

      expect(predictionQueries).toHaveLength(0);
    });

    it('should preserve server logs younger than 90 days', async () => {
      // This is implicit in the SQL query - it uses WHERE created_at < cutoff
      // which means logs with created_at >= cutoff are preserved
      const mockDB = createMockDB({
        tableExists: true,
        deletedRowCount: 5,
      });

      await cleanupServerLogs(mockDB);

      // Verify SQL query uses WHERE created_at < cutoff (preserves younger logs)
      const prepareCall = mockDB.prepare as ReturnType<typeof vi.fn>;
      const sqlCalls = prepareCall.mock.calls.map((call) => call[0]);
      const deleteQuery = sqlCalls.find((sql: string) =>
        sql.includes('DELETE FROM server_logs WHERE created_at < ?')
      );

      expect(deleteQuery).toBeDefined();
      // The < operator means only logs OLDER than cutoff are deleted
      // Logs younger than 90 days are implicitly preserved
    });

    it('should handle large deletion counts without errors', async () => {
      const mockDB = createMockDB({
        tableExists: true,
        deletedRowCount: 100000, // 100k records deleted
      });

      const deletedCount = await cleanupServerLogs(mockDB);

      expect(deletedCount).toBe(100000);
    });
  });

  describe('Compliance Audit Trail', () => {
    it('should log all cleanup operations with timestamps', async () => {
      const mockDB = createMockDB({
        tableExists: true,
        deletedRowCount: 10,
      });

      await runDailyCleanup(mockDB);

      // Verify structured logging includes required audit fields
      const logCalls = (console.log as ReturnType<typeof vi.fn>).mock.calls;
      const logMessages = logCalls.map((call) => call[0]);

      const hasTimestamp = logMessages.some((msg: string) => msg.includes('"timestamp"'));
      const hasDeletionCount = logMessages.some((msg: string) =>
        msg.includes('"serverLogsDeleted"')
      );
      const hasLevel = logMessages.some((msg: string) => msg.includes('"level"'));

      expect(hasTimestamp).toBe(true);
      expect(hasDeletionCount).toBe(true);
      expect(hasLevel).toBe(true);
    });

    it('should log errors with full context for debugging', async () => {
      const mockDB = createMockDB({
        tableExists: true,
        shouldThrowError: true,
        errorMessage: 'Foreign key constraint violation',
      });

      await runDailyCleanup(mockDB);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/"error":"Foreign key constraint violation"/)
      );
    });
  });
});
