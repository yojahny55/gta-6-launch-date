/**
 * Validation Module Test Suite
 *
 * Comprehensive tests for all Zod schemas and validation functions.
 * Story 2.4: Input Validation and XSS Prevention
 *
 * Coverage target: 100% (per ADR-011 mandatory testing requirement)
 * Test patterns inspired by Story 2.3 date validation tests (74 tests, 100% coverage)
 */

import { describe, it, expect } from 'vitest';
import {
  DateSchema,
  UUIDSchema,
  UserAgentSchema,
  PredictionRequestSchema,
  sanitizeUserAgent,
  detectSQLInjection,
  detectXSS,
  validateUserAgent,
  MIN_DATE,
  MAX_DATE,
  DATE_REGEX,
  UUID_REGEX,
  MAX_USER_AGENT_LENGTH,
} from './validation';

describe('Validation Module - Constants', () => {
  it('should export MIN_DATE constant', () => {
    expect(MIN_DATE).toBe('2026-11-19');
  });

  it('should export MAX_DATE constant', () => {
    expect(MAX_DATE).toBe('2125-12-31');
  });

  it('should export DATE_REGEX pattern', () => {
    expect(DATE_REGEX).toBeInstanceOf(RegExp);
  });

  it('should export UUID_REGEX pattern', () => {
    expect(UUID_REGEX).toBeInstanceOf(RegExp);
  });

  it('should export MAX_USER_AGENT_LENGTH constant', () => {
    expect(MAX_USER_AGENT_LENGTH).toBe(256);
  });
});

describe('DateSchema - Valid Dates', () => {
  it('should accept valid ISO 8601 date in 2026 (min boundary)', () => {
    expect(() => DateSchema.parse('2026-11-19')).not.toThrow();
  });

  it('should accept valid ISO 8601 date in 2026', () => {
    expect(() => DateSchema.parse('2026-11-19')).not.toThrow();
  });

  it('should accept valid ISO 8601 date in 2027', () => {
    expect(() => DateSchema.parse('2027-02-14')).not.toThrow();
  });

  it('should accept max boundary date (2125-12-31)', () => {
    expect(() => DateSchema.parse('2125-12-31')).not.toThrow();
  });

  it('should accept min boundary date (2026-11-19)', () => {
    expect(() => DateSchema.parse('2026-11-19')).not.toThrow();
  });

  it('should accept leap year Feb 29 (2028)', () => {
    expect(() => DateSchema.parse('2028-02-29')).not.toThrow();
  });

  it('should accept leap year Feb 29 (2032)', () => {
    expect(() => DateSchema.parse('2032-02-29')).not.toThrow();
  });

  it('should accept valid dates in all months', () => {
    const validDates = [
      '2026-11-19', // Min boundary (official launch date)
      '2026-11-20',
      '2026-12-15',
      '2027-01-15',
      '2027-02-15',
      '2027-03-15',
      '2027-04-15',
      '2027-05-15',
      '2027-06-15',
      '2027-07-15',
      '2027-08-15',
      '2027-09-15',
    ];

    validDates.forEach((date) => {
      expect(() => DateSchema.parse(date)).not.toThrow();
    });
  });
});

describe('DateSchema - Invalid Format', () => {
  it('should reject US date format (MM/DD/YYYY)', () => {
    expect(() => DateSchema.parse('11/19/2026')).toThrow();
  });

  it('should reject European date format (DD.MM.YYYY)', () => {
    expect(() => DateSchema.parse('19.11.2026')).toThrow();
  });

  it('should reject date without leading zeros (2026-1-1)', () => {
    expect(() => DateSchema.parse('2026-1-1')).toThrow();
  });

  it('should reject date with wrong separator (2026/11/19)', () => {
    expect(() => DateSchema.parse('2026/11/19')).toThrow();
  });

  it('should reject empty string', () => {
    expect(() => DateSchema.parse('')).toThrow();
  });

  it('should reject non-date string', () => {
    expect(() => DateSchema.parse('invalid')).toThrow();
  });

  it('should reject date with time component', () => {
    expect(() => DateSchema.parse('2026-11-19T10:30:00Z')).toThrow();
  });
});

describe('DateSchema - Invalid Range', () => {
  it('should reject date before min (2026-11-18)', () => {
    expect(() => DateSchema.parse('2026-11-18')).toThrow();
  });

  it('should reject date after max (2126-01-01)', () => {
    expect(() => DateSchema.parse('2126-01-01')).toThrow();
  });

  it('should reject date in 2024', () => {
    expect(() => DateSchema.parse('2024-06-15')).toThrow();
  });

  it('should reject date in 2126', () => {
    expect(() => DateSchema.parse('2126-06-15')).toThrow();
  });

  it('should reject date far in past (2000-01-01)', () => {
    expect(() => DateSchema.parse('2000-01-01')).toThrow();
  });
});

describe('DateSchema - Invalid Calendar Dates', () => {
  it('should reject Feb 30 (invalid day)', () => {
    expect(() => DateSchema.parse('2026-02-30')).toThrow();
  });

  it('should reject Feb 29 in non-leap year (2025)', () => {
    expect(() => DateSchema.parse('2025-02-29')).toThrow();
  });

  it('should reject Feb 29 in non-leap year (2026)', () => {
    expect(() => DateSchema.parse('2026-02-29')).toThrow();
  });

  it('should reject Apr 31 (April has 30 days)', () => {
    expect(() => DateSchema.parse('2026-04-31')).toThrow();
  });

  it('should reject Jun 31 (June has 30 days)', () => {
    expect(() => DateSchema.parse('2026-06-31')).toThrow();
  });

  it('should reject Sep 31 (September has 30 days)', () => {
    expect(() => DateSchema.parse('2026-09-31')).toThrow();
  });

  it('should reject Nov 31 (November has 30 days)', () => {
    expect(() => DateSchema.parse('2026-11-31')).toThrow();
  });

  it('should reject month 13', () => {
    expect(() => DateSchema.parse('2026-13-01')).toThrow();
  });

  it('should reject month 00', () => {
    expect(() => DateSchema.parse('2026-00-01')).toThrow();
  });

  it('should reject day 00', () => {
    expect(() => DateSchema.parse('2026-01-00')).toThrow();
  });

  it('should reject day 32', () => {
    expect(() => DateSchema.parse('2026-01-32')).toThrow();
  });
});

describe('UUIDSchema - Valid UUIDs', () => {
  it('should accept valid UUID v4 (lowercase)', () => {
    expect(() => UUIDSchema.parse('550e8400-e29b-41d4-a716-446655440000')).not.toThrow();
  });

  it('should accept valid UUID v4 (uppercase)', () => {
    expect(() => UUIDSchema.parse('550E8400-E29B-41D4-A716-446655440000')).not.toThrow();
  });

  it('should accept valid UUID v4 (mixed case)', () => {
    expect(() => UUIDSchema.parse('550e8400-E29B-41d4-A716-446655440000')).not.toThrow();
  });

  it('should accept UUID v4 with variant 8', () => {
    expect(() => UUIDSchema.parse('a3bb189e-8bf9-4888-8912-ace4e6543002')).not.toThrow();
  });

  it('should accept UUID v4 with variant 9', () => {
    expect(() => UUIDSchema.parse('a3bb189e-8bf9-4888-9912-ace4e6543002')).not.toThrow();
  });

  it('should accept UUID v4 with variant a', () => {
    expect(() => UUIDSchema.parse('a3bb189e-8bf9-4888-a912-ace4e6543002')).not.toThrow();
  });

  it('should accept UUID v4 with variant b', () => {
    expect(() => UUIDSchema.parse('a3bb189e-8bf9-4888-b912-ace4e6543002')).not.toThrow();
  });

  it('should accept crypto.randomUUID() output', () => {
    const uuid = crypto.randomUUID();
    expect(() => UUIDSchema.parse(uuid)).not.toThrow();
  });
});

describe('UUIDSchema - Invalid UUIDs', () => {
  it('should reject UUID v1 format', () => {
    expect(() => UUIDSchema.parse('550e8400-e29b-11d4-a716-446655440000')).toThrow();
  });

  it('should reject UUID v3 format', () => {
    expect(() => UUIDSchema.parse('550e8400-e29b-31d4-a716-446655440000')).toThrow();
  });

  it('should reject UUID v5 format', () => {
    expect(() => UUIDSchema.parse('550e8400-e29b-51d4-a716-446655440000')).toThrow();
  });

  it('should reject UUID without dashes', () => {
    expect(() => UUIDSchema.parse('550e8400e29b41d4a716446655440000')).toThrow();
  });

  it('should reject UUID with wrong variant (c)', () => {
    expect(() => UUIDSchema.parse('550e8400-e29b-41d4-c716-446655440000')).toThrow();
  });

  it('should reject UUID with wrong variant (7)', () => {
    expect(() => UUIDSchema.parse('550e8400-e29b-41d4-7716-446655440000')).toThrow();
  });

  it('should reject empty string', () => {
    expect(() => UUIDSchema.parse('')).toThrow();
  });

  it('should reject non-UUID string', () => {
    expect(() => UUIDSchema.parse('invalid-uuid')).toThrow();
  });

  it('should reject UUID with extra characters', () => {
    expect(() => UUIDSchema.parse('550e8400-e29b-41d4-a716-446655440000-extra')).toThrow();
  });

  it('should reject UUID with missing segment', () => {
    expect(() => UUIDSchema.parse('550e8400-e29b-41d4-446655440000')).toThrow();
  });
});

describe('UserAgentSchema - Valid User Agents', () => {
  it('should accept typical browser user agent', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    expect(() => UserAgentSchema.parse(ua)).not.toThrow();
  });

  it('should accept Chrome user agent', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124';
    expect(() => UserAgentSchema.parse(ua)).not.toThrow();
  });

  it('should accept Firefox user agent', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
    expect(() => UserAgentSchema.parse(ua)).not.toThrow();
  });

  it('should accept Safari user agent', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15';
    expect(() => UserAgentSchema.parse(ua)).not.toThrow();
  });

  it('should accept mobile user agent', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15';
    expect(() => UserAgentSchema.parse(ua)).not.toThrow();
  });

  it('should accept short user agent', () => {
    expect(() => UserAgentSchema.parse('curl/7.68.0')).not.toThrow();
  });

  it('should accept user agent at max length (256 chars)', () => {
    const ua = 'x'.repeat(256);
    expect(() => UserAgentSchema.parse(ua)).not.toThrow();
  });
});

describe('UserAgentSchema - Invalid User Agents', () => {
  it('should reject user agent exceeding max length (257 chars)', () => {
    const ua = 'x'.repeat(257);
    expect(() => UserAgentSchema.parse(ua)).toThrow();
  });

  it('should reject very long user agent (500 chars)', () => {
    const ua = 'x'.repeat(500);
    expect(() => UserAgentSchema.parse(ua)).toThrow();
  });

  it('should reject user agent with 1000 chars', () => {
    const ua = 'x'.repeat(1000);
    expect(() => UserAgentSchema.parse(ua)).toThrow();
  });
});

describe('PredictionRequestSchema - Valid Requests', () => {
  it('should accept valid prediction request', () => {
    const request = {
      predicted_date: '2026-11-19',
      turnstile_token: '0x1aBcDeFg...',
    };
    expect(() => PredictionRequestSchema.parse(request)).not.toThrow();
  });

  it('should accept request with long Turnstile token', () => {
    const request = {
      predicted_date: '2026-11-19',
      turnstile_token: 'x'.repeat(1000),
    };
    expect(() => PredictionRequestSchema.parse(request)).not.toThrow();
  });

  it('should accept request with min date', () => {
    const request = {
      predicted_date: '2026-11-19',
      turnstile_token: 'token123',
    };
    expect(() => PredictionRequestSchema.parse(request)).not.toThrow();
  });

  it('should accept request with max date', () => {
    const request = {
      predicted_date: '2125-12-31',
      turnstile_token: 'token123',
    };
    expect(() => PredictionRequestSchema.parse(request)).not.toThrow();
  });
});

describe('PredictionRequestSchema - Invalid Requests', () => {
  it('should reject request with invalid date format', () => {
    const request = {
      predicted_date: '11/19/2026',
      turnstile_token: 'token123',
    };
    expect(() => PredictionRequestSchema.parse(request)).toThrow();
  });

  it('should reject request with date before min', () => {
    const request = {
      predicted_date: '2024-12-31',
      turnstile_token: 'token123',
    };
    expect(() => PredictionRequestSchema.parse(request)).toThrow();
  });

  it('should reject request with date after max', () => {
    const request = {
      predicted_date: '2126-01-01',
      turnstile_token: 'token123',
    };
    expect(() => PredictionRequestSchema.parse(request)).toThrow();
  });

  it('should reject request with empty Turnstile token', () => {
    const request = {
      predicted_date: '2026-11-19',
      turnstile_token: '',
    };
    expect(() => PredictionRequestSchema.parse(request)).toThrow();
  });

  it('should reject request with missing predicted_date', () => {
    const request = {
      turnstile_token: 'token123',
    };
    expect(() => PredictionRequestSchema.parse(request)).toThrow();
  });

  it('should reject request with missing turnstile_token', () => {
    const request = {
      predicted_date: '2026-11-19',
    };
    expect(() => PredictionRequestSchema.parse(request)).toThrow();
  });

  it('should reject empty request', () => {
    expect(() => PredictionRequestSchema.parse({})).toThrow();
  });
});

describe('sanitizeUserAgent - XSS Prevention', () => {
  it('should sanitize script tags', () => {
    const result = sanitizeUserAgent('<script>alert(1)</script>');
    expect(result).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('should sanitize img tag with onerror', () => {
    const result = sanitizeUserAgent('<img src=x onerror=alert(1)>');
    expect(result).toBe('&lt;img src=x onerror=alert(1)&gt;');
    expect(result).not.toContain('<img');
  });

  it('should sanitize ampersand', () => {
    const result = sanitizeUserAgent('Mozilla & Chrome');
    expect(result).toBe('Mozilla &amp; Chrome');
  });

  it('should sanitize less than and greater than', () => {
    const result = sanitizeUserAgent('value < 10 > 5');
    expect(result).toBe('value &lt; 10 &gt; 5');
  });

  it('should sanitize double quotes', () => {
    const result = sanitizeUserAgent('Mozilla "5.0"');
    expect(result).toBe('Mozilla &quot;5.0&quot;');
  });

  it('should sanitize single quotes', () => {
    const result = sanitizeUserAgent("Mozilla '5.0'");
    expect(result).toBe('Mozilla &#x27;5.0&#x27;');
  });

  it('should sanitize all special characters together', () => {
    const result = sanitizeUserAgent('<script>"alert(\'XSS\')"</script> & more');
    expect(result).toBe(
      '&lt;script&gt;&quot;alert(&#x27;XSS&#x27;)&quot;&lt;/script&gt; &amp; more'
    );
  });

  it('should return empty string for empty input', () => {
    expect(sanitizeUserAgent('')).toBe('');
  });

  it('should return empty string for null input', () => {
    expect(sanitizeUserAgent(null as any)).toBe('');
  });

  it('should return empty string for undefined input', () => {
    expect(sanitizeUserAgent(undefined as any)).toBe('');
  });

  it('should not modify safe user agent', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0';
    const result = sanitizeUserAgent(ua);
    expect(result).toBe(ua);
  });
});

describe('detectSQLInjection - SQL Injection Detection', () => {
  it('should detect UNION SELECT attack', () => {
    expect(detectSQLInjection('1 UNION SELECT * FROM users')).toBe(true);
  });

  it('should detect DROP TABLE attack', () => {
    expect(detectSQLInjection("'; DROP TABLE users; --")).toBe(true);
  });

  it('should detect DROP DATABASE attack', () => {
    expect(detectSQLInjection('DROP DATABASE production')).toBe(true);
  });

  it('should detect DELETE FROM attack', () => {
    expect(detectSQLInjection('DELETE FROM users WHERE 1=1')).toBe(true);
  });

  it('should detect INSERT INTO attack', () => {
    expect(detectSQLInjection('INSERT INTO admins VALUES (1, "hacker")')).toBe(true);
  });

  it('should detect UPDATE SET attack', () => {
    expect(detectSQLInjection('UPDATE users SET admin=1')).toBe(true);
  });

  it('should detect SQL comment (--)', () => {
    expect(detectSQLInjection("admin'--")).toBe(true);
  });

  it('should detect SQL comment (/* */)', () => {
    expect(detectSQLInjection('admin/**/password')).toBe(true);
  });

  it('should detect OR 1=1 pattern', () => {
    expect(detectSQLInjection("' OR 1=1 --")).toBe(true);
  });

  it('should detect OR clause with equals', () => {
    expect(detectSQLInjection('OR a=a')).toBe(true);
  });

  it('should detect EXEC command', () => {
    expect(detectSQLInjection('EXEC xp_cmdshell')).toBe(true);
  });

  it('should detect EXECUTE command', () => {
    expect(detectSQLInjection('EXECUTE sp_executesql')).toBe(true);
  });

  it('should NOT detect safe user agent (Mozilla)', () => {
    expect(detectSQLInjection('Mozilla/5.0 (Windows NT 10.0)')).toBe(false);
  });

  it('should NOT detect safe user agent (Chrome)', () => {
    expect(detectSQLInjection('Chrome/91.0.4472.124')).toBe(false);
  });

  it('should NOT detect safe text', () => {
    expect(detectSQLInjection('Hello World')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(detectSQLInjection('')).toBe(false);
  });

  it('should return false for null input', () => {
    expect(detectSQLInjection(null as any)).toBe(false);
  });

  it('should return false for undefined input', () => {
    expect(detectSQLInjection(undefined as any)).toBe(false);
  });
});

describe('detectXSS - XSS Detection', () => {
  it('should detect script tag', () => {
    expect(detectXSS('<script>alert(1)</script>')).toBe(true);
  });

  it('should detect script tag with attributes', () => {
    expect(detectXSS('<script src="evil.js"></script>')).toBe(true);
  });

  it('should detect img tag with onerror', () => {
    expect(detectXSS('<img src=x onerror=alert(1)>')).toBe(true);
  });

  it('should detect img tag with onerror (uppercase)', () => {
    expect(detectXSS('<img src=x ONERROR=alert(1)>')).toBe(true);
  });

  it('should detect iframe tag', () => {
    expect(detectXSS('<iframe src="evil.com"></iframe>')).toBe(true);
  });

  it('should detect object tag', () => {
    expect(detectXSS('<object data="evil.swf"></object>')).toBe(true);
  });

  it('should detect embed tag', () => {
    expect(detectXSS('<embed src="evil.swf">')).toBe(true);
  });

  it('should detect onclick event handler', () => {
    expect(detectXSS('<div onclick=alert(1)>Click me</div>')).toBe(true);
  });

  it('should detect onload event handler', () => {
    expect(detectXSS('<body onload=alert(1)>')).toBe(true);
  });

  it('should detect onmouseover event handler', () => {
    expect(detectXSS('<div onmouseover=alert(1)>Hover</div>')).toBe(true);
  });

  it('should detect onkeydown event handler', () => {
    expect(detectXSS('<input onkeydown=alert(1)>')).toBe(true);
  });

  it('should detect javascript: protocol', () => {
    expect(detectXSS('<a href="javascript:alert(1)">Click</a>')).toBe(true);
  });

  it('should detect data: protocol with base64', () => {
    expect(detectXSS('<img src="data:text/html;base64,PHNjcmlwdD4=">')).toBe(true);
  });

  it('should NOT detect safe user agent (Mozilla)', () => {
    expect(detectXSS('Mozilla/5.0 (Windows NT 10.0)')).toBe(false);
  });

  it('should NOT detect safe user agent (Chrome)', () => {
    expect(detectXSS('Chrome/91.0.4472.124')).toBe(false);
  });

  it('should NOT detect safe text', () => {
    expect(detectXSS('Hello World')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(detectXSS('')).toBe(false);
  });

  it('should return false for null input', () => {
    expect(detectXSS(null as any)).toBe(false);
  });

  it('should return false for undefined input', () => {
    expect(detectXSS(undefined as any)).toBe(false);
  });
});

describe('validateUserAgent - Comprehensive Validation', () => {
  it('should validate safe user agent', () => {
    const result = validateUserAgent('Mozilla/5.0 (Windows NT 10.0)');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Mozilla/5.0 (Windows NT 10.0)');
    expect(result.error).toBeUndefined();
  });

  it('should validate and sanitize user agent with special chars', () => {
    const result = validateUserAgent('Mozilla "5.0"');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Mozilla &quot;5.0&quot;');
  });

  it('should reject user agent exceeding max length', () => {
    const result = validateUserAgent('x'.repeat(257));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('256 characters');
  });

  it('should reject user agent with SQL injection', () => {
    const result = validateUserAgent("'; DROP TABLE users; --");
    expect(result.valid).toBe(false);
    expect(result.error).toContain('SQL injection');
  });

  it('should reject user agent with XSS payload', () => {
    const result = validateUserAgent('<script>alert(1)</script>');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('XSS');
  });

  it('should reject user agent with UNION SELECT', () => {
    const result = validateUserAgent('1 UNION SELECT password FROM users');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('SQL injection');
  });

  it('should reject user agent with javascript: protocol', () => {
    const result = validateUserAgent('javascript:alert(1)');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('XSS');
  });

  it('should validate typical Chrome user agent', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    const result = validateUserAgent(ua);
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(ua);
  });

  it('should validate typical Firefox user agent', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
    const result = validateUserAgent(ua);
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(ua);
  });

  it('should validate typical Safari user agent', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15';
    const result = validateUserAgent(ua);
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(ua);
  });
});
