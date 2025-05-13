// src/server/middleware/time.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to log request timestamp
 */
export const timeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`Request made at ${timestamp}`);
  next();
};

// For backward compatibility
export const setupTimeMiddleware = (app: any) => {
  app.use(timeMiddleware);
  return timeMiddleware;
};