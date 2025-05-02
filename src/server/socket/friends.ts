import { Server, Socket } from "socket.io";

export const setupFriendSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
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
