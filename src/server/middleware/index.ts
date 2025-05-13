// src/server/middleware/index.ts
import { isAuthenticated, isNotAuthenticated, cleanupSessions } from "./auth";
import room from "./room";
import { timeMiddleware } from "./time";

// Export individual middleware functions
export {
  isAuthenticated,
  isNotAuthenticated,
  cleanupSessions,
  room,
  timeMiddleware
};