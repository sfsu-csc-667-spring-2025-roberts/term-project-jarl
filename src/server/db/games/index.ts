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

const CONDITIONAL_JOIN_SQL = `
    INSERT INTO gamePlayers (game_id, user_id)
    SELECT $(gameId), $(userId) 
    WHERE NOT EXISTS (
    SELECT 'value-doesnt-matter' 
    FROM gamePlayers 
    WHERE game_id=$(gameId) AND user_id=$(userId)
    )
    AND (
    SELECT COUNT(*) FROM games WHERE id=$(gameId) AND password=$(password)
    ) = 1
    AND (
    (
        SELECT COUNT(*) FROM gamePlayers WHERE game_id=$(gameId)
    ) < (
        SELECT max_players FROM games WHERE id=$(gameId)
    )
    )
    RETURNING (
    SELECT COUNT(*) FROM gamePlayers WHERE game_id=$(gameId)
    )
`;

const conditionalJoin = async (
  gameId: number,
  userId: number,
  password: string,
) => {
  const { player_count } = await db.one(CONDITIONAL_JOIN_SQL, [
    gameId,
    userId,
    password,
  ]);
  return player_count;
};

const playerCount = async (gameId: number) => {
  const { count } = await db.one(
    "SELECT COUNT(*) FROM gamePlayers WHERE game_id = $1",
    [gameId],
  );
};

export default { create, join, conditionalJoin, playerCount };
