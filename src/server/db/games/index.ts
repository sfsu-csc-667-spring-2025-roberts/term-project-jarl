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

export default { create, join };
