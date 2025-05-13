"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const connection_1 = __importDefault(require("../db/connection"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const game_1 = __importDefault(require("../db/models/game"));
const router = express_1.default.Router();
router.post("/test", async (req, res) => {
    try {
        await connection_1.default.none("INSERT INTO test_table (test_string) VALUES ($1)", [
            "Test successful at " + new Date().toISOString(),
        ]);
        const result = await connection_1.default.any("SELECT * FROM test_table");
        res.json({ success: true, result });
    }
    catch (error) {
        console.error("Error in test route:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/promise_version", (request, response) => {
    connection_1.default.none("INSERT INTO test_table (test_string) VALUES ($1)", [
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
    io.emit("test", { user: request.session.user });
    io.to(request.session.user.id).emit("test", { secret: "hi" });
    response.json({ message: "Socket event emitted" });
});
router.get("/games", async (request, response) => {
    response.render("test/games");
});
router.get("/games/test-user", async (request, response) => {
    const user = await connection_1.default.one("INSERT INTO users (email, password) VALUES ($1, $2) RETURNING user_id", [`${crypto_1.default.randomUUID()}@example.com`, await bcrypt_1.default.hash("password", 10)]);
    response.json({ user });
});
router.get("/games/create", async (request, response) => {
    const { gameName, max_players, created_by } = request.body;
    try {
        const game = await game_1.default.create(gameName, max_players, created_by);
        response.json({ gameId: game.id });
    }
    catch (error) {
        console.error("error creating game: ", error);
        response.status(500).send("error creating game");
    }
});
router.post("/games/join", async (request, response) => {
    const { gameId, userId, seat_position } = request.body;
    try {
        const result = await game_1.default.addPlayer(parseInt(gameId, 10), parseInt(userId, 10), parseInt(seat_position, 10));
        response.json({ current_players: result.current_players });
    }
    catch (error) {
        console.log("error joining game: ", error);
        response.status(500).send("error joining game");
    }
});
exports.default = router;
//# sourceMappingURL=test.js.map