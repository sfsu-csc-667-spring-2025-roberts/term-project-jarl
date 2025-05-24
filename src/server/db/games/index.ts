import db from "../connection";

const CREATE_SQL = `
INSERT INTO games (name, min_players, max_players, password)
VALUES ($1, $2, $3, $4)
RETURNING game_id
`;

const create = async (
  creator: number,
  name?: string,
  min?: number,
  max?: number,
  password?: string,
) => {
  const { game_id } = await db.one(CREATE_SQL, [name, min, max, password]);
  await join(game_id, creator, true);
  return game_id;
};

const JOIN_SQL = `
INSERT INTO "gamePlayers" (game_id, user_id, is_host)
VALUES ($1, $2, $3)
`;

const join = async (gameId: number, userId: number, isHost = false) => {
  await db.none(JOIN_SQL, [gameId, userId, isHost]);
};

const CONDITIONALLY_JOIN_SQL = `
INSERT INTO "gamePlayers" (game_id, user_id)
SELECT $[gameId], $[userId]
WHERE NOT EXISTS (
  SELECT 1
  FROM "gamePlayers"
  WHERE game_id = $[gameId] AND user_id = $[userId]
)
AND EXISTS (
  SELECT 1
  FROM games
  WHERE game_id = $[gameId] AND (password IS NULL OR password = $[password] OR (password = '' AND $[password] IS NULL))
)
AND (
  SELECT COUNT(*)
  FROM "gamePlayers"
  WHERE game_id = $[gameId]
) < (
  SELECT max_players
  FROM games
  WHERE game_id = $[gameId]
)
RETURNING game_id, user_id
`;

const conditionalJoin = async (
  gameId: number,
  userId: number,
  password: string,
) => {
  // Insert the player into the game
  await db.one(CONDITIONALLY_JOIN_SQL, {
    gameId,
    userId,
    password,
  });

  // Calculate the player count for the game
  const { count } = await db.one(
    `
    SELECT COUNT(*)
    FROM "gamePlayers"
    WHERE game_id = $1
    `,
    [gameId],
  );

  return count;
};

const playerCount = async (gameId: number) => {
  const { count } = await db.one(
    "SELECT COUNT(*) FROM gamePlayers WHERE game_id = $1",
    [gameId],
  );
};

const leaveGame = async (gameId: number, userId: number) => {
  await db.none(
    `
    DELETE FROM "gamePlayers"
    WHERE game_id = $1 AND user_id = $2
    `,
    [gameId, userId],
  );

  const { count } = await db.one(
    `
    SELECT COUNT(*)
    FROM "gamePlayers"
    WHERE game_id = $1
    `,
    [gameId],
  );
  return count;
};

const findHostId = async (gameId: number) => {
  const { user_id } = await db.one(
    `
    SELECT user_id
    FROM "gamePlayers"
    WHERE game_id = $1 AND is_host = true
    `,
    [gameId],
  );
  return user_id;
};

const getShuffledCards = async () => {
  const cards = await db.manyOrNone(
    `
    SELECT *
    FROM cards
    ORDER BY RANDOM()
    `,
  );
  return cards;
};

const CREATE_CARDS_HELD_SQL = `
  INSERT INTO "cardsHeld" (game_player_id, card_id)
  VALUES ($1, $2)
`;
const GET_CARDS_HELD_SQL = `
  SELECT card_held_id, game_player_id, card_id
  FROM "cardsHeld"
  WHERE game_player_id = $1
  ORDER BY card_held_id
`;

const createCardsHeldForPlayer = async (
  gamePlayerId: number,
  cardId: number,
) => {
  await db.none(CREATE_CARDS_HELD_SQL, [gamePlayerId, cardId]);
};

const getCardsHeldForPlayer = async (gamePlayerId: number) => {
  const cardsHeld = await db.manyOrNone(GET_CARDS_HELD_SQL, [gamePlayerId]);
  return cardsHeld;
};

const createDealerCards = async (gameId: number, cardId: number) => {
  await db.none(
    `
    INSERT INTO "gameCards" (game_id, card_id)
    VALUES ($1, $2)`,
    [gameId, cardId],
  );
};

const getDealerCards = async (gameId: number) => {
  const cardsHeld = await db.manyOrNone(
    `
    SELECT *
    FROM "gameCards"
    WHERE game_id = $1
    ORDER BY game_card_id
  `,
    [gameId],
  );
  return cardsHeld;
};

const GET_ALL_GAMES_SQL = `SELECT game_id, password FROM games ORDER BY game_id DESC`;

const getAllGames = async () => {
  const games = await db.manyOrNone(GET_ALL_GAMES_SQL);
  return games;
};

export default {
  create,
  join,
  conditionalJoin,
  playerCount,
  leaveGame,
  findHostId,
  getShuffledCards,
  createCardsHeldForPlayer,
  getCardsHeldForPlayer,
  getAllGames,
  createDealerCards,
  getDealerCards,
};
