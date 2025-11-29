/**
 * Cookie Utility Module Tests
 *
 * Comprehensive test coverage for cookie generation, validation, and management.
 * Per ADR-011: MANDATORY 100% coverage for utility functions.
 *
 * Test Coverage:
 * - UUID v4 generation (crypto.randomUUID())
 * - Cookie validation (valid/invalid UUIDs)
 * - Edge cases (empty string, non-UUID, UUID v1/v3/v5 formats)
 * - Cookie setting and retrieval
 * - Security flags verification
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateCookieID,
  validateCookieID,
  setCookie,
  getCookie,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
  getDefaultCookieOptions,
  type CookieID,
} from './cookie';

describe('Cookie Utility Module', () => {
  describe('generateCookieID', () => {
    it('should generate a valid UUID v4 format', () => {
      const cookieId = generateCookieID();

      // UUID v4 regex: 8-4-4-4-12 with '4' in version position
      const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(cookieId).toBeDefined();
      expect(typeof cookieId).toBe('string');
      expect(cookieId).toMatch(uuidV4Regex);
    });

    it('should generate unique UUIDs (no collisions in 1000 iterations)', () => {
      const generatedIds = new Set<string>();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const id = generateCookieID();
        generatedIds.add(id);
      }

      // All UUIDs should be unique
      expect(generatedIds.size).toBe(iterations);
    });

    it('should have "4" in the version position (13th character)', () => {
      const cookieId = generateCookieID();

      // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // Position 14 (index 14) should be '4'
      expect(cookieId[14]).toBe('4');
    });

    it('should have variant bits [89ab] in correct position (19th character)', () => {
      const cookieId = generateCookieID();

      // UUID format: xxxxxxxx-xxxx-4xxx-Yxxx-xxxxxxxxxxxx
      // Position 19 (index 19) should be [89ab]
      const variantChar = cookieId[19].toLowerCase();
      expect(['8', '9', 'a', 'b']).toContain(variantChar);
    });

    it('should return a string of correct length (36 characters with hyphens)', () => {
      const cookieId = generateCookieID();
      expect(cookieId.length).toBe(36);
    });

    it('should contain exactly 4 hyphens at correct positions', () => {
      const cookieId = generateCookieID();
      expect(cookieId[8]).toBe('-');
      expect(cookieId[13]).toBe('-');
      expect(cookieId[18]).toBe('-');
      expect(cookieId[23]).toBe('-');
    });
  });

  describe('validateCookieID', () => {
    it('should accept valid UUID v4', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(validateCookieID(validUuid)).toBe(true);
    });

    it('should accept generated UUID v4 from generateCookieID()', () => {
      const cookieId = generateCookieID();
      expect(validateCookieID(cookieId)).toBe(true);
    });

    it('should reject empty string', () => {
      expect(validateCookieID('')).toBe(false);
    });

    it('should reject non-UUID string', () => {
      expect(validateCookieID('not-a-uuid')).toBe(false);
      expect(validateCookieID('12345')).toBe(false);
      expect(validateCookieID('random-text-here')).toBe(false);
    });

    it('should reject UUID v1 format (version field != 4)', () => {
      // UUID v1: xxxxxxxx-xxxx-1xxx-yxxx-xxxxxxxxxxxx
      const uuidV1 = '550e8400-e29b-11d4-a716-446655440000';
      expect(validateCookieID(uuidV1)).toBe(false);
    });

    it('should reject UUID v3 format (version field != 4)', () => {
      // UUID v3: xxxxxxxx-xxxx-3xxx-yxxx-xxxxxxxxxxxx
      const uuidV3 = '550e8400-e29b-31d4-a716-446655440000';
      expect(validateCookieID(uuidV3)).toBe(false);
    });

    it('should reject UUID v5 format (version field != 4)', () => {
      // UUID v5: xxxxxxxx-xxxx-5xxx-yxxx-xxxxxxxxxxxx
      const uuidV5 = '550e8400-e29b-51d4-a716-446655440000';
      expect(validateCookieID(uuidV5)).toBe(false);
    });

    it('should reject UUID with wrong variant bits (not [89ab])', () => {
      // Variant should be [89ab], testing with '0' (invalid)
      const invalidVariant = '550e8400-e29b-41d4-0716-446655440000';
      expect(validateCookieID(invalidVariant)).toBe(false);
    });

    it('should reject UUID with missing hyphens', () => {
      const noHyphens = '550e8400e29b41d4a716446655440000';
      expect(validateCookieID(noHyphens)).toBe(false);
    });

    it('should reject UUID with too many characters', () => {
      const tooLong = '550e8400-e29b-41d4-a716-446655440000-extra';
      expect(validateCookieID(tooLong)).toBe(false);
    });

    it('should reject UUID with too few characters', () => {
      const tooShort = '550e8400-e29b-41d4-a716';
      expect(validateCookieID(tooShort)).toBe(false);
    });

    it('should reject UUID with non-hexadecimal characters', () => {
      const nonHex = '550e8400-e29b-41d4-a716-gggggggggggg';
      expect(validateCookieID(nonHex)).toBe(false);
    });

    it('should handle null input gracefully', () => {
      expect(validateCookieID(null as any)).toBe(false);
    });

    it('should handle undefined input gracefully', () => {
      expect(validateCookieID(undefined as any)).toBe(false);
    });

    it('should handle number input gracefully', () => {
      expect(validateCookieID(12345 as any)).toBe(false);
    });

    it('should handle object input gracefully', () => {
      expect(validateCookieID({} as any)).toBe(false);
    });

    it('should handle array input gracefully', () => {
      expect(validateCookieID([] as any)).toBe(false);
    });

    it('should be case-insensitive (accept uppercase and lowercase)', () => {
      const uppercase = '550E8400-E29B-41D4-A716-446655440000';
      const lowercase = '550e8400-e29b-41d4-a716-446655440000';
      const mixed = '550E8400-e29b-41D4-a716-446655440000';

      expect(validateCookieID(uppercase)).toBe(true);
      expect(validateCookieID(lowercase)).toBe(true);
      expect(validateCookieID(mixed)).toBe(true);
    });
  });

  describe('setCookie', () => {
    it('should generate a valid Set-Cookie header with default options', () => {
      const name = 'test_cookie';
      const value = generateCookieID();

      const cookieHeader = setCookie(name, value);

      expect(cookieHeader).toContain(`${name}=`);
      expect(cookieHeader).toContain(value);
      expect(cookieHeader).toContain('Max-Age=63072000'); // 2 years
      expect(cookieHeader).toContain('Path=/');
      expect(cookieHeader).toContain('Secure');
      expect(cookieHeader).toContain('SameSite=Strict');
    });

    it('should respect custom maxAge option', () => {
      const name = 'test_cookie';
      const value = generateCookieID();
      const customMaxAge = 3600; // 1 hour

      const cookieHeader = setCookie(name, value, { maxAge: customMaxAge });

      expect(cookieHeader).toContain(`Max-Age=${customMaxAge}`);
    });

    it('should respect custom path option', () => {
      const name = 'test_cookie';
      const value = generateCookieID();
      const customPath = '/api';

      const cookieHeader = setCookie(name, value, { path: customPath });

      expect(cookieHeader).toContain(`Path=${customPath}`);
    });

    it('should include HttpOnly flag when httpOnly=true', () => {
      const name = 'test_cookie';
      const value = generateCookieID();

      const cookieHeader = setCookie(name, value, { httpOnly: true });

      expect(cookieHeader).toContain('HttpOnly');
    });

    it('should NOT include HttpOnly flag when httpOnly=false (default)', () => {
      const name = 'test_cookie';
      const value = generateCookieID();

      const cookieHeader = setCookie(name, value, { httpOnly: false });

      expect(cookieHeader).not.toContain('HttpOnly');
    });

    it('should include Secure flag when secure=true (default)', () => {
      const name = 'test_cookie';
      const value = generateCookieID();

      const cookieHeader = setCookie(name, value, { secure: true });

      expect(cookieHeader).toContain('Secure');
    });

    it('should NOT include Secure flag when secure=false', () => {
      const name = 'test_cookie';
      const value = generateCookieID();

      const cookieHeader = setCookie(name, value, { secure: false });

      expect(cookieHeader).not.toContain('Secure');
    });

    it('should respect sameSite option (Strict, Lax, None)', () => {
      const name = 'test_cookie';
      const value = generateCookieID();

      const strictCookie = setCookie(name, value, { sameSite: 'Strict' });
      const laxCookie = setCookie(name, value, { sameSite: 'Lax' });
      const noneCookie = setCookie(name, value, { sameSite: 'None' });

      expect(strictCookie).toContain('SameSite=Strict');
      expect(laxCookie).toContain('SameSite=Lax');
      expect(noneCookie).toContain('SameSite=None');
    });

    it('should properly encode cookie name and value', () => {
      const name = 'my cookie';
      const value = 'value with spaces';

      const cookieHeader = setCookie(name, value);

      expect(cookieHeader).toContain('my%20cookie=value%20with%20spaces');
    });

    it('should handle special characters in cookie value', () => {
      const name = 'test_cookie';
      const value = 'value=with;special,chars';

      const cookieHeader = setCookie(name, value);

      expect(cookieHeader).toContain(encodeURIComponent(value));
    });
  });

  describe('getCookie', () => {
    it('should extract cookie value from cookie string', () => {
      const cookieString = 'gta6_user_id=550e8400-e29b-41d4-a716-446655440000; session=xyz';
      const value = getCookie(cookieString, 'gta6_user_id');

      expect(value).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should return undefined if cookie not found', () => {
      const cookieString = 'session=xyz; other=abc';
      const value = getCookie(cookieString, 'gta6_user_id');

      expect(value).toBeUndefined();
    });

    it('should return undefined if cookie string is empty', () => {
      const value = getCookie('', 'gta6_user_id');

      expect(value).toBeUndefined();
    });

    it('should handle multiple cookies correctly', () => {
      const cookieString = 'cookie1=value1; cookie2=value2; cookie3=value3';

      expect(getCookie(cookieString, 'cookie1')).toBe('value1');
      expect(getCookie(cookieString, 'cookie2')).toBe('value2');
      expect(getCookie(cookieString, 'cookie3')).toBe('value3');
    });

    it('should decode URL-encoded cookie values', () => {
      const cookieString = 'test=value%20with%20spaces';
      const value = getCookie(cookieString, 'test');

      expect(value).toBe('value with spaces');
    });

    it('should handle cookies with extra whitespace', () => {
      const cookieString =
        '  gta6_user_id  =  550e8400-e29b-41d4-a716-446655440000  ;  session=xyz  ';
      const value = getCookie(cookieString, 'gta6_user_id');

      expect(value).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should handle cookie with empty value', () => {
      const cookieString = 'empty_cookie=; other=value';
      const value = getCookie(cookieString, 'empty_cookie');

      expect(value).toBe('');
    });

    it('should return undefined for partial cookie name matches', () => {
      const cookieString = 'gta6_user_id_extra=value; session=xyz';
      const value = getCookie(cookieString, 'gta6_user_id');

      expect(value).toBeUndefined();
    });
  });

  describe('Constants', () => {
    it('should export COOKIE_NAME constant', () => {
      expect(COOKIE_NAME).toBe('gta6_user_id');
    });

    it('should export COOKIE_MAX_AGE constant (2 years in seconds)', () => {
      expect(COOKIE_MAX_AGE).toBe(63072000);

      // Verify calculation: 2 years * 365 days/year * 24 hours/day * 60 min/hour * 60 sec/min
      // Using 365 days (not 365.25) per spec
      const twoYearsInSeconds = 2 * 365 * 24 * 60 * 60;
      expect(COOKIE_MAX_AGE).toBe(twoYearsInSeconds);
    });
  });

  describe('getDefaultCookieOptions', () => {
    it('should return default cookie options with correct security flags', () => {
      const options = getDefaultCookieOptions();

      expect(options.httpOnly).toBe(false); // JavaScript needs access
      expect(options.secure).toBe(true); // HTTPS only
      expect(options.sameSite).toBe('Strict'); // CSRF protection
      expect(options.maxAge).toBe(COOKIE_MAX_AGE); // 2 years
      expect(options.path).toBe('/'); // Site-wide
    });

    it('should match AC1 security requirements', () => {
      const options = getDefaultCookieOptions();

      // AC1: httpOnly: false (JavaScript needs access for submissions)
      expect(options.httpOnly).toBe(false);

      // AC1: secure: true (HTTPS only)
      expect(options.secure).toBe(true);

      // AC1: sameSite: 'Strict'
      expect(options.sameSite).toBe('Strict');

      // AC1: maxAge: 63072000 (2 years, FR65)
      expect(options.maxAge).toBe(63072000);

      // AC1: path: '/'
      expect(options.path).toBe('/');
    });
  });

  describe('Integration Tests', () => {
    it('should create a cookie with generated ID and validate it', () => {
      const cookieId = generateCookieID();
      const isValid = validateCookieID(cookieId);

      expect(isValid).toBe(true);
    });

    it('should create, set, and retrieve a cookie end-to-end', () => {
      const cookieId = generateCookieID();
      const cookieHeader = setCookie(COOKIE_NAME, cookieId, getDefaultCookieOptions());

      // Simulate cookie string from browser
      const simulatedCookieString = `${COOKIE_NAME}=${cookieId}`;
      const retrievedValue = getCookie(simulatedCookieString, COOKIE_NAME);

      expect(retrievedValue).toBe(cookieId);
      expect(validateCookieID(retrievedValue!)).toBe(true);
    });

    it('should handle full workflow: generate → validate → set → get → validate', () => {
      // Step 1: Generate cookie ID
      const cookieId = generateCookieID();
      expect(validateCookieID(cookieId)).toBe(true);

      // Step 2: Create Set-Cookie header
      const setCookieHeader = setCookie(COOKIE_NAME, cookieId, getDefaultCookieOptions());
      expect(setCookieHeader).toContain(cookieId);
      expect(setCookieHeader).toContain('Secure');
      expect(setCookieHeader).toContain('SameSite=Strict');

      // Step 3: Simulate browser sending cookie back
      const cookieString = `${COOKIE_NAME}=${cookieId}`;
      const retrievedId = getCookie(cookieString, COOKIE_NAME);
      expect(retrievedId).toBe(cookieId);

      // Step 4: Validate retrieved cookie ID
      expect(validateCookieID(retrievedId!)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long cookie string (1000+ cookies)', () => {
      const cookies = [];
      for (let i = 0; i < 1000; i++) {
        cookies.push(`cookie${i}=value${i}`);
      }
      cookies.push(`${COOKIE_NAME}=${generateCookieID()}`);

      const cookieString = cookies.join('; ');
      const value = getCookie(cookieString, COOKIE_NAME);

      expect(value).toBeDefined();
      expect(validateCookieID(value!)).toBe(true);
    });

    it('should handle cookie name that is a substring of another cookie', () => {
      const cookieString = 'gta6_user_id_backup=old-value; gta6_user_id=current-value';
      const value = getCookie(cookieString, 'gta6_user_id');

      expect(value).toBe('current-value');
    });

    it('should handle Unicode characters in cookie value (after encoding)', () => {
      const unicodeValue = 'hello-世界';
      const cookieHeader = setCookie('test', unicodeValue);

      expect(cookieHeader).toContain(encodeURIComponent(unicodeValue));
    });
  });
});
