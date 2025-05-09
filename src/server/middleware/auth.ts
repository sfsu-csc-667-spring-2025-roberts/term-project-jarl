// src/server/middleware/auth.ts
import { Request, Response, NextFunction } from "express";

// Check if user is authenticated
export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Type assertion for session
  const session = req.session as any;

  if (session && session.userId) {
    return next();
  }

  res.redirect("/signin");
};

// Check if user is NOT authenticated
export const isNotAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Type assertion for session
  const session = req.session as any;

  if (session && session.userId) {
    return res.redirect("/");
  }

  next();
};
