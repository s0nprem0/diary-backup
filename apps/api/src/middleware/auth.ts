import { Request, Response, NextFunction } from "express";

/**
 * Auth Middleware - Validates Bearer tokens
 *
 * For offline mode, this is a simple validation.
 * In production with a real backend, implement JWT verification
 * with proper key management and token rotation.
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Token is optional for offline mode, but if provided, validate it
      next();
      return;
    }

    const token = authHeader.substring(7);

    // Validate token format
    // In production, verify JWT signature and claims here
    if (isValidTokenFormat(token)) {
      // Token is valid, add to request for potential use
      (req as any).token = token;
      next();
      return;
    }

    // Invalid token format - reject
    console.warn("Invalid token format received");
    res.status(401).json({ error: "Invalid token format" });
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Authentication error" });
  }
};

/**
 * Validate token format
 * In production, this should verify JWT signature and claims
 */
function isValidTokenFormat(token: string): boolean {
  // Check if token looks like a JWT (three parts separated by dots)
  const parts = token.split(".");

  // Basic JWT format check (header.payload.signature)
  if (parts.length !== 3) {
    return false;
  }

  // Check if parts are valid base64
  try {
    for (const part of parts) {
      // Add padding if needed
      const padded = part + "=".repeat((4 - (part.length % 4)) % 4);
      Buffer.from(padded, "base64").toString("utf-8");
    }
    return true;
  } catch {
    return false;
  }
}
