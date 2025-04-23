// src/server/index.ts with timeouts and debug logging
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}
import express from "express";
import session from "express-session";
import path from "path";
import dotenv from "dotenv";

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
  const PORT = process.env.PORT || 3000;

  console.log("Setting up basic middleware...");
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, "../../public")));

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
