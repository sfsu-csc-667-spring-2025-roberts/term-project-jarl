import express from "express";
import { Request, Response } from "express";
import { Game, GameState } from "../db";
import { Server } from "socket.io";
import db from "../db/connection";

const router = express.Router();

const DEPOSIT_TO_GAMEPLAYER_STACK = `UPDATE "gamePlayers" SET stack = $1 WHERE game_id = $2 AND user_id = $3`;
const DEPOSIT_FROM_USER_STACK = `UPDATE users SET funds = funds - $1 WHERE user_id = $2`;
const WITHDRAW_TO_USER_STACK = `UPDATE users SET funds = funds + $1 WHERE user_id = $2`;
const GET_PLAYER_STACK = `SELECT stack FROM "gamePlayers" WHERE game_id = $1 AND user_id = $2`;

router.post("/create", async (request: Request, response: Response) => {
  // @ts-ignore
  const { user_id: userId, email, gravatar } = request.session.user;
  const { gameName, gameId, gameMinPlayers, gameMaxPlayers, gamePassword } =
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
      await db.none(DEPOSIT_TO_GAMEPLAYER_STACK, [50, gameId, userId]);
      await db.none(DEPOSIT_FROM_USER_STACK, [50, userId]);

      const stack = await db.oneOrNone(GET_PLAYER_STACK, [gameId, userId]);

      console.log("stack: ", stack);

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

router.get("/:gameId", async (request: Request, response: Response) => {
  const { gameId } = request.params;

  const gameState = await db.oneOrNone(
    "SELECT pot FROM game_state WHERE game_id = $1",
    [gameId],
  );

  const gamePlayer = await db.oneOrNone(
    'SELECT is_in_hand, stack FROM "gamePlayers" WHERE game_id = $1 AND user_id = $2',
    [gameId, request.session.userId],
  );
  if (!gameState) {
    console.warn(`No game state found for game ID ${gameId}`);
  } else {
    console.log("pot", gameState.pot);
  }
  // console.log("pot", gameState.pot);

  // @ts-ignore
  const user = request.session.user;
  response.render("games", {
    gameId,
    user,
    pot: gameState ? gameState.pot : 0,
    isInHand: gamePlayer ? gamePlayer.is_in_hand : true,
    gameStarted: gameState ? true : false,
    stack: gamePlayer ? gamePlayer.stack : 0,
  });
});

router.post("/:gameId/leave", async (request: Request, response: Response) => {
  const { gameId } = request.params;
  // @ts-ignore
  const { user_id: userId } = request.session.user;
  const count = await Game.leaveGame(parseInt(gameId), userId);

  const stack = await db.oneOrNone(GET_PLAYER_STACK, [gameId, userId]);

  if (stack !== null && stack !== undefined) {
    await db.none(WITHDRAW_TO_USER_STACK, [stack, userId]);
  }
  await db.none(
    `DELETE FROM "gamePlayers" WHERE game_id = $1 AND user_id = $2`,
    [gameId, userId],
  );

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

  // TODO
  // shuffle deck, create each cardsHeld for each player from that shuffledCards array
  // create flop, turn, river arrays/variables to send to client maybe?
  // assign rotations and set the active player
  // broadcast state update with order of cards to client maybe

  const gameState = new GameState(db, 4);
  await gameState.createGameState(parseInt(gameId));
  console.log("started game: ", gameId);

  const shuffledCards = await Game.getShuffledCards();
  console.log("shuffled cards");
  console.log(shuffledCards);

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

  // rotationLogic(
  //   parseInt(gameId),
  //   parseInt(userId),
  //   parseInt(betAmount),
  //   request,
  //   response,
  // );

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
