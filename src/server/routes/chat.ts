import express from "express";
import { Request, Response } from "express";
import { ChatMessage } from "../types/express-session";

const router = express.Router();

router.post("/:roomId", (request: Request, response: Response) => {
  const { message } = request.body;
  const id = request.params.roomId;
  const io = request.app.get("io");

  const broadcastMessage: ChatMessage = {
    message,
    sender: (request.session as any).user?.email || "Anonymous",
    gravatar: (request.session as any).user?.gravatar,
    timestamp: Date.now(),
  };

  console.log({ broadcastMessage });

  io.emit(`chat-message:${id}`, broadcastMessage);

  response.status(200).send();
});

export default router;
