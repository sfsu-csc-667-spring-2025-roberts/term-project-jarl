import express from "express";
import { Request, Response } from "express";
import { Game } from "../db";
import { Server } from "socket.io";
import db from "../db/connection";
import { rotationLogic } from "../db/games/gameLogic";

const router = express.Router();

router.post("/create", async (request: Request, response: Response) => {
  // @ts-ignore
  const { user_id: userId, email, gravatar } = request.session.user;
  const { gameName, gameMinPlayers, gameMaxPlayers, gamePassword } =
    request.body;

  try {
    const gameId = await Game.create(
      userId,
      gameName,
      gameMinPlayers,
      gameMaxPlayers,
      gamePassword,
    );
    if (gameId) {
      const io = request.app.get<Server>("io");
      const allGames = await Game.getAllGames();
      io.emit("game:getGames", {
        allGames,
      });
      response.redirect(`/games/${gameId}`);
    } else {
      response.status(500).send("error creating game here");
    }
  } catch (err) {
    console.error("error creating game: ", err);
    response.status(500).send("error creating game");
  }
});

router.post("/join", async (request: Request, response: Response) => {
  // @ts-ignore
  const { user_id: userId, email, gravatar } = request.session.user;
  const { gameId, joinGamePassword } = request.body;

  try {
    const playerCount = await Game.conditionalJoin(
      gameId,
      userId,
      joinGamePassword,
    );
    const io = request.app.get<Server>("io");
    io.on("connection", (socket) => {
      socket.emit(`game:${gameId}:player-joined`, {
        playerCount,
        userId,
        email,
        gravatar,
      });
    });
    response.redirect(`/games/${gameId}`);
  } catch (error) {
    console.error("error joining game: ", error);
    response.status(500).send("error joining game");
  }
});

router.get("/:gameId", (request: Request, response: Response) => {
  const { gameId } = request.params;
  // @ts-ignore
  const user = request.session.user;
  response.render("games", { gameId, user });
});

router.post("/:gameId/leave", async (request: Request, response: Response) => {
  const { gameId } = request.params;
  // @ts-ignore
  const { user_id: userId } = request.session.user;
  const count = await Game.leaveGame(parseInt(gameId), userId);
  const io = request.app.get<Server>("io");
  io.on("connection", (socket) => {
    socket.emit(`game:${gameId}:player-left`, {
      userId,
      gameId,
      count,
    });
  });
  response.redirect("/");
});

router.post("/:gameId/start", async (request: Request, response: Response) => {
  // @ts-ignore
  const { user_id: userId } = request.session.user;

  const { gameId } = request.params;
  const hostId = await Game.findHostId(parseInt(gameId));

  const io = request.app.get<Server>("io");

  if (hostId !== userId) {
    console.log("You are not the host. You cannot start the game;");
    // response.status(403).send("You are not the host. You cannot start the game.");
    io.emit(`game:${gameId}:start:error`, {
      message: "Only the host can start the game",
    });
    return;
  }

  io.emit(`game:${gameId}:start:success`, {
    message: "Game started successfully",
  });
  response.status(200).send("Game started successfully");
});

// create routes for betting (updating potSize in game and updating turn in game)
router.post("/:gameId/bet", async (request: Request, response: Response) => {
  const { gameId } = request.params;
  // @ts-ignore
  const { user_id: userId } = request.session.user;
  const { betAmount } = request.body;
  const currGame = await db.one(`SELECT * FROM games WHERE game_id = $1`, [
    gameId,
  ]);

  rotationLogic(
    parseInt(gameId),
    parseInt(userId),
    parseInt(betAmount),
    request,
    response,
  );

  response
    .status(200)
    .json({ message: `Bet of ${betAmount} placed successfully` });
});

router.post("/:gameId/fold", async (request: Request, response: Response) => {
  const { gameId } = request.params;
  // @ts-ignore
  const { user_id: userId } = request.session.user;
  const players = await db.many(
    `SELECT * FROM "gamePlayers" WHERE game_id = $1`,
    [gameId],
  );
  const currGame = await db.one(`SELECT * FROM games WHERE game_id = $1`, [
    gameId,
  ]);
  await db.none(
    `
    UPDATE "gamePlayers"
    SET isPlaying = false
    WHERE game_id = $1 AND user_id = $2
  `,
    [gameId, userId],
  );

  const io = request.app.get<Server>("io");
  io.on("connection", (socket) => {
    socket.emit(`game:${gameId}:fold`, {
      userId,
      gameId,
      nextPlayer: players[currGame.turn],
    });
  });
});

export default router;
