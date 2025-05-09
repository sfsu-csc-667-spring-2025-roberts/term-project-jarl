// File: src/server/index.ts
import express from "express";
import http from "http";
import path from "path";
import session from "express-session";
import morgan from "morgan";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { timeMiddleware } from "./middleware/time";
import db from "./db/connection";

// Import routes directly to avoid issues with module exports
import rootRouter from "./routes/root";
import testRouter from "./routes/test";
import authRouter from "./routes/auth";
import gamesRouter from "./routes/games";
import lobbyRouter from "./routes/lobby";
import chatRouter from "./routes/chat";
import friendsRouter from "./routes/friends";

// Load environment variables
dotenv.config();
console.log("Loading environment variables...");

// Create Express app
const app = express();
console.log("Creating Express app...");

// Create HTTP server
const server = http.createServer(app);

// Basic middleware
console.log("Setting up basic middleware...");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../../public")));
app.use(morgan("dev"));

// Session middleware
console.log("Setting up session middleware...");
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "my-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  },
});
app.use(sessionMiddleware);

// View engine setup
console.log("Setting up view engine...");
app.set("views", path.join(__dirname, "../../views"));
app.set("view engine", "ejs");

// Time middleware
console.log("Loading time middleware...");
app.use(timeMiddleware);
console.log("Time middleware loaded successfully");

// Test PostgreSQL database connection
db.connect()
  .then((obj) => {
    console.log("Connected to PostgreSQL database");
    obj.done(); // release the connection
  })
  .catch((error) => {
    console.error("PostgreSQL connection error:", error);
  });

// Routes
console.log("Setting up routes...");
app.use("/", rootRouter);
app.use("/test", testRouter);
app.use("/auth", authRouter);
app.use("/games", gamesRouter);
app.use("/lobby", lobbyRouter);
app.use("/chat", chatRouter);
app.use("/friends", friendsRouter);

// Setup Socket.IO
console.log("Setting up Socket.IO...");
const io = new Server(server);

// Add socket event handlers
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join a game room
  socket.on("join-game", (gameId) => {
    socket.join(`game-${gameId}`);
    console.log(`Socket ${socket.id} joined game room: ${gameId}`);
  });

  // Leave a game room
  socket.on("leave-game", (gameId) => {
    socket.leave(`game-${gameId}`);
    console.log(`Socket ${socket.id} left game room: ${gameId}`);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set("io", io);

// Start server
const PORT = process.env.PORT || 3000;
console.log("Starting server...");

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
