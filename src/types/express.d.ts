// src/types/express.d.ts
import express from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
      };
    }
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export {};
