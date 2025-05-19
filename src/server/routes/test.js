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
// src/server/routes/test.ts
const express_1 = __importDefault(require("express"));
const connection_1 = __importDefault(require("../db/connection"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db");
const router = express_1.default.Router();
router.post("/test", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      // Use db.none for queries that don't return data
      yield connection_1.default.none(
        "INSERT INTO test_table (test_string) VALUES ($1)",
        ["Test successful at " + new Date().toISOString()],
      );
      // Use db.any for queries that return multiple rows
      const result = yield connection_1.default.any("SELECT * FROM test_table");
      res.json({ success: true, result });
    } catch (error) {
      console.error("Error in test route:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }),
);
router.get("/promise_version", (request, response) => {
  connection_1.default
    .none("INSERT INTO test_table (test_string) VALUES ($1)", [
      `Test string ${new Date().toISOString()}`,
    ])
    .then(() => {
      return connection_1.default.any("SELECT * FROM test_table");
    })
    .then((result) => {
      response.json(result);
    })
    .catch((error) => {
      console.error(error);
      response.status(500).json({ error: "Internal Server Error" });
    });
});
router.get("/socket", (request, response) => {
  const io = request.app.get("io");
  // @ts-ignore
  io.emit("test", { user: request.session.user });
  // @ts-ignore
  io.to(request.session.user.id).emit("test", { secret: "hi" });
  response.json({ message: "Socket event emitted" });
});
router.get("/games", (request, response) =>
  __awaiter(void 0, void 0, void 0, function* () {
    response.render("test/games");
  }),
);
router.get("/games/test-user", (request, response) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const user = yield connection_1.default.one(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING user_id",
      [
        `${crypto_1.default.randomUUID()}@example.com`,
        yield bcrypt_1.default.hash("password", 10),
      ],
    );
    response.json({ user });
  }),
);
router.get("/games/create", (request, response) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { gameName, gameMinPlayers, gameMaxPlayers, gamePassword } =
      request.body;
    try {
      const gameId = yield connection_1.default.one(
        "INSERT INTO games(name, min_players, max_players, password) VALUES ($1, $2, $3, $4) RETURNING game_id",
        [gameName, gameMinPlayers, gameMaxPlayers, gamePassword],
      );
      response.json({ gameId });
    } catch (error) {
      console.error("error creating game: ", error);
      response.status(500).send("error creating game");
    }
  }),
);
router.post("/games/join", (request, response) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const { gameId, userId, gamePassword } = request.body;
    try {
      const playerCount = yield db_1.Game.conditionalJoin(
        gameId,
        userId,
        gamePassword,
      );
      response.json({ playerCount });
    } catch (error) {
      console.log("error joining game: ", error);
      response.status(500).send("error joining game");
    }
  }),
);
exports.default = router;
