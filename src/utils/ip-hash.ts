/**
 * IP Address Hashing Utility Module
 *
 * Provides functions for privacy-preserving IP address hashing using
 * cryptographic hash functions (BLAKE2b or SHA-256 fallback).
 *
 * Privacy: Implements IP hashing before storage to comply with GDPR (NFR-S2).
 * Original IP addresses are NEVER stored or logged - only hashed values.
 *
 * Security: Uses salted hashing to prevent rainbow table attacks (FR80).
 * Salt is versioned (SALT_V1) to support future rotation (FR79).
 */

/**
 * IPv4 validation regex
 * Matches valid IPv4 addresses: 0.0.0.0 to 255.255.255.255
 */
const IPV4_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * IPv6 validation regex
 * Matches standard IPv6 addresses and compressed formats
 * Supports: full format, compressed (::), and IPv4-mapped IPv6
 */
const IPV6_REGEX =
  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

/**
 * IP Hash type alias (64-character hex string)
 * Result of BLAKE2b-256 or SHA-256 hashing
 * Exported for use in API endpoints and type definitions
 */
export type IPHash = string;

/**
 * Hash algorithm used for IP address hashing
 * BLAKE2b is preferred but may not be available in all environments
 */
export type HashAlgorithm = 'BLAKE2b-256' | 'SHA-256';

/**
 * Validate if a given string is a valid IP address (IPv4 or IPv6)
 *
 * Validation criteria:
 * - IPv4: Standard dotted decimal notation (0.0.0.0 to 255.255.255.255)
 * - IPv6: Standard and compressed formats
 *
 * @param {string} ip - The IP address to validate
 * @returns {boolean} True if valid IPv4 or IPv6, false otherwise
 *
 * @example
 * validateIPAddress("192.168.1.1"); // true (IPv4)
 * validateIPAddress("::1"); // true (IPv6 localhost)
 * validateIPAddress("invalid"); // false
 */
export function validateIPAddress(ip: string): boolean {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  // Remove whitespace
  const trimmed = ip.trim();

  // Check IPv4
  if (IPV4_REGEX.test(trimmed)) {
    return true;
  }

  // Check IPv6
  if (IPV6_REGEX.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Extract client IP address from Cloudflare request headers
 *
 * Cloudflare provides the real client IP in the CF-Connecting-IP header.
 * This header contains the actual IP address of the client, not the
 * Cloudflare proxy IP.
 *
 * Fallback order:
 * 1. CF-Connecting-IP (Cloudflare-specific, most reliable)
 * 2. X-Forwarded-For (first IP in comma-separated list)
 * 3. X-Real-IP (nginx/other proxies)
 * 4. Empty string if none found
 *
 * @param {Request} request - The HTTP request object
 * @returns {string} Client IP address or empty string if not found
 *
 * @example
 * const ip = extractClientIP(request);
 * // Returns: "203.0.113.1" (from CF-Connecting-IP header)
 */
export function extractClientIP(request: Request): string {
  // Cloudflare-specific header (most reliable)
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  // X-Forwarded-For header (may contain multiple IPs)
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    // Take first IP in comma-separated list (original client)
    const firstIP = xForwardedFor.split(',')[0];
    return firstIP.trim();
  }

  // X-Real-IP header (nginx/other proxies)
  const xRealIP = request.headers.get('X-Real-IP');
  if (xRealIP) {
    return xRealIP.trim();
  }

  // No IP found - return empty string
  return '';
}

/**
 * Hash an IP address using BLAKE2b-256 or SHA-256 (with salt)
 *
 * Uses Web Crypto API's crypto.subtle.digest() which provides:
 * - Cryptographically secure hashing
 * - Built-in browser/Workers API (no dependencies)
 * - BLAKE2b-256 preferred (faster, more secure than SHA-256)
 * - SHA-256 fallback if BLAKE2b unavailable
 *
 * Hashing process:
 * 1. Concatenate salt + IP address (salt prefix prevents rainbow tables)
 * 2. Hash with BLAKE2b-256 or SHA-256 (256-bit output)
 * 3. Convert to lowercase hexadecimal string (64 characters)
 *
 * Security properties:
 * - Deterministic: same IP + salt always produces same hash
 * - One-way: hash cannot be reversed to recover original IP
 * - Salted: prevents rainbow table attacks (FR80)
 * - 256-bit output: 2^128 collision resistance
 *
 * @param {string} ip - The IP address to hash (IPv4 or IPv6)
 * @param {string} salt - Cryptographic salt (from SALT_V1 env var)
 * @returns {Promise<IPHash>} 64-character lowercase hex string
 * @throws {Error} If salt is empty or IP is invalid format
 *
 * @example
 * const hash = await hashIP("192.168.1.1", process.env.SALT_V1);
 * // Returns: "a3bb189e8bf9388899912ace4e6543002f1a2b3c4d5e6f7890abcdef12345678"
 */
export async function hashIP(ip: string, salt: string): Promise<IPHash> {
  // Validate inputs
  if (!salt || salt.trim().length === 0) {
    throw new Error('Salt cannot be empty');
  }

  if (!validateIPAddress(ip)) {
    throw new Error(`Invalid IP address format: ${ip}`);
  }

  // Prepare data: salt + IP (salt prefix prevents rainbow tables)
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + ip);

  // Try BLAKE2b-256 first (preferred for speed and security)
  // Note: BLAKE2b may not be available in all Cloudflare Workers environments
  let hashBuffer: ArrayBuffer;
  try {
    hashBuffer = await crypto.subtle.digest('BLAKE2b-256', data);
  } catch (error) {
    // Fallback to SHA-256 if BLAKE2b unavailable
    // SHA-256 is universally supported in Web Crypto API
    hashBuffer = await crypto.subtle.digest('SHA-256', data);
  }

  // Convert ArrayBuffer to hex string (64 characters for 256-bit hash)
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Detect which hash algorithm is being used
 *
 * Helper function for testing and debugging to determine if BLAKE2b
 * is available or if SHA-256 fallback is being used.
 *
 * @returns {Promise<HashAlgorithm>} 'BLAKE2b-256' or 'SHA-256'
 *
 * @example
 * const algorithm = await detectHashAlgorithm();
 * console.log(`Using ${algorithm} for IP hashing`);
 */
export async function detectHashAlgorithm(): Promise<HashAlgorithm> {
  const encoder = new TextEncoder();
  const testData = encoder.encode('test');

  try {
    await crypto.subtle.digest('BLAKE2b-256', testData);
    return 'BLAKE2b-256';
  } catch {
    return 'SHA-256';
  }
}

/**
 * Hash and validate an IP address in one operation
 *
 * Convenience function combining extraction, validation, and hashing.
 * Useful for API endpoints that need to process IP addresses from requests.
 *
 * @param {Request} request - The HTTP request object
 * @param {string} salt - Cryptographic salt (from SALT_V1 env var)
 * @returns {Promise<IPHash>} 64-character lowercase hex string
 * @throws {Error} If IP cannot be extracted, is invalid, or salt is empty
 *
 * @example
 * const ipHash = await hashRequestIP(request, env.SALT_V1);
 * // Returns: "a3bb189e8bf9388899912ace4e6543002f1a2b3c4d5e6f7890abcdef12345678"
 */
export async function hashRequestIP(request: Request, salt: string): Promise<IPHash> {
  const ip = extractClientIP(request);

  if (!ip) {
    throw new Error('Could not extract IP address from request');
  }

  return hashIP(ip, salt);
}
