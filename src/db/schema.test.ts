import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';

/**
 * Database Schema Validation Tests
 * Verifies SQLite STRICT mode, UNIQUE constraints, and indexes
 *
 * Story 1.2: Cloudflare Infrastructure Configuration
 * Tests database schema deployment and constraint enforcement
 */

describe('Database Schema - Predictions Table', () => {
  beforeEach(async () => {
    // Clean up test data before each test
    await env.DB.prepare('DELETE FROM predictions').run();
  });

  describe('Table Structure', () => {
    it('should have predictions table created', async () => {
      const result = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='predictions'"
      ).first();

      expect(result).toBeDefined();
      expect(result?.name).toBe('predictions');
    });

    it('should have all required columns', async () => {
      const result = await env.DB.prepare('PRAGMA table_info(predictions)').all();

      const columnNames = result.results.map((col: any) => col.name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('predicted_date');
      expect(columnNames).toContain('submitted_at');
      expect(columnNames).toContain('updated_at');
      expect(columnNames).toContain('ip_hash');
      expect(columnNames).toContain('cookie_id');
      expect(columnNames).toContain('user_agent');
      expect(columnNames).toContain('weight');
    });

    it('should use TEXT datatype for dates (ISO 8601 format)', async () => {
      const result = await env.DB.prepare('PRAGMA table_info(predictions)').all();

      const dateColumns = result.results.filter((col: any) =>
        ['predicted_date', 'submitted_at', 'updated_at'].includes(col.name)
      );

      dateColumns.forEach((col: any) => {
        expect(col.type).toBe('TEXT');
      });
    });

    it('should have REAL datatype for weight column', async () => {
      const result = await env.DB.prepare('PRAGMA table_info(predictions)').all();

      const weightColumn = result.results.find((col: any) => col.name === 'weight');

      expect(weightColumn).toBeDefined();
      expect(weightColumn?.type).toBe('REAL');
    });
  });

  describe('UNIQUE Constraint - ip_hash', () => {
    it('should enforce UNIQUE constraint on ip_hash (FR5 requirement)', async () => {
      const testData = {
        predicted_date: '2027-03-15',
        ip_hash: 'test_hash_123',
        cookie_id: 'cookie_001',
      };

      // Insert first record - should succeed
      await env.DB.prepare(
        'INSERT INTO predictions (predicted_date, ip_hash, cookie_id) VALUES (?, ?, ?)'
      )
        .bind(testData.predicted_date, testData.ip_hash, testData.cookie_id)
        .run();

      // Try to insert duplicate ip_hash - should fail
      await expect(
        env.DB.prepare(
          'INSERT INTO predictions (predicted_date, ip_hash, cookie_id) VALUES (?, ?, ?)'
        )
          .bind(testData.predicted_date, testData.ip_hash, 'cookie_002')
          .run()
      ).rejects.toThrow();
    });

    it('should allow different ip_hash values', async () => {
      const record1 = {
        predicted_date: '2027-03-15',
        ip_hash: 'hash_001',
        cookie_id: 'cookie_001',
      };

      const record2 = {
        predicted_date: '2027-03-16',
        ip_hash: 'hash_002',
        cookie_id: 'cookie_002',
      };

      // Both inserts should succeed (different ip_hash)
      await env.DB.prepare(
        'INSERT INTO predictions (predicted_date, ip_hash, cookie_id) VALUES (?, ?, ?)'
      )
        .bind(record1.predicted_date, record1.ip_hash, record1.cookie_id)
        .run();

      await env.DB.prepare(
        'INSERT INTO predictions (predicted_date, ip_hash, cookie_id) VALUES (?, ?, ?)'
      )
        .bind(record2.predicted_date, record2.ip_hash, record2.cookie_id)
        .run();

      const count = await env.DB.prepare('SELECT COUNT(*) as count FROM predictions').first();
      expect(count?.count).toBe(2);
    });
  });

  describe('UNIQUE Constraint - cookie_id', () => {
    it('should enforce UNIQUE constraint on cookie_id', async () => {
      const testData = {
        predicted_date: '2027-03-15',
        ip_hash: 'hash_001',
        cookie_id: 'test_cookie_123',
      };

      // Insert first record - should succeed
      await env.DB.prepare(
        'INSERT INTO predictions (predicted_date, ip_hash, cookie_id) VALUES (?, ?, ?)'
      )
        .bind(testData.predicted_date, testData.ip_hash, testData.cookie_id)
        .run();

      // Try to insert duplicate cookie_id - should fail
      await expect(
        env.DB.prepare(
          'INSERT INTO predictions (predicted_date, ip_hash, cookie_id) VALUES (?, ?, ?)'
        )
          .bind(testData.predicted_date, 'hash_002', testData.cookie_id)
          .run()
      ).rejects.toThrow();
    });
  });

  describe('STRICT Mode Enforcement', () => {
    it('should enforce STRICT mode type checking', async () => {
      // STRICT mode prevents SQLite type coercion
      // This is verified by the table creation using STRICT keyword
      const tableInfo = await env.DB.prepare(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='predictions'"
      ).first();

      expect(tableInfo?.sql).toContain('STRICT');
    });

    it('should accept valid TEXT for date fields', async () => {
      const validData = {
        predicted_date: '2027-03-15',
        ip_hash: 'hash_valid',
        cookie_id: 'cookie_valid',
      };

      await expect(
        env.DB.prepare(
          'INSERT INTO predictions (predicted_date, ip_hash, cookie_id) VALUES (?, ?, ?)'
        )
          .bind(validData.predicted_date, validData.ip_hash, validData.cookie_id)
          .run()
      ).resolves.toBeDefined();
    });

    it('should accept valid REAL for weight field', async () => {
      const validData = {
        predicted_date: '2027-03-15',
        ip_hash: 'hash_weight',
        cookie_id: 'cookie_weight',
        weight: 1.5,
      };

      await expect(
        env.DB.prepare(
          'INSERT INTO predictions (predicted_date, ip_hash, cookie_id, weight) VALUES (?, ?, ?, ?)'
        )
          .bind(validData.predicted_date, validData.ip_hash, validData.cookie_id, validData.weight)
          .run()
      ).resolves.toBeDefined();
    });
  });

  describe('Indexes', () => {
    it('should have index on predicted_date column', async () => {
      const result = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_predictions_date'"
      ).first();

      expect(result).toBeDefined();
      expect(result?.name).toBe('idx_predictions_date');
    });

    it('should have index on cookie_id column', async () => {
      const result = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_predictions_cookie'"
      ).first();

      expect(result).toBeDefined();
      expect(result?.name).toBe('idx_predictions_cookie');
    });

    it('should have index on submitted_at column', async () => {
      const result = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_predictions_submitted'"
      ).first();

      expect(result).toBeDefined();
      expect(result?.name).toBe('idx_predictions_submitted');
    });
  });

  describe('Default Values', () => {
    it('should auto-generate id (PRIMARY KEY AUTOINCREMENT)', async () => {
      await env.DB.prepare(
        'INSERT INTO predictions (predicted_date, ip_hash, cookie_id) VALUES (?, ?, ?)'
      )
        .bind('2027-03-15', 'hash_auto1', 'cookie_auto1')
        .run();

      await env.DB.prepare(
        'INSERT INTO predictions (predicted_date, ip_hash, cookie_id) VALUES (?, ?, ?)'
      )
        .bind('2027-03-16', 'hash_auto2', 'cookie_auto2')
        .run();

      const results = await env.DB.prepare('SELECT id FROM predictions ORDER BY id').all();

      expect(results.results[0].id).toBe(1);
      expect(results.results[1].id).toBe(2);
    });

    it('should set default weight to 1.0', async () => {
      await env.DB.prepare(
        'INSERT INTO predictions (predicted_date, ip_hash, cookie_id) VALUES (?, ?, ?)'
      )
        .bind('2027-03-15', 'hash_weight_default', 'cookie_weight_default')
        .run();

      const result = await env.DB.prepare('SELECT weight FROM predictions WHERE cookie_id = ?')
        .bind('cookie_weight_default')
        .first();

      expect(result?.weight).toBe(1.0);
    });

    it('should set CURRENT_TIMESTAMP for submitted_at when not provided', async () => {
      const beforeInsert = new Date().toISOString();

      await env.DB.prepare(
        'INSERT INTO predictions (predicted_date, ip_hash, cookie_id) VALUES (?, ?, ?)'
      )
        .bind('2027-03-15', 'hash_timestamp', 'cookie_timestamp')
        .run();

      const result = await env.DB.prepare(
        'SELECT submitted_at FROM predictions WHERE cookie_id = ?'
      )
        .bind('cookie_timestamp')
        .first();

      // Verify timestamp is valid and close to current time
      expect(result?.submitted_at).toBeDefined();
      const timestamp = new Date(result?.submitted_at as string);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThan(new Date(beforeInsert).getTime() - 5000); // Within 5 seconds
    });
  });
});

describe('Database Schema - Email Subscriptions Table', () => {
  beforeEach(async () => {
    await env.DB.prepare('DELETE FROM email_subscriptions').run();
  });

  describe('Table Structure', () => {
    it('should have email_subscriptions table created', async () => {
      const result = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='email_subscriptions'"
      ).first();

      expect(result).toBeDefined();
      expect(result?.name).toBe('email_subscriptions');
    });

    it('should use INTEGER for verified column (STRICT mode boolean)', async () => {
      const result = await env.DB.prepare('PRAGMA table_info(email_subscriptions)').all();

      const verifiedColumn = result.results.find((col: any) => col.name === 'verified');

      expect(verifiedColumn).toBeDefined();
      expect(verifiedColumn?.type).toBe('INTEGER');
    });
  });

  describe('Indexes', () => {
    it('should have index on verified column', async () => {
      const result = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_email_verified'"
      ).first();

      expect(result).toBeDefined();
      expect(result?.name).toBe('idx_email_verified');
    });
  });

  describe('UNIQUE Constraint - email', () => {
    it('should enforce UNIQUE constraint on email', async () => {
      const email = 'test@example.com';

      await env.DB.prepare('INSERT INTO email_subscriptions (email, cookie_id) VALUES (?, ?)')
        .bind(email, 'cookie_001')
        .run();

      // Duplicate email should fail
      await expect(
        env.DB.prepare('INSERT INTO email_subscriptions (email, cookie_id) VALUES (?, ?)')
          .bind(email, 'cookie_002')
          .run()
      ).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should set verified to 0 (false) by default', async () => {
      await env.DB.prepare('INSERT INTO email_subscriptions (email, cookie_id) VALUES (?, ?)')
        .bind('test@example.com', 'cookie_test')
        .run();

      const result = await env.DB.prepare(
        'SELECT verified FROM email_subscriptions WHERE email = ?'
      )
        .bind('test@example.com')
        .first();

      expect(result?.verified).toBe(0); // 0 = false in SQLite INTEGER boolean
    });
  });
});
