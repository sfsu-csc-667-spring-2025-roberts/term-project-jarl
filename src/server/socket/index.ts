// src/server/socket/index.ts
import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { setupFriendSocket } from "./friends";

const setupSocketServer = (server: HttpServer): SocketServer => {
  const io = new SocketServer(server);

  // Handle connection
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

  // Setup friend socket functionality
  setupFriendSocket(io);

  return io;
};

export default setupSocketServer;
