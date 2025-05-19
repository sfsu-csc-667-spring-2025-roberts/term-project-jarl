"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupFriendSocket = void 0;
const setupFriendSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on("friend:request", (data) => {
      const { userId, friendId } = data;
      io.to(friendId).emit("friend:request", {
        message: `Friend request from user ${userId} to user ${friendId}`,
        userId,
        friendId,
      });
    });
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
exports.setupFriendSocket = setupFriendSocket;
