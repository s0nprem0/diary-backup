/**
 * Token Service - Handles JWT token generation and validation
 * Uses simple JWT encoding/decoding. In production, use a proper library.
 */

interface JwtPayload {
  sub?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

/**
 * Simple JWT encoding (for development/testing)
 * In production, use 'jsonwebtoken' library with proper signing
 */
export async function jwtEncode(
  payload: JwtPayload,
  secret: string
): Promise<string> {
  // Add issued-at time if not provided
  if (!payload.iat) {
    payload.iat = Math.floor(Date.now() / 1000);
  }

  // Add expiration (24 hours from now)
  if (!payload.exp) {
    payload.exp = Math.floor(Date.now() / 1000) + 86400;
  }

  const header = { alg: 'HS256', typ: 'JWT' };
  const headerEncoded = btoa(JSON.stringify(header));
  const payloadEncoded = btoa(JSON.stringify(payload));

  // Note: This is NOT cryptographically signed. For production use jsonwebtoken library.
  // This is a placeholder that structure-wise looks like JWT
  const signature = btoa(`${headerEncoded}.${payloadEncoded}.${secret}`).slice(0, 43);

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

/**
 * Simple JWT decoding (for development/testing)
 */
export function jwtDecode(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    return payload as JwtPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = jwtDecode(token);
  if (!decoded || !decoded.exp) {
    return true; // Consider invalid/malformed tokens as expired
  }

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp <= now;
}

/**
 * Validate token structure and expiration
 */
export function isValidToken(token: string | null): boolean {
  if (!token) {
    return false;
  }

  const decoded = jwtDecode(token);
  if (!decoded) {
    return false;
  }

  return !isTokenExpired(token);
}
