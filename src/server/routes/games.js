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
// src/server/routes/games.ts
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const connection_1 = __importDefault(require("../db/connection"));
const router = express_1.default.Router();
// --- Create game route ---
router.post("/create", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const { user_id: userId, email, gravatar } = req.session.user;
    const { gameName, gameMinPlayers, gameMaxPlayers, gamePassword } = req.body;
    try {
      const gameId = yield db_1.Game.create(
        userId,
        gameName,
        gameMinPlayers,
        gameMaxPlayers,
        gamePassword,
      );
      const io = req.app.get("io");
      io.emit("game:created", {
        gameId,
        gameName:
          gameName !== null && gameName !== void 0
            ? gameName
            : `Game ${gameId}`,
        gameMinPlayers,
        gameMaxPlayers,
        hasPassword: !!gamePassword,
        host: { user_id: userId, email, gravatar },
      });
      res.redirect(`/games/${gameId}`);
    } catch (err) {
      console.error("error creating game:", err);
      res.status(500).send("Error creating game");
    }
  }),
);
// --- Join game route ---
router.post("/join", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const { user_id: userId, email, gravatar } = req.session.user;
    const { gameId, gamePassword } = req.body;
    try {
      const playerCount = yield db_1.Game.conditionalJoin(
        gameId,
        userId,
        gamePassword,
      );
      const io = req.app.get("io");
      io.emit(`game:${gameId}:player-joined`, {
        playerCount,
        userId,
        email,
        gravatar,
      });
      res.redirect(`/games/${gameId}`);
    } catch (error) {
      console.error("error joining game:", error);
      res.status(500).send("Error joining game");
    }
  }),
);
// --- View game page ---
router.get("/:gameId", (req, res) => {
  const { gameId } = req.params;
  // @ts-ignore
  const user = req.session.user;
  res.render("games", { gameId, user });
});
// --- Start game ---
router.post("/:id/start", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    const gameId = parseInt(req.params.id);
    try {
      // ✅ FINAL FIX: Use correct column name "id"
      yield connection_1.default.none(
        "UPDATE games SET state = 'started' WHERE id = $1",
        [gameId],
      );
      const io = req.app.get("io");
      io.emit(`game:${gameId}:started`, { gameId });
      res.status(200).json({ message: "Game started successfully." });
    } catch (error) {
      console.error("Failed to start game:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }),
);
exports.default = router;
