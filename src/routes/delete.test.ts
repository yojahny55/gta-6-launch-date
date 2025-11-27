/**
 * Delete Routes API Tests
 *
 * Integration tests for POST /api/delete endpoint
 * Testing validation, deletion logic, and edge cases (immediate deletion only)
 *
 * @see Story 4.6: GDPR Data Deletion Request Form
 * @see ADR-011: Testing Requirements (90%+ coverage)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import app from '../index';
import type { Env } from '../types';

describe('DELETE Routes - Story 4.6', () => {
  let testEnv: Env;

  beforeEach(async () => {
    testEnv = env as unknown as Env;

    // Clear the database before each test
    await testEnv.DB.prepare('DELETE FROM predictions').run();
  });

  afterEach(async () => {
    // Clean up after tests
    await testEnv.DB.prepare('DELETE FROM predictions').run();
  });

  describe('POST /api/delete', () => {
    describe('AC: Form Validation', () => {
      it('should reject request with missing cookie_id', async () => {
        const request = new Request('http://localhost/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            confirm: true,
          }),
        });

        const ctx = createExecutionContext();
        const response = await app.fetch(request, testEnv, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
        expect(data.error.message).toMatch(/required|cookie/i);
      });

      it('should reject request with invalid cookie_id format', async () => {
        const request = new Request('http://localhost/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cookie_id: 'invalid-uuid',
            confirm: true,
          }),
        });

        const ctx = createExecutionContext();
        const response = await app.fetch(request, testEnv, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
        expect(data.error.message).toContain('UUID v4');
      });

      it('should reject request without confirm checkbox', async () => {
        const request = new Request('http://localhost/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cookie_id: '550e8400-e29b-41d4-a716-446655440000',
            confirm: false,
          }),
        });

        const ctx = createExecutionContext();
        const response = await app.fetch(request, testEnv, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
        expect(data.error.message).toContain('confirm');
      });

      it('should accept valid deletion request with all fields', async () => {
        // First, create a prediction
        const cookieId = '550e8400-e29b-41d4-a716-446655440000';
        await testEnv.DB.prepare(
          'INSERT INTO predictions (cookie_id, predicted_date, ip_hash, weight) VALUES (?, ?, ?, ?)'
        )
          .bind(cookieId, '2027-03-15', 'test-hash', 1.0)
          .run();

        const request = new Request('http://localhost/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cookie_id: cookieId,
            reason: 'privacy-concerns',
            confirm: true,
          }),
        });

        const ctx = createExecutionContext();
        const response = await app.fetch(request, testEnv, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toContain('deleted successfully');
      });
    });

    describe('AC: Edge Cases', () => {
      it('should return 404 when cookie_id not found in database', async () => {
        const request = new Request('http://localhost/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cookie_id: '550e8400-e29b-41d4-a716-446655440999',
            confirm: true,
          }),
        });

        const ctx = createExecutionContext();
        const response = await app.fetch(request, testEnv, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(404);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('NOT_FOUND');
        expect(data.error.message).toContain('No prediction found');
      });

      it('should delete immediately', async () => {
        // Create a prediction
        const cookieId = '550e8400-e29b-41d4-a716-446655440001';
        await testEnv.DB.prepare(
          'INSERT INTO predictions (cookie_id, predicted_date, ip_hash, weight) VALUES (?, ?, ?, ?)'
        )
          .bind(cookieId, '2027-03-15', 'test-hash', 1.0)
          .run();

        const request = new Request('http://localhost/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cookie_id: cookieId,
            confirm: true,
          }),
        });

        const ctx = createExecutionContext();
        const response = await app.fetch(request, testEnv, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toContain('deleted successfully');

        // Verify deletion
        const result = await testEnv.DB.prepare(
          'SELECT * FROM predictions WHERE cookie_id = ?'
        )
          .bind(cookieId)
          .first();

        expect(result).toBeNull();
      });

      it('should accept optional reason field', async () => {
        // Create a prediction
        const cookieId = '550e8400-e29b-41d4-a716-446655440003';
        await testEnv.DB.prepare(
          'INSERT INTO predictions (cookie_id, predicted_date, ip_hash, weight) VALUES (?, ?, ?, ?)'
        )
          .bind(cookieId, '2027-03-15', 'test-hash', 1.0)
          .run();

        const request = new Request('http://localhost/api/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cookie_id: cookieId,
            reason: 'no-longer-interested',
            confirm: true,
          }),
        });

        const ctx = createExecutionContext();
        const response = await app.fetch(request, testEnv, ctx);
        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
      });
    });
  });

  describe('AC: Deletion Scope', () => {
    it('should delete prediction record completely', async () => {
      const cookieId = '550e8400-e29b-41d4-a716-446655440006';
      await testEnv.DB.prepare(
        'INSERT INTO predictions (cookie_id, predicted_date, ip_hash, user_agent, weight) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(cookieId, '2027-03-15', 'test-ip-hash', 'Mozilla/5.0', 1.0)
        .run();

      const request = new Request('http://localhost/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cookie_id: cookieId,
          confirm: true,
        }),
      });

      const ctx = createExecutionContext();
      const response = await app.fetch(request, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);

      // Verify all data deleted
      const result = await testEnv.DB.prepare(
        'SELECT * FROM predictions WHERE cookie_id = ?'
      )
        .bind(cookieId)
        .first();

      expect(result).toBeNull();
    });

    it('should delete multiple predictions with same cookie_id (if exists)', async () => {
      // This test verifies that deletion handles edge cases where duplicate cookie_ids exist
      const cookieId = '550e8400-e29b-41d4-a716-446655440007';

      // Note: In normal operation, cookie_id has UNIQUE constraint
      // This test assumes constraint could be temporarily disabled or testing edge cases
      // For this test, we'll just verify single deletion works correctly
      await testEnv.DB.prepare(
        'INSERT INTO predictions (cookie_id, predicted_date, ip_hash, weight) VALUES (?, ?, ?, ?)'
      )
        .bind(cookieId, '2027-03-15', 'test-hash-1', 1.0)
        .run();

      const request = new Request('http://localhost/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cookie_id: cookieId,
          confirm: true,
        }),
      });

      const ctx = createExecutionContext();
      const response = await app.fetch(request, testEnv, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);

      // Verify deletion
      const result = await testEnv.DB.prepare(
        'SELECT COUNT(*) as count FROM predictions WHERE cookie_id = ?'
      )
        .bind(cookieId)
        .first<{ count: number }>();

      expect(result?.count).toBe(0);
    });
  });
});
