import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import type { Express } from "express";
import type { Server as SocketIOServer } from "socket.io";

const pgSession = connectPgSimple(session);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sessionMiddleware = session({
  store: new pgSession({
    pool,
    tableName: "session",
  }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
});

const configureSession = (app: Express, io: SocketIOServer) => {
  app.use(sessionMiddleware); // Attach to HTTP routes
  io.engine.use(sessionMiddleware); // Attach to WebSocket engine
};

export default configureSession;
export { sessionMiddleware };
