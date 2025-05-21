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
      console.log(
        `User [${user.user_id}] disconnected: ${user.email} with session id ${id}`,
      );
    });
  });
};

export default configureSockets;
