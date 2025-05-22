import { Server } from "socket.io";
import db from "../connection";
import { default as Game } from "./index";
import { Request, Response } from "express";

// TODO add logic for resetting game
const rotationLogic = async (
  gameId: number,
  userId: number,
  betAmount: number,
  request: Request,
  response: Response,
) => {
  const io = request.app.get<Server>("io");

  const currGame = await db.one(`SELECT * FROM games WHERE game_id = $1`, [
    gameId,
  ]);

  const currTurn = await db.one(`SELECT turn FROM games WHERE game_id = $1`, [
    gameId,
  ]);

  if (currGame.round === 0 && currTurn === 1) {
    await db.none(`UPDATE games SET min_bet = $1 WHERE game_id = $2`, [
      betAmount,
      gameId,
    ]);
  }

  const players = await db.manyOrNone(
    `SELECT * FROM "gamePlayers"
         WHERE game_id = $1 AND "isPlaying" = true
         ORDER BY game_player_id`,
    [gameId],
  );

  await db.none(`UPDATE games SET pot_size = $1 WHERE game_id = $2`, [
    currGame.pot_size + betAmount,
    gameId,
  ]);

  io.emit("game:bet", {
    message: `Player ${players[currTurn - 1].username} has bet ${betAmount}`,
    betAmount,
    currPotSize: currGame.pot_size + betAmount,
  });

  let nextTurn = (currTurn + 1) % players.length;
  if (nextTurn === 0) {
    nextTurn = 1;
  }

  let nextRound = currGame.round;
  if (nextTurn === 1) {
    nextRound = (currGame.round + 1) % 5;
    // if (nextRound === 0) {
    //   nextRound = 1;
    // }
  }

  await db.none(`UPDATE games SET turn = $1, round = $2 WHERE game_id = $3`, [
    nextTurn,
    nextRound,
    gameId,
  ]);

  io.emit(`game:${gameId}:turn`, {
    message: `It's Player ${players[nextTurn - 1].username}'s turn`,
    nextPlayer: players[nextTurn - 1],
  });

  if (nextRound === 1 && nextTurn === 1) {
    await dealCards(gameId, request);
  }

  if (nextRound === 2 && nextTurn === 1) {
    const communityCards = await db.one(
      `SELECT * FROM gameCards WHERE game_id = $1`,
      [gameId],
    );
    io.emit(`game:${gameId}:turnCard`, {
      message: `Turn card dealt: ${communityCards[3].value} of ${communityCards[3].shape}`,
      turnCard: communityCards[3],
    });
  }

  if (nextRound === 3 && nextTurn === 1) {
    const communityCards = await db.one(
      `SELECT * FROM gameCards WHERE game_id = $1`,
      [gameId],
    );
    io.emit(`game:${gameId}:riverCard`, {
      message: `River card dealt: ${communityCards[4].value} of ${communityCards[4].shape}`,
      riverCard: communityCards[4],
    });
  }

  if (nextRound === 4 && nextTurn === 1) {
    // determine winner
    // const winner = await Game.determineWinner(gameId);
    // io.emit(`game:${gameId}:winner`, {
    //   message: `Player ${winner.username} wins!`,
    //   winner,
    // });
  }
};

const dealCards = async (gameId: number, request: Request) => {
  const io = request.app.get<Server>("io");

  const players = await db.manyOrNone(
    `SELECT * FROM "gamePlayers"
         WHERE game_id = $1 AND "isPlaying" = true
         ORDER BY game_player_id`,
    [gameId],
  );
  if (!players || players.length === 0) {
    console.log("not enough players");
    return;
  }
  const shuffledCards = await Game.getShuffledCards();
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const cardId1 = shuffledCards[i * 2].card_id;
    const cardId2 = shuffledCards[i * 2 + 1].card_id;
    await db.none(
      `INSERT INTO "cardsHeld" (game_player_id, card_id)
             VALUES ($1, $2), ($1, $3)`,
      [player.game_player_id, cardId1, cardId2],
    );

    console.log(
      `Cards dealt to Player ${player.game_player_id}: ${cardId1}, ${cardId2}`,
    );
  }

  const communityCards = shuffledCards.slice(
    players.length * 2,
    players.length * 2 + 5,
  );

  for (let i = 0; i < communityCards.length; i++) {
    const cardId = communityCards[i].card_id;
    await db.none(
      `INSERT INTO gameCards (game_id, card_id)
             VALUES ($1, $2)`,
      [gameId, cardId],
    );
    console.log(`Flop card ${i + 1} dealt: ${cardId}`);
  }

  let cardsHeld = [];
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    cardsHeld = await db.manyOrNone(
      `SELECT * FROM "cardsHeld"
             WHERE game_player_id = $1`,
      [player.game_player_id],
    );
    console.log(
      `Player ${player.game_player_id} cards: ${cardsHeld.map((card) => card.card_id).join(", ")}`,
    );
  }

  const flopCards = communityCards.slice(0, 3);

  io.emit(`game:${gameId}:dealCards`, {
    cardsHeld,
    flopCards,
  });
  console.log(
    `Flop cards dealt: ${flopCards.map((card) => card.card_id).join(", ")}`,
  );
};

export { rotationLogic };
