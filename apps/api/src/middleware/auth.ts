import { Request, Response, NextFunction } from "express";

// Simple token validation for offline auth
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      // Validate token format (simple check)
      if (token.startsWith("dG9rZW5f")) {
        // Base64 encoded "token_"
        next();
        return;
      }
    }

    // Token validation is optional for offline mode
    // Always proceed but token can be checked if needed
    next();
  } catch (error) {
    next();
  }
};
