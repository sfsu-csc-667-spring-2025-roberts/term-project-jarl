import type { Express } from "express";
import type { Server, Socket } from "socket.io";
import { sessionMiddleware } from "./session";
import db from "../db/connection";

const sendOneCardToClient = async (socket: Socket) => {
  try {
    const result = await db.one(
      "SELECT * FROM cards ORDER BY RANDOM() LIMIT 1",
    );
    socket.emit("dealCard", result);
    console.log("Sent card to client:", result);
  } catch (err) {
    console.error("Error sending card:", err);
  }
};

const configureSockets = (io: Server, app: Express) => {
  app.set("io", io);

  io.engine.use(sessionMiddleware);

  io.on("connection", (socket) => {
    // @ts-ignore
    const { id, user, game_id } = socket.request.session;

    if (!user) {
      console.warn("Socket connected without user in session");
      socket.disconnect();
      return;
    }

    console.log(
      `User [${user.user_id}] connected: ${user.email} with session id ${id}`,
    );
    socket.join(user.id);

    socket.on("join-room", async (roomId: string) => {
      socket.join(roomId);

      // Send current players in this room
      try {
        const players = await db.manyOrNone(
          `SELECT users.email
        FROM "gamePlayers"
        JOIN users ON users.user_id = "gamePlayers".user_id
        WHERE game_id = $1`,
          [parseInt(roomId)],
        );

        const emails = players.map((p) => p.email);
        socket.emit(`game:${roomId}:players`, emails);
      } catch (err) {
        console.error("Error loading players for room:", err);
      }
    });

    socket.on("player-joined", ({ roomId, email }) => {
      socket.join(roomId);

      const room = io.sockets.adapter.rooms.get(roomId);
      const playerCount = room ? room.size : 1;

      // Notify everyone in the room a new player joined
      io.to(roomId).emit(`game:${roomId.split("-")[1]}:player-joined`, {
        playerCount,
        email,
      });
    });

    // testing purposes
    // sendOneCardToClient(socket);

    socket.on("gameChatMessage", async (message: string) => {
      try {
        await db.none(
          `
            INSERT INTO messages (content, author, game_player_id, "isLobby")
            VALUES (
              $1,
              $2,
              (
                SELECT game_player_id
                FROM "gamePlayers"
                WHERE user_id = $2 AND game_id = $3
              ),
              false
            )
          `,
          [message, user.user_id, game_id],
        );

        const userResult = await db.one(
          "SELECT username FROM users WHERE user_id = $1",
          [user.user_id],
        );

        io.emit("gameChatMessage", {
          user: userResult.username,
          content: message,
        });
      } catch (err) {
        console.error("Error handling game chat message:", err);
      }
    });

    socket.on("disconnect", () => {
      if (user) {
        console.log(
          `User [${user.user_id}] disconnected: ${user.email} with session id ${id}`,
        );

        // Let everyone in the room know the player left
        const rooms = Array.from(socket.rooms).filter(
          (room) => room !== socket.id,
        );
        for (const roomId of rooms) {
          io.to(roomId).emit(`game:${roomId}:player-left`, {
            email: user.email,
          });
        }
      }
    });
  });
};

export default configureSockets;
