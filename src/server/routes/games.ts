import express from "express";
import { Request, Response } from "express";
import { Game, GameState } from "../db";
import { Server } from "socket.io";
import db from "../db/connection";
import { socket } from "../../client/socket";

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
  const gamePlayer = await db.oneOrNone(
    `SELECT * FROM "gamePlayers" WHERE game_id = $1 AND user_id = $2`,
    [gameId, userId],
  );

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

  const io = request.app.get("io");

  if (hostId !== userId) {
    console.log("You are not the host. You cannot start the game;");
    // response.status(403).send("You are not the host. You cannot start the game.");
    io.emit(`game:${gameId}:start:error`, {
      message: "Only the host can start the game",
    });
    return;
  }

  const players = await db.many(
    `SELECT * FROM "gamePlayers" WHERE game_id = $1`,
    [gameId],
  );

  // const gameState = new GameState(db, players.length); // update to this line later
  const gameState = new GameState(db, 4);
  await gameState.createGameState(parseInt(gameId));
  console.log("started game: ", gameId);

  io.to(gameId).emit(`chat-message:${gameId}`, {
    sender: "Dealer",
    message: "Game has started...",
    gravatar: "",
    timestamp: new Date().getTime(),
  });

  io.emit(`game:${gameId}:start:success`, {
    message: "Game started successfully",
  });

  io.to(gameId).emit(`game:${gameId}:started`, {
    currentTurn: 1,
    players: players.map((p) => ({ user_id: p.user_id, username: p.username })),
  });

  const shuffledCards = await Game.getShuffledCards();
  const playerCards = shuffledCards.slice(0, players.length * 2);
  const tableCards = shuffledCards.slice(
    players.length * 2,
    players.length * 2 + 5,
  );
  for (let i = 0; i < players.length; i++) {
    const playerId = players[i].game_player_id;
    const card1 = playerCards[i * 2];
    const card2 = playerCards[i * 2 + 1];
    await Game.createCardsHeldForPlayer(playerId, card1.card_id);
    await Game.createCardsHeldForPlayer(playerId, card2.card_id);
    const playerHand = await Game.getCardsHeldForPlayer(playerId);

    if (playerId === userId) {
      io.emit("dealCard", {
        value: card1.value,
        shape: card1.shape,
        playerId: userId,
      });
      io.emit("dealCard", {
        value: card2.value,
        shape: card2.shape,
        playerId: userId,
      });
    }
  }
  for (let i = 0; i < tableCards.length; i++) {
    const card = tableCards[i];
    await Game.createDealerCards(parseInt(gameId), card.card_id);
    io.emit("dealCard", {
      value: card.value,
      shape: card.shape,
      playerId: -1,
      isDealer: true,
    });
  }

  response.redirect(`/games/${gameId}`);
});

router.post("/:gameId/bet", async (request: Request, response: Response) => {
  const { gameId } = request.params;
  // @ts-ignore
  const { user_id: userId } = request.session.user;
  const { betAmount } = request.body;

  const user = await db.one(`SELECT * FROM users WHERE user_id = $1`, [userId]);

  const gameState = await GameState.load(db, parseInt(gameId));

  const players = await db.many(
    `SELECT * FROM "gamePlayers"
         WHERE game_id = $1 AND "is_playing" = true
         ORDER BY game_player_id`,
    [gameId],
  );

  const io = request.app.get("io");

  // if its not current user's turn
  if (players[gameState.getCurrentTurn()].user_id !== userId) {
    console.log("Not your turn");
    io.to(gameId).emit(`chat-message:${gameId}`, {
      sender: "Dealer",
      message: `It is not ${user.username}'s turn...`,
      gravatar: "",
      timestamp: new Date().getTime(),
    });
    response.sendStatus(403).json({ message: "Not your turn" });
    return;
  }

  gameState.addToPot(betAmount);
  io.to(gameId).emit(`chat-message:${gameId}`, {
    sender: "Dealer",
    message: `${user.username} has bet ${betAmount}...`,
    gravatar: "",
    timestamp: new Date().getTime(),
  });

  await db.none(
    `
    UPDATE "gamePlayers"
    SET stack = stack - $1
    WHERE game_id = $2 AND user_id = $3
  `,
    [betAmount, gameId, userId],
  );

  gameState.nextTurn();
  io.to(gameId).emit(`chat-message:${gameId}`, {
    sender: "Dealer",
    message: `It is now ${players[gameState.getCurrentTurn()].username}'s turn...`,
    gravatar: "",
    timestamp: new Date().getTime(),
  });

  response
    .status(200)
    .json({ message: `Bet of ${betAmount} placed successfully` });
});

router.post("/:gameId/fold", async (request: Request, response: Response) => {
  const { gameId } = request.params;
  // @ts-ignore
  const { user_id: userId } = request.session.user;
  const user = await db.one(`SELECT * FROM users WHERE user_id = $1`, [userId]);

  const gameState = await GameState.load(db, parseInt(gameId));

  const players = await db.many(
    `SELECT * FROM "gamePlayers"
         WHERE game_id = $1 AND "is_playing" = true
         ORDER BY game_player_id`,
    [gameId],
  );

  const io = request.app.get("io");

  // if its not current user's turn
  if (players[gameState.getCurrentTurn()].user_id !== userId) {
    console.log("Not your turn");
    io.to(gameId).emit(`chat-message:${gameId}`, {
      sender: "Dealer",
      message: `It is not ${user.username}'s turn...`,
      gravatar: "",
      timestamp: new Date().getTime(),
    });
    response.sendStatus(403).json({ message: "Not your turn" });
    return;
  }

  await gameState.fold(userId, parseInt(gameId));
  io.to(gameId).emit(`chat-message:${gameId}`, {
    sender: "Dealer",
    message: `${user.username} has folded...`,
    gravatar: "",
    timestamp: new Date().getTime(),
  });

  gameState.nextTurn();
  io.to(gameId).emit(`chat-message:${gameId}`, {
    sender: "Dealer",
    message: `It is now ${user.username}'s turn...`,
    gravatar: "",
    timestamp: new Date().getTime(),
  });

  response.status(200).json({ message: `${user.username} has folded...` });
});

export default router;
