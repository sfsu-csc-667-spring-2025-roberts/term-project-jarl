"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const games_1 = __importDefault(require("../db/games"));
const game_1 = require("../db/models/game");
const router = express_1.default.Router();
router.get("/", auth_1.isAuthenticated, async (req, res) => {
    try {
        const activeGames = await games_1.default.findActiveGames();
        res.render("lobby", { games: activeGames, user: req.session.user });
    }
    catch (error) {
        console.error("Error fetching games:", error);
        res.status(500).send("Server error");
    }
});
router.post("/create", auth_1.isAuthenticated, async (req, res) => {
    var _a, _b;
    try {
        console.log("Create game request:", req.body);
        let name, maxPlayers;
        if (typeof req.body === 'object') {
            name = req.body.name || req.body.gameName;
            maxPlayers = req.body.maxPlayers || req.body.max_players;
        }
        if (!name || !maxPlayers) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }
        const parsedMaxPlayers = parseInt(maxPlayers);
        if (isNaN(parsedMaxPlayers) || parsedMaxPlayers < 2 || parsedMaxPlayers > 8) {
            return res.status(400).json({ success: false, message: "Invalid player count (2-8)" });
        }
        const result = await games_1.default.create(name, parsedMaxPlayers, req.session.user.id);
        const isAjax = req.xhr || ((_a = req.headers.accept) === null || _a === void 0 ? void 0 : _a.includes('application/json'));
        if (isAjax) {
            return res.json({ success: true, game_id: result.id });
        }
        else {
            return res.redirect(`/games/${result.id}`);
        }
    }
    catch (error) {
        console.error("Error creating game:", error);
        const isAjax = req.xhr || ((_b = req.headers.accept) === null || _b === void 0 ? void 0 : _b.includes('application/json'));
        if (isAjax) {
            return res.status(500).json({ success: false, message: "Server error" });
        }
        else {
            return res.status(500).send("Server error");
        }
    }
});
router.get("/:id", auth_1.isAuthenticated, async (req, res) => {
    try {
        const gameId = parseInt(req.params.id);
        if (isNaN(gameId)) {
            return res.status(400).send("Invalid game ID");
        }
        const game = await games_1.default.findById(gameId);
        if (!game) {
            return res.status(404).send("Game not found");
        }
        if (game.state === game_1.GameState.FINISHED) {
            return res.redirect("/");
        }
        res.render("games", { game, user: req.session.user });
    }
    catch (error) {
        console.error("Error joining game:", error);
        res.status(500).send("Server error");
    }
});
exports.default = router;
//# sourceMappingURL=games.js.map