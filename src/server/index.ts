import * as path from "path";
import * as http from "http";

import express from "express";
import httpErrors from "http-errors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";

import dotenv from "dotenv";
dotenv.config();

import * as config from "./config";
import * as routes from "./routes";
import * as middleware from "./middleware";
import rootRoutes from "./routes/root";
import testRouter from "./routes/test";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(middleware.room);
config.liveReload(app);
config.session(app);
config.sockets(io, app);

// src/server/index.ts with timeouts and debug logging
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}
import session from "express-session";

// Add a timeout to force exit if server hangs
console.log("Starting server with safety timeout...");
const safetyTimeout = setTimeout(() => {
  console.error("Server startup timed out after 10 seconds - forcing exit");
  process.exit(1);
}, 10000);

try {
  console.log("Loading environment variables...");
  dotenv.config();

  console.log("Creating Express app...");
  const app = express();
  const PORT = process.env.PORT;

  console.log("Setting up basic middleware...");
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, "../../public")));
  app.use(morgan("dev"));
  console.log("Setting up session middleware...");
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  );

  console.log("Setting up view engine...");
  app.set("views", path.join(__dirname, "../../views"));
  app.set("view engine", "ejs");

  console.log("Loading time middleware...");
  try {
    const { timeMiddleware } = require("./middleware/time");
    app.use(timeMiddleware);
    console.log("Time middleware loaded successfully");
  } catch (err) {
    console.error("Failed to load time middleware:", err);
  }

  console.log("Setting up basic routes...");
  app.get("/healthcheck", (req, res) => {
    res.send("Server is running!");
  });

  console.log("About to load root router...");
  try {
    const rootRouter = require("./routes/root").default;
    app.use("/", rootRouter);
    console.log("Root router loaded successfully");
  } catch (err) {
    console.error("Failed to load root router:", err);
  }

  console.log("About to load test router...");
  try {
    const testRouter = require("./routes/test").default;
    app.use("/test", testRouter);
    console.log("Test router loaded successfully");
  } catch (err) {
    console.error("Failed to load test router:", err);
  }

  console.log("About to load auth router...");
  try {
    const authRouter = require("./routes/auth").default;
    app.use("/auth", authRouter);
    console.log("Auth router loaded successfully");
  } catch (err) {
    console.error("Failed to load auth router:", err);
  }

  // Start the server
  console.log("Starting server...");
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    clearTimeout(safetyTimeout); // Clear the safety timeout once server starts
  });

  // Add a timeout for the server to start
  server.setTimeout(5000);
} catch (error) {
  console.error("Error during server startup:", error);
  process.exit(1);
}

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(process.cwd(), "public")));
app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "ejs");

app.use("/", rootRoutes);
app.use("/test", testRouter);
app.use("/auth", routes.auth);
app.use("/chat", middleware.auth, routes.chat);
app.use("/lobby", middleware.auth, routes.lobby);
app.use("/friends", middleware.auth, routes.friends);

app.use((_request, _response, next) => {
  next(httpErrors(404));
});
