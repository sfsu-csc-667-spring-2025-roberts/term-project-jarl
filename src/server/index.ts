import * as path from "path";
import * as http from "http";
import express, { Request, Response } from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

// ✅ Fix for TypeScript req.session.userId
declare module "express-session" {
  interface SessionData {
    userId?: number;
    email?: string;
    user?: any;
  }
}

// --- App Imports ---
import * as config from "./config";
import * as routes from "./routes";
import * as middleware from "./middleware";
import rootRoutes from "./routes/root";
import testRouter from "./routes/test";
import configureSockets from "./config/sockets";
import { setupFriendSocket } from "./socket/friends";

// --- App & Server ---
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- Middleware ---
config.liveReload(app);
config.session(app);
config.sockets(io, app); // can be optional if setupFriendSocket + configureSockets cover it
configureSockets(io, app);
setupFriendSocket(io);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "public")));
app.use(morgan("dev"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  }),
);

// --- View Engine ---
app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "ejs");

// --- Routes ---
app.get("/healthcheck", (_req: Request, res: Response) => {
  res.send("Server is running");
});

app.use("/", rootRoutes);
app.use("/test", testRouter);
app.use("/auth", routes.auth);
app.use("/chat", middleware.auth, routes.chat);
app.use("/lobby", middleware.auth, routes.lobby);
app.use("/friends", middleware.auth, routes.friends);
app.use("/games", require("./routes/games").default);

// --- Error Handling ---
import httpErrors from "http-errors";
app.use((_req, _res, next) => next(httpErrors(404)));

// --- Server Start ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
