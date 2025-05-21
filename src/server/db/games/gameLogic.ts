import { socket } from "./socket";
import { db } from "../db/connection";
import { default as Game } from "./index";

// maybe i should have a function for each round in the game
// so after each round, they should make a post request that says last person in that round is done
// and we can determine that by the turns/number of players playing

// so i should have initGame/round0 for shuffling cards, setting each player isPlaying to true
// resetting pot, getting small/big blinds maybe

// round 1 will give each player their cards, show flop, then bet

// round 2 will show turn, then bet

// round 3 is river then bet

// round4 is determining winner

// if there were multiple games having a global variable might affect it,
// might change it everytime initGame called

// so from the client, everytime, they will make a post request to some bet request or fold request
// the bet request just updates pot size and increments or resets to 0 the turn in games and fold just
// sets that player to isPlaying=false and just skip them everytime the turn is on them

// everytime turn will reset back to 0, round will increment and e.g. round 2/3 (showing turn/river card will be ran)

/*
i think the start game route just says game has started and then increases turn to next turn
then this function should be called in the bet route

theres actually something wrong with my logic bc dealer doesnt send a post route so it gets stuck at turn 0
maybe every socket event here sends to the same one, which gets sent to game chat?
gameLogicFactory(gameId, userId, turn, gamePlayerId, round, betAmount)
    if round === 0 and turn === 0
        send a socket saying game has started (or this should be in start game post route)
    if round === 0 and turn === 1
        set betAmount to be the minimum bet
    
    then deal with player turns
    get all players in the game
    get the current turn, if it equals curr num of players, reset to 1, else add 1 
    update round as well if turn === curr num of players, 
        if round === 4, reset to 1 else add 1
    update game table with new turn and round
    send socket event saying it's players turn
    
    if round === 1 and turn === 1
        dealCards(create a pair of cardsHeld, create the 5 in the middle and send to client)add 5 to gameCards?
        create a pair of cardsHeld for each player, 
        create 5 cards in middle insert into gameCards but only send 3
    if round === 2 and turn === 1
        get cards from gameCards and send the turn card (3rd index)
    if round === 3 and turn === 1
        get cards from gameCards and send the river card (4th index)
    if round === 4 and turn === 1
        determine winner (maybe create a function for this)
*/

// create gameLogicFactory function
const gameLogicFactory = async (
  gameId: number,
  userId: number,
  turn: number,
  gamePlayerId: number,
  round: number,
  betAmount: number,
) => {
  // if round === 0 and turn === 0
  //     send a socket saying game has started (or this should be in start game post route)
  // if round === 0 and turn === 1
  //     set betAmount to be the minimum bet

  // then deal with player turns
  // get all players in the game
  // get the current turn, if it equals curr num of players, reset to 1, else add 1
  // update round as well if turn === curr num of players,
  //     if round === 4, reset to 1 else add 1
  // update game table with new turn and round
  // send socket event saying it's players turn

  // if round === 1 and turn === 1
  //     dealCards(create a pair of cardsHeld, create the 5 in the middle and send to client)add 5 to gameCards?
  //     create a pair of cardsHeld for each player,
  //     create 5 cards in middle insert into gameCards but only send 3
  // if round === 2 and turn === 1
  //     get cards from gameCards and send the turn card (3rd index)
  // if round === 3 and turn === 1
  //     get cards from gameCards and send the river card (4th index)
  // if round === 4 and turn === 1
  //     determine winner (maybe create a function for this)

  if (round === 0 && turn === 1) {
    // set betAmount to be the minimum bet
    await db.none(`UPDATE games SET min_bet = $1 WHERE game_id = $2`, [
      betAmount,
      gameId,
    ]);
  }
  // get all players in the game
  const players = await db.manyOrNone(
    `SELECT * FROM "gamePlayers"
         WHERE game_id = $1 AND 
         ORDER BY game_player_id`,
    [gameId],
  );

  const currTurn = await db.one(`SELECT turn FROM games WHERE game_id = $1`, [
    gameId,
  ]);

  // get the current turn, if it equals curr num of players, reset to 1, else add 1
  let nextTurn = (currTurn.turn + 1) % players.length;
  if (nextTurn === 0) {
    nextTurn = 1;
  }
  // update round as well if turn === curr num of players,
  //     if round === 4, reset to 1 else add 1
  let nextRound = round;
  if (nextTurn === 1) {
    nextRound = (round + 1) % 5;
    if (nextRound === 0) {
      nextRound = 1;
    }
  }
  // update game table with new turn and round
  await db.none(`UPDATE games SET turn = $1, round = $2 WHERE game_id = $3`, [
    nextTurn,
    nextRound,
    gameId,
  ]);
  // send socket event saying it's players turn
  socket.emit(`game:${gameId}:turn`, {
    message: `It's Player ${players[nextTurn - 1].username}'s turn`,
    nextPlayer: players[nextTurn - 1],
  });

  // if round === 1 and turn === 1
  //     dealCards(create a pair of cardsHeld, create the 5 in the middle and send to client)add 5 to gameCards?
  //     create a pair of cardsHeld for each player,
  //     create 5 cards in middle insert into gameCards but only send 3
  if (round === 1 && turn === 1) {
    await dealCards(gameId);
  }
  // if round === 2 and turn === 1
  //     get cards from gameCards and send the turn card (3rd index)
  if (round === 2 && turn === 1) {
    const communityCards = await db.one(
      `SELECT * FROM gameCards WHERE game_id = $1`,
      [gameId],
    );
    socket.emit(`game:${gameId}:turnCard`, {
      message: `Turn card dealt: ${communityCards[3].value} of ${communityCards[3].shape}`,
      turnCard: communityCards[3],
    });
  }
  // if round === 3 and turn === 1
  //     get cards from gameCards and send the river card (4th index)
  if (round === 3 && turn === 1) {
    const communityCards = await db.one(
      `SELECT * FROM gameCards WHERE game_id = $1`,
      [gameId],
    );
    socket.emit(`game:${gameId}:riverCard`, {
      message: `River card dealt: ${communityCards[4].value} of ${communityCards[4].shape}`,
      riverCard: communityCards[4],
    });
  }
  // if round === 4 and turn === 1
  //     determine winner (maybe create a function for this)
  if (round === 4 && turn === 1) {
    // determine winner
    const winner = await Game.determineWinner(gameId);
    socket.emit(`game:${gameId}:winner`, {
      message: `Player ${winner.username} wins!`,
      winner,
    });
  }
};

const dealCards = async (gameId: number) => {
  const players = await db.manyOrNone(
    `SELECT * FROM "gamePlayers"
         WHERE game_id = $1 AND
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
  // Create the flop, turn, and river cards
  const communityCards = shuffledCards.slice(
    players.length * 2,
    players.length * 2 + 5,
  );
  // insert into gameCards table
  for (let i = 0; i < communityCards.length; i++) {
    const cardId = communityCards[i].card_id;
    await db.none(
      `INSERT INTO gameCards (game_id, card_id)
             VALUES ($1, $2)`,
      [gameId, cardId],
    );
    console.log(`Flop card ${i + 1} dealt: ${cardId}`);
  }
  // loop through players array, and get each player's card in cardsHeld and store in an array
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

  // send through a socket event cardsHeld and flopCards
  socket.emit(`game:${gameId}:dealCards`, {
    cardsHeld,
    flopCards,
  });
  console.log(
    `Flop cards dealt: ${flopCards.map((card) => card.card_id).join(", ")}`,
  );
};

// or maybe create gameCards elements for those cards and game id

// i think with the way i have gameLogicFactory set up, initGame shouldnt do anything
// everything starts with round === 1 and turn === 0, where player cards and flop are created
// or maybe this should just check if there are enough players
const initializeGame = async (gameId: number) => {
  const shuffledCards = await Game.getShuffledCards();

  await db.none(
    `
    UPDATE gamePlayers SET "isPlaying" = true WHERE game_id = $1`,
    [gameId],
  );

  const players = await db.manyOrNone(
    `SELECT * FROM "gamePlayers"
     WHERE game_id = $1 AND "isPlaying" = true 
     ORDER BY game_player_id`,
    [gameId],
  );

  if (players.length < 2) {
    console.log("not enough players");
    return;
  }

  //   // Assign small blind and big blind
  //   const smallBlindPlayer = players[0];
  //   const bigBlindPlayer = players[1];

  //   await db.tx(async (t) => {
  //     await t.none(
  //       `UPDATE "gamePlayers" SET curr_bets = $1 WHERE game_player_id = $2`,
  //       [smallBlindAmount, smallBlindPlayer.game_player_id],
  //     );

  //     await t.none(
  //       `UPDATE gamePlayers SET curr_bets = $1 WHERE game_player_id = $2`,
  //       [bigBlindAmount, bigBlindPlayer.game_player_id],
  //     );

  //     await t.none(
  //       `UPDATE games SET pot_size = $1, min_bet = $2, current_turn = $3, round = 0 WHERE game_id = $4`,
  //       [smallBlindAmount + bigBlindAmount, bigBlindAmount, smallBlindPlayer.seat, gameId],
  //     );

  //     await t.none(
  //       `UPDATE gamePlayers SET isTurn = (seat = $1) WHERE game_id = $2`,
  //       [smallBlindPlayer.seat, gameId],
  //     );
  //   });

  //   console.log(`Game ${gameId} initialized. Small blind: Player ${smallBlindPlayer.seat}, Big blind: Player ${bigBlindPlayer.seat}`);
};

const rotateTurns = async (gameId: number) => {
  // Fetch all active players in the game, ordered by their seat
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

  // Fetch the current turn from the games table
  const game = await db.one(`SELECT turn FROM games WHERE game_id = $1`, [
    gameId,
  ]);

  const currentTurnIndex = players.findIndex(
    (player) => player.seat === game.current_turn,
  );

  // Determine the next player's turn
  let nextTurnIndex = (currentTurnIndex + 1) % players.length;

  // Update the database to set the next player's turn
  await db.tx(async (t) => {
    // Reset all players' turns to false
    await t.none(`UPDATE gamePlayers SET isTurn = false WHERE game_id = $1`, [
      gameId,
    ]);

    // Set the next player's turn to true
    const nextPlayer = players[nextTurnIndex];
    await t.none(
      `UPDATE gamePlayers SET isTurn = true WHERE game_player_id = $1`,
      [nextPlayer.game_player_id],
    );

    // Update the game's current_turn to the next player's seat
    await t.none(`UPDATE games SET current_turn = $1 WHERE game_id = $2`, [
      nextPlayer.seat,
      gameId,
    ]);
  });

  console.log(
    `Turn rotated. It's now Player ${players[nextTurnIndex].seat}'s turn.`,
  );
};
