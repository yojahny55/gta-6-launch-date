/**
 * IP Address Hashing Utility Module Tests
 *
 * Comprehensive test coverage for IP hashing, validation, and extraction.
 * Per ADR-011: MANDATORY 100% coverage for utility functions.
 *
 * Test Coverage:
 * - BLAKE2b/SHA-256 hashing (deterministic output, correct length)
 * - IP address validation (IPv4, IPv6, invalid formats)
 * - IP extraction from headers (CF-Connecting-IP, X-Forwarded-For, X-Real-IP)
 * - Salt versioning (different salts produce different hashes)
 * - Security validation (rainbow table resistance, entropy check)
 * - Edge cases (empty salt, missing headers, malformed IPs)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashIP,
  validateIPAddress,
  extractClientIP,
  detectHashAlgorithm,
  hashRequestIP,
  type IPHash,
  type HashAlgorithm,
} from './ip-hash';

describe('IP Hashing Utility Module', () => {
  // Test salt values (64-char hex strings, 32 bytes)
  const TEST_SALT_V1 = '5f2bb3278cfe4794d5a8a9bc37a09d7ec92ca18f6c7a5c0eee7644c4737749b7';
  const TEST_SALT_V2 = 'a1b2c3d4e5f6071829384756ab8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708';

  describe('validateIPAddress', () => {
    describe('IPv4 validation', () => {
      it('should accept valid IPv4 addresses', () => {
        const validIPv4Addresses = [
          '127.0.0.1', // localhost
          '192.168.1.1', // private network
          '10.0.0.1', // private network
          '8.8.8.8', // Google DNS
          '1.1.1.1', // Cloudflare DNS
          '255.255.255.255', // broadcast
          '0.0.0.0', // any address
        ];

        validIPv4Addresses.forEach((ip) => {
          expect(validateIPAddress(ip)).toBe(true);
        });
      });

      it('should reject invalid IPv4 addresses', () => {
        const invalidIPv4Addresses = [
          '256.1.1.1', // octet > 255
          '1.256.1.1',
          '1.1.256.1',
          '1.1.1.256',
          '999.999.999.999', // all octets > 255
          '192.168.1', // missing octet
          '192.168.1.1.1', // too many octets
          '192.168.-1.1', // negative octet
          '192.168.1.a', // non-numeric octet
        ];

        invalidIPv4Addresses.forEach((ip) => {
          expect(validateIPAddress(ip)).toBe(false);
        });
      });
    });

    describe('IPv6 validation', () => {
      it('should accept valid IPv6 addresses', () => {
        const validIPv6Addresses = [
          '::1', // localhost (compressed)
          '2001:0db8:85a3:0000:0000:8a2e:0370:7334', // full format
          '2001:db8:85a3::8a2e:370:7334', // compressed
          'fe80::1', // link-local
          '::ffff:192.0.2.1', // IPv4-mapped IPv6
        ];

        validIPv6Addresses.forEach((ip) => {
          expect(validateIPAddress(ip)).toBe(true);
        });
      });

      it('should reject invalid IPv6 addresses', () => {
        const invalidIPv6Addresses = [
          ':::', // too many colons
          '2001:db8:85a3::8a2e:370g:7334', // invalid hex char 'g'
          '2001:db8:85a3::8a2e::7334', // double compression
          'gggg::', // invalid hex
        ];

        invalidIPv6Addresses.forEach((ip) => {
          expect(validateIPAddress(ip)).toBe(false);
        });
      });
    });

    describe('Edge cases', () => {
      it('should reject empty string', () => {
        expect(validateIPAddress('')).toBe(false);
      });

      it('should reject non-IP strings', () => {
        const nonIPStrings = ['localhost', 'example.com', 'not-an-ip', '   ', 'null', 'undefined'];

        nonIPStrings.forEach((ip) => {
          expect(validateIPAddress(ip)).toBe(false);
        });
      });

      it('should reject non-string values', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(validateIPAddress(null as any)).toBe(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(validateIPAddress(undefined as any)).toBe(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(validateIPAddress(123 as any)).toBe(false);
      });

      it('should handle whitespace by trimming', () => {
        expect(validateIPAddress('  192.168.1.1  ')).toBe(true);
        expect(validateIPAddress('  ::1  ')).toBe(true);
      });
    });
  });

  describe('extractClientIP', () => {
    it('should extract IP from CF-Connecting-IP header (Cloudflare)', () => {
      const request = new Request('https://example.com', {
        headers: {
          'CF-Connecting-IP': '203.0.113.1',
        },
      });

      const ip = extractClientIP(request);
      expect(ip).toBe('203.0.113.1');
    });

    it('should fallback to X-Forwarded-For header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'X-Forwarded-For': '203.0.113.2, 198.51.100.1',
        },
      });

      const ip = extractClientIP(request);
      expect(ip).toBe('203.0.113.2'); // First IP in comma-separated list
    });

    it('should fallback to X-Real-IP header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'X-Real-IP': '203.0.113.3',
        },
      });

      const ip = extractClientIP(request);
      expect(ip).toBe('203.0.113.3');
    });

    it('should prioritize CF-Connecting-IP over other headers', () => {
      const request = new Request('https://example.com', {
        headers: {
          'CF-Connecting-IP': '203.0.113.1',
          'X-Forwarded-For': '203.0.113.2',
          'X-Real-IP': '203.0.113.3',
        },
      });

      const ip = extractClientIP(request);
      expect(ip).toBe('203.0.113.1'); // CF-Connecting-IP takes precedence
    });

    it('should return empty string if no IP headers present', () => {
      const request = new Request('https://example.com', {
        headers: {},
      });

      const ip = extractClientIP(request);
      expect(ip).toBe('');
    });

    it('should trim whitespace from extracted IP', () => {
      const request = new Request('https://example.com', {
        headers: {
          'CF-Connecting-IP': '  203.0.113.1  ',
        },
      });

      const ip = extractClientIP(request);
      expect(ip).toBe('203.0.113.1');
    });

    it('should extract first IP from X-Forwarded-For comma-separated list', () => {
      const request = new Request('https://example.com', {
        headers: {
          'X-Forwarded-For': '  203.0.113.1  ,  198.51.100.1  ,  192.0.2.1  ',
        },
      });

      const ip = extractClientIP(request);
      expect(ip).toBe('203.0.113.1');
    });
  });

  describe('hashIP', () => {
    describe('Deterministic output', () => {
      it('should produce same hash for same IP + salt', async () => {
        const ip = '192.168.1.1';
        const hash1 = await hashIP(ip, TEST_SALT_V1);
        const hash2 = await hashIP(ip, TEST_SALT_V1);

        expect(hash1).toBe(hash2);
      });

      it('should produce same hash for same IP + salt (100 iterations)', async () => {
        const ip = '8.8.8.8';
        const hashes = new Set<string>();

        for (let i = 0; i < 100; i++) {
          const hash = await hashIP(ip, TEST_SALT_V1);
          hashes.add(hash);
        }

        // All hashes should be identical (set size = 1)
        expect(hashes.size).toBe(1);
      });
    });

    describe('Hash format validation', () => {
      it('should produce 64-character hex string (256-bit hash)', async () => {
        const ip = '192.168.1.1';
        const hash = await hashIP(ip, TEST_SALT_V1);

        expect(hash.length).toBe(64);
      });

      it('should only contain lowercase hexadecimal characters [0-9a-f]', async () => {
        const ip = '192.168.1.1';
        const hash = await hashIP(ip, TEST_SALT_V1);

        const hexRegex = /^[0-9a-f]{64}$/;
        expect(hash).toMatch(hexRegex);
      });

      it('should produce lowercase hex (not uppercase)', async () => {
        const ip = '192.168.1.1';
        const hash = await hashIP(ip, TEST_SALT_V1);

        expect(hash).toBe(hash.toLowerCase());
        expect(hash).not.toMatch(/[A-F]/); // No uppercase hex
      });
    });

    describe('Salt versioning (FR79)', () => {
      it('should produce different hashes for same IP with different salts', async () => {
        const ip = '192.168.1.1';
        const hashV1 = await hashIP(ip, TEST_SALT_V1);
        const hashV2 = await hashIP(ip, TEST_SALT_V2);

        expect(hashV1).not.toBe(hashV2);
      });

      it('should produce different hashes for all IPs with different salts', async () => {
        const testIPs = ['127.0.0.1', '8.8.8.8', '1.1.1.1', '::1', '2001:db8::1'];

        for (const ip of testIPs) {
          const hashV1 = await hashIP(ip, TEST_SALT_V1);
          const hashV2 = await hashIP(ip, TEST_SALT_V2);
          expect(hashV1).not.toBe(hashV2);
        }
      });
    });

    describe('IPv4 and IPv6 support', () => {
      it('should hash IPv4 addresses', async () => {
        const ipv4Addresses = ['127.0.0.1', '192.168.1.1', '8.8.8.8', '255.255.255.255'];

        for (const ip of ipv4Addresses) {
          const hash = await hashIP(ip, TEST_SALT_V1);
          expect(hash.length).toBe(64);
          expect(hash).toMatch(/^[0-9a-f]{64}$/);
        }
      });

      it('should hash IPv6 addresses', async () => {
        const ipv6Addresses = ['::1', '2001:db8::1', 'fe80::1'];

        for (const ip of ipv6Addresses) {
          const hash = await hashIP(ip, TEST_SALT_V1);
          expect(hash.length).toBe(64);
          expect(hash).toMatch(/^[0-9a-f]{64}$/);
        }
      });

      it('should produce different hashes for IPv4 vs IPv6 localhost', async () => {
        const ipv4Localhost = '127.0.0.1';
        const ipv6Localhost = '::1';

        const hashV4 = await hashIP(ipv4Localhost, TEST_SALT_V1);
        const hashV6 = await hashIP(ipv6Localhost, TEST_SALT_V1);

        expect(hashV4).not.toBe(hashV6);
      });
    });

    describe('Error handling', () => {
      it('should throw error if salt is empty', async () => {
        const ip = '192.168.1.1';
        await expect(hashIP(ip, '')).rejects.toThrow('Salt cannot be empty');
      });

      it('should throw error if salt is whitespace only', async () => {
        const ip = '192.168.1.1';
        await expect(hashIP(ip, '   ')).rejects.toThrow('Salt cannot be empty');
      });

      it('should throw error if IP is invalid', async () => {
        const invalidIP = 'not-an-ip';
        await expect(hashIP(invalidIP, TEST_SALT_V1)).rejects.toThrow('Invalid IP address format');
      });

      it('should throw error if IP is empty', async () => {
        await expect(hashIP('', TEST_SALT_V1)).rejects.toThrow('Invalid IP address format');
      });

      it('should throw error for malformed IPs (potential injection)', async () => {
        const malformedIPs = ["'; DROP TABLE--", '<script>alert(1)</script>', '999.999.999.999'];

        for (const ip of malformedIPs) {
          await expect(hashIP(ip, TEST_SALT_V1)).rejects.toThrow('Invalid IP address format');
        }
      });
    });

    describe('Security properties', () => {
      it('should produce unique hashes for different IPs', async () => {
        const ips = [
          '192.168.1.1',
          '192.168.1.2',
          '192.168.1.3',
          '10.0.0.1',
          '8.8.8.8',
          '1.1.1.1',
          '::1',
          '2001:db8::1',
        ];

        const hashes = new Set<string>();
        for (const ip of ips) {
          const hash = await hashIP(ip, TEST_SALT_V1);
          hashes.add(hash);
        }

        // All hashes should be unique (no collisions)
        expect(hashes.size).toBe(ips.length);
      });

      it('should have high entropy (Shannon entropy > 3.5 for hex)', async () => {
        const ip = '192.168.1.1';
        const hash = await hashIP(ip, TEST_SALT_V1);

        // Calculate Shannon entropy of hash
        const freq: Record<string, number> = {};
        for (const char of hash) {
          freq[char] = (freq[char] || 0) + 1;
        }

        let entropy = 0;
        for (const char in freq) {
          const p = freq[char] / hash.length;
          entropy -= p * Math.log2(p);
        }

        // Hex string should have entropy close to 4.0 (log2(16))
        // Lower bound: 3.5 (indicates good randomness)
        expect(entropy).toBeGreaterThan(3.5);
      });

      it('should resist rainbow table attacks (hash appears random)', async () => {
        const knownIP = '8.8.8.8'; // Google DNS (well-known IP)
        const hash = await hashIP(knownIP, TEST_SALT_V1);

        // Hash should not contain obvious patterns
        // Check: no character repeated more than 10 times (out of 64)
        const charCounts: Record<string, number> = {};
        for (const char of hash) {
          charCounts[char] = (charCounts[char] || 0) + 1;
        }

        const maxRepetition = Math.max(...Object.values(charCounts));
        expect(maxRepetition).toBeLessThan(10); // No char dominates the hash
      });

      it('should produce no collisions in 1000 random IPs', async () => {
        const hashes = new Set<string>();
        const iterations = 1000;

        for (let i = 0; i < iterations; i++) {
          // Generate random IPv4 address
          const ip = `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
          const hash = await hashIP(ip, TEST_SALT_V1);
          hashes.add(hash);
        }

        // All hashes should be unique (256-bit hash provides 2^128 collision resistance)
        expect(hashes.size).toBe(iterations);
      });
    });
  });

  describe('detectHashAlgorithm', () => {
    it('should detect hash algorithm (BLAKE2b-256 or SHA-256)', async () => {
      const algorithm = await detectHashAlgorithm();

      expect(algorithm).toMatch(/^(BLAKE2b-256|SHA-256)$/);
    });

    it('should return same algorithm on multiple calls', async () => {
      const algo1 = await detectHashAlgorithm();
      const algo2 = await detectHashAlgorithm();

      expect(algo1).toBe(algo2);
    });
  });

  describe('hashRequestIP', () => {
    it('should extract and hash IP from request in one operation', async () => {
      const request = new Request('https://example.com', {
        headers: {
          'CF-Connecting-IP': '203.0.113.1',
        },
      });

      const hash = await hashRequestIP(request, TEST_SALT_V1);

      // Verify hash format
      expect(hash.length).toBe(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);

      // Verify hash is deterministic (same as hashIP directly)
      const directHash = await hashIP('203.0.113.1', TEST_SALT_V1);
      expect(hash).toBe(directHash);
    });

    it('should throw error if IP cannot be extracted from request', async () => {
      const request = new Request('https://example.com', {
        headers: {}, // No IP headers
      });

      await expect(hashRequestIP(request, TEST_SALT_V1)).rejects.toThrow(
        'Could not extract IP address from request'
      );
    });

    it('should throw error if salt is empty', async () => {
      const request = new Request('https://example.com', {
        headers: {
          'CF-Connecting-IP': '203.0.113.1',
        },
      });

      await expect(hashRequestIP(request, '')).rejects.toThrow('Salt cannot be empty');
    });

    it('should handle IPv6 addresses from request', async () => {
      const request = new Request('https://example.com', {
        headers: {
          'CF-Connecting-IP': '2001:db8::1',
        },
      });

      const hash = await hashRequestIP(request, TEST_SALT_V1);

      expect(hash.length).toBe(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('Type exports', () => {
    it('should export IPHash type', () => {
      const hash: IPHash = 'a3bb189e8bf9388899912ace4e6543002f1a2b3c4d5e6f7890abcdef12345678';
      expect(typeof hash).toBe('string');
    });

    it('should export HashAlgorithm type', () => {
      const algo: HashAlgorithm = 'SHA-256';
      expect(['BLAKE2b-256', 'SHA-256']).toContain(algo);
    });
  });
});
