import db from "../connection";

const CREATE_SQL = `
INSERT INTO games (name, min_players, max_players, password, created_by, state)
VALUES ($1, $2, $3, $4, $5, 'waiting')
RETURNING id
`;

const create = async (
  creator: number,
  name?: string,
  min?: number,
  max?: number,
  password?: string,
) => {
  const { id } = await db.one(CREATE_SQL, [
    name ?? "",
    min ?? 2,
    max ?? 4,
    password ?? "",
    creator,
  ]);

  await join(id, creator, true);
  return id;
};

const JOIN_SQL = `
INSERT INTO game_players (game_id, user_id, is_host, seat_position)
VALUES ($1, $2, $3, (
  SELECT COALESCE(MAX(seat_position), 0) + 1 FROM game_players WHERE game_id = $1
))
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
  WHERE id = $[gameId]
    AND (password IS NULL OR password = $[password] OR (password = '' AND $[password] IS NULL))
)
AND (
  SELECT COUNT(*)
  FROM "gamePlayers"
  WHERE game_id = $[gameId]
) < (
  SELECT max_players
  FROM games
  WHERE id = $[gameId]
)
RETURNING game_id, user_id
`;

const conditionalJoin = async (
  gameId: number,
  userId: number,
  password: string,
) => {
  await db.one(CONDITIONALLY_JOIN_SQL, {
    gameId,
    userId,
    password,
  });

  const { count } = await db.one(
    `SELECT COUNT(*) FROM "gamePlayers" WHERE game_id = $1`,
    [gameId],
  );

  return count;
};

const playerCount = async (gameId: number) => {
  const { count } = await db.one(
    "SELECT COUNT(*) FROM gamePlayers WHERE game_id = $1",
    [gameId],
  );
  return count;
};

export const Game = { create, join, conditionalJoin, playerCount };
export default Game;
