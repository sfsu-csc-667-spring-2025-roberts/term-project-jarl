// src/server/routes/games.ts
import express from "express";
import { Request, Response } from "express";
import { Server } from "socket.io";
import { Game } from "../db";
import db from "../db/connection";

const router = express.Router();

// --- Create game route ---
router.post("/create", async (req: Request, res: Response) => {
  // @ts-ignore
  const { user_id: userId, email, gravatar } = req.session.user;
  const { gameName, gameMinPlayers, gameMaxPlayers, gamePassword } = req.body;

  try {
    const gameId = await Game.create(
      userId,
      gameName,
      gameMinPlayers,
      gameMaxPlayers,
      gamePassword,
    );

    const io = req.app.get<Server>("io");
    io.emit("game:created", {
      gameId,
      gameName: gameName ?? `Game ${gameId}`,
      gameMinPlayers,
      gameMaxPlayers,
      hasPassword: !!gamePassword,
      host: { user_id: userId, email, gravatar },
    });

    res.redirect(`/games/${gameId}`);
  } catch (err) {
    console.error("error creating game:", err);
    res.status(500).send("Error creating game");
  }
});

// --- Join game route ---
router.post("/join", async (req: Request, res: Response) => {
  // @ts-ignore
  const { user_id: userId, email, gravatar } = req.session.user;
  const { gameId, gamePassword } = req.body;

  try {
    const playerCount = await Game.conditionalJoin(
      gameId,
      userId,
      gamePassword,
    );
    const io = req.app.get<Server>("io");
    io.emit(`game:${gameId}:player-joined`, {
      playerCount,
      userId,
      email,
      gravatar,
    });

    res.redirect(`/games/${gameId}`);
  } catch (error) {
    console.error("error joining game:", error);
    res.status(500).send("Error joining game");
  }
});

// --- View game page ---
router.get("/:gameId", (req: Request, res: Response) => {
  const { gameId } = req.params;
  // @ts-ignore
  const user = req.session.user;
  res.render("games", { gameId, user });
});

// --- Start game ---
router.post("/:id/start", async (req: Request, res: Response) => {
  const gameId = parseInt(req.params.id);

  try {
    // ✅ FINAL FIX: Use correct column name "id"
    await db.none("UPDATE games SET state = 'started' WHERE id = $1", [gameId]);

    const io = req.app.get<Server>("io");
    io.emit(`game:${gameId}:started`, { gameId });

    res.status(200).json({ message: "Game started successfully." });
  } catch (error) {
    console.error("Failed to start game:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
