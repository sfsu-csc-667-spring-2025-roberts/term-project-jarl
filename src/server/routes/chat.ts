import express from "express";
import { Request, Response } from "express";
import { ChatMessage } from "global";
import db from "../db/connection";

const router = express.Router();

// @ts-ignore
router.post("/global", async (req, res) => {
  const { message } = req.body;
  const io = req.app.get("io");
  const user = (req.session as any).user;

  if (!user || !message) {
    return res.status(400).send("Missing session or message");
  }

  const timestamp = Date.now();

  const broadcastMessage = {
    message,
    sender: user?.user_id,
    timestamp,
  };

  try {
    await db.query(
      `INSERT INTO messages (content, author, "isLobby", game_player_id, created_at)
       VALUES ($1, $2, true, NULL, to_timestamp($3 / 1000.0))`,
      [message, user?.user_id, timestamp],
    );

    console.log("Emitting message to all clients:", broadcastMessage);
    io.emit("chat-message:global", broadcastMessage);
    res.sendStatus(200);
  } catch (err) {
    console.error("Failed to save global message:", err);
    res.status(500).send("Database error");
  }
});

router.post("/:roomId", (request: Request, response: Response) => {
  const { message } = request.body;
  const id = request.params.roomId;
  const io = request.app.get("io");

  const broadcastMessage: ChatMessage = {
    message,
    // @ts-ignore
    sender: request.session.user.email,
    // @ts-ignore
    gravatar: request.session.user.gravatar,
    timestamp: Date.now(),
  };

  console.log({ broadcastMessage });

  io.emit(`chat-message:${id}`, broadcastMessage);

  response.status(200).send();
});

export default router;
