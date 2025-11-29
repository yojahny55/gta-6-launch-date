/**
 * Data Retention Cleanup Service
 * Story 4.8: Data Retention Policy Implementation
 *
 * Handles automated cleanup of data according to retention policies:
 * - Predictions: Indefinite retention (no cleanup)
 * - Analytics (Cloudflare): 24 months (handled automatically by Cloudflare)
 * - Server logs: 90 days retention
 * - Rate limit data: 60 seconds TTL (automatic via KV)
 * - Cache data: 5 minutes TTL (automatic via KV)
 */

import dayjs from 'dayjs';

export interface CleanupReport {
  timestamp: string;
  serverLogsDeleted: number;
  errors: string[];
}

/**
 * Cleanup server logs older than 90 days
 * Server logs contain: IP addresses, requests, errors
 *
 * @param db D1 database instance
 * @returns Number of server log records deleted
 */
export async function cleanupServerLogs(db: D1Database): Promise<number> {
  const cutoffDate = dayjs().subtract(90, 'days').format('YYYY-MM-DD HH:mm:ss');

  try {
    // Check if server_logs table exists
    const tableCheck = await db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='server_logs'`)
      .first();

    if (!tableCheck) {
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: 'Server logs table does not exist, skipping cleanup',
          context: { cutoffDate },
        })
      );
      return 0;
    }

    const result = await db
      .prepare(`DELETE FROM server_logs WHERE created_at < ?`)
      .bind(cutoffDate)
      .run();

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Server logs cleanup completed',
        context: {
          deleted: result.meta.changes,
          cutoffDate,
          retentionDays: 90,
        },
      })
    );

    return result.meta.changes;
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Server logs cleanup failed',
        context: {
          error: error instanceof Error ? error.message : String(error),
          cutoffDate,
        },
      })
    );
    throw error;
  }
}

/**
 * Run complete daily cleanup routine
 * Executes all cleanup tasks and generates audit report
 *
 * @param db D1 database instance
 * @returns Cleanup report with deletion counts and audit trail
 */
export async function runDailyCleanup(db: D1Database): Promise<CleanupReport> {
  const report: CleanupReport = {
    timestamp: new Date().toISOString(),
    serverLogsDeleted: 0,
    errors: [],
  };

  try {
    // Cleanup server logs (90 days retention)
    report.serverLogsDeleted = await cleanupServerLogs(db);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    report.errors.push(`Server logs cleanup failed: ${errorMessage}`);
  }

  // Log cleanup report for compliance audit trail
  console.log(
    JSON.stringify({
      timestamp: report.timestamp,
      level: 'INFO',
      message: 'Daily cleanup completed',
      context: {
        serverLogsDeleted: report.serverLogsDeleted,
        errorCount: report.errors.length,
        errors: report.errors,
      },
    })
  );

  return report;
}

/**
 * Get cleanup report summary as human-readable string
 *
 * @param report Cleanup report from runDailyCleanup
 * @returns Formatted report string
 */
export function generateCleanupReportSummary(report: CleanupReport): string {
  const lines: string[] = [
    `Data Retention Cleanup Report - ${report.timestamp}`,
    `Server Logs Deleted: ${report.serverLogsDeleted} records (90-day retention)`,
    `Predictions: No cleanup (indefinite retention)`,
    `Analytics: Handled by Cloudflare (24-month retention)`,
    `Rate Limit Data: TTL-based expiration (60 seconds)`,
    `Cache Data: TTL-based expiration (5 minutes)`,
  ];

  if (report.errors.length > 0) {
    lines.push(`Errors: ${report.errors.length}`);
    report.errors.forEach((error, index) => {
      lines.push(`  ${index + 1}. ${error}`);
    });
  }

  return lines.join('\n');
}
