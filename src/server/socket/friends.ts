// src/server/socket/friends.ts
import { Server } from "socket.io";

export const setupFriendSocket = (io: Server) => {
  const friendNamespace = io.of("/friends");

  friendNamespace.on("connection", (socket) => {
    console.log("Client connected to friends namespace:", socket.id);

    // Handle friend request events
    socket.on("friend-request", (data) => {
      // Broadcast to the recipient
      socket.broadcast
        .to(`user-${data.recipientId}`)
        .emit("new-friend-request", {
          senderId: data.senderId,
          senderName: data.senderName,
        });
    });

    // Handle friend request acceptance
    socket.on("friend-accept", (data) => {
      // Broadcast to the sender
      socket.broadcast
        .to(`user-${data.senderId}`)
        .emit("friend-request-accepted", {
          recipientId: data.recipientId,
          recipientName: data.recipientName,
        });
    });

    // Handle user joining their own room for private messages
    socket.on("join-user-room", (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their personal room`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Client disconnected from friends namespace:", socket.id);
    });
  });
};
