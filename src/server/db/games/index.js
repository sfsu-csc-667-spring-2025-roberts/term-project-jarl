"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const connection_1 = __importDefault(require("../connection"));
const CREATE_SQL = `
INSERT INTO games (name, min_players, max_players, password, created_by, state)
VALUES ($1, $2, $3, $4, $5, 'waiting')
RETURNING id
`;
const create = (creator, name, min, max, password) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { id } = yield connection_1.default.one(CREATE_SQL, [
      name !== null && name !== void 0 ? name : "",
      min !== null && min !== void 0 ? min : 2,
      max !== null && max !== void 0 ? max : 4,
      password !== null && password !== void 0 ? password : "",
      creator,
    ]);
    yield join(id, creator, true);
    return id;
  });
const JOIN_SQL = `
INSERT INTO game_players (game_id, user_id, is_host, seat_position)
VALUES ($1, $2, $3, (
  SELECT COALESCE(MAX(seat_position), 0) + 1 FROM game_players WHERE game_id = $1
))
`;
const join = (gameId_1, userId_1, ...args_1) =>
  __awaiter(
    void 0,
    [gameId_1, userId_1, ...args_1],
    void 0,
    function* (gameId, userId, isHost = false) {
      yield connection_1.default.none(JOIN_SQL, [gameId, userId, isHost]);
    },
  );
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
const conditionalJoin = (gameId, userId, password) =>
  __awaiter(void 0, void 0, void 0, function* () {
    yield connection_1.default.one(CONDITIONALLY_JOIN_SQL, {
      gameId,
      userId,
      password,
    });
    const { count } = yield connection_1.default.one(
      `SELECT COUNT(*) FROM "gamePlayers" WHERE game_id = $1`,
      [gameId],
    );
    return count;
  });
const playerCount = (gameId) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { count } = yield connection_1.default.one(
      "SELECT COUNT(*) FROM gamePlayers WHERE game_id = $1",
      [gameId],
    );
    return count;
  });
exports.Game = { create, join, conditionalJoin, playerCount };
exports.default = exports.Game;
