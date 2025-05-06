// src/server/types/express-session.d.ts
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: number | string;
    user?: any;
  }
}

export interface ChatMessage {
  message: string;
  sender: string;
  gravatar?: string;
  timestamp: number;
}