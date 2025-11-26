/**
 * Security Headers Middleware
 *
 * Adds Content Security Policy (CSP) and other security headers
 * to protect against XSS, clickjacking, and other attacks.
 *
 * Added as part of Story 3.5 code review follow-up.
 */

import { MiddlewareHandler } from 'hono';

/**
 * Security headers middleware
 * Adds CSP and other security headers to all responses
 */
export const securityHeadersMiddleware: MiddlewareHandler = async (c, next) => {
  await next();

  // Content Security Policy (CSP) - Story 3.5 Follow-up
  // Protects against XSS by restricting resource loading
  const csp = [
    "default-src 'self'",
    "script-src 'self' https://challenges.cloudflare.com", // Allow Turnstile
    "style-src 'self' 'unsafe-inline'", // Tailwind requires inline styles
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    'frame-src https://challenges.cloudflare.com', // Allow Turnstile iframe
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'", // Prevent clickjacking
  ].join('; ');

  c.header('Content-Security-Policy', csp);

  // Additional security headers
  c.header('X-Content-Type-Options', 'nosniff'); // Prevent MIME sniffing
  c.header('X-Frame-Options', 'DENY'); // Prevent clickjacking (redundant with CSP frame-ancestors)
  c.header('X-XSS-Protection', '1; mode=block'); // Legacy XSS protection
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin'); // Control referrer information
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()'); // Disable unnecessary features
};
