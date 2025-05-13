// src/server/types/express-session.d.ts
import 'express-session';

export interface ChatMessage {
  id: number;
  sender_id: number;
  sender_username: string;
  game_id: string | number;
  message: string;
  created_at: Date;
}

declare module 'express-session' {
  interface SessionData {
    user: {
      id: number;
      username: string;
      email: string;
      balance?: number; // Added balance property
    };
    userId?: number;
    authenticated: boolean;
    messages?: ChatMessage[];
  }
}