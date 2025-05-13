import type { Express } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

// Create session store
const store = new (connectPgSimple(session))({
  createTableIfMissing: true,
});

// Create session middleware
const sessionMiddleware = session({
  store,
  secret: process.env.SESSION_SECRET || "dev-secret-key",
  resave: true,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

// Function to configure session (for backward compatibility)
const configureSession = (app: Express) => {
  app.use(sessionMiddleware);
};

// Export using module.exports for CommonJS compatibility
module.exports = {
  sessionMiddleware,
  default: configureSession
};

// Also export for ES6 compatibility
export { sessionMiddleware };
export default configureSession;