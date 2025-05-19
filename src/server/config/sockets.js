"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const session_1 = require("./session");
const configureSockets = (io, app) => {
  app.set("io", io);
  io.engine.use(session_1.sessionMiddleware);
  io.on("connection", (socket) => {
    // @ts-ignore
    const { id, user } = socket.request.session;
    console.log(
      `User [${user.id}] connected: ${user.email} with session id ${id}`,
    );
    socket.join(user.id);
    // Join game room for real-time updates
    socket.on("join-game", (gameId) => {
      const room = `game:${gameId}`;
      socket.join(room);
      console.log(`User [${user.id}] joined room: ${room}`);
    });
    socket.on("disconnect", () => {
      console.log(
        `User [${user.id}] disconnected: ${user.email} with session id ${id}`,
      );
    });
  });
};
exports.default = configureSockets;
